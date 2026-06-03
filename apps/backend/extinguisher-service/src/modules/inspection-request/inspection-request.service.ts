import {
  AdminAlertType,
  InspectionRequest,
  InspectionRequestStatus,
  Paginated,
  UserRole,
} from '@fire-system/shared-types';
import {
  AppError,
  buildPaginated,
  inspectionAssignedEmailHtml,
  inspectionAssignedEmailPlain,
  inspectionRequestStatusEmailHtml,
  newInspectionRequestAdminEmailHtml,
} from '@fire-system/shared-utils';
import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { notify } from '../../utils/notifier';
import { alertRepository } from '../alerts/alert.repository';
import { setExtinguisherUnderInspection } from '../extinguisher/extinguisher-status.sync';
import { extinguisherRepository } from '../extinguisher/extinguisher.repository';
import { inspectionRepository } from '../inspection/inspection.repository';
import { inspectionRequestRepository } from './inspection-request.repository';
import type { z } from 'zod';
import type { createInspectionRequestSchema, reviewInspectionRequestSchema } from './inspection-request.validation';

type CreateDto = z.infer<typeof createInspectionRequestSchema>;
type ReviewDto = z.infer<typeof reviewInspectionRequestSchema>;

async function adminEmails(): Promise<string[]> {
  const { rows } = await pool.query<{ email: string }>(
    `SELECT email FROM users WHERE role = 'ADMIN'::user_role AND is_active = TRUE`,
  );
  return rows.map((r) => r.email);
}

async function userEmail(userId: string): Promise<{ email: string; name: string } | null> {
  const { rows } = await pool.query<{ email: string; first_name: string; last_name: string }>(
    'SELECT email, first_name, last_name FROM users WHERE id = $1',
    [userId],
  );
  if (!rows[0]) return null;
  return { email: rows[0].email, name: `${rows[0].first_name} ${rows[0].last_name}` };
}

export const inspectionRequestService = {
  async create(dto: CreateDto, userId: string): Promise<InspectionRequest> {
    const ext = await extinguisherRepository.findById(dto.extinguisherId);
    if (!ext) throw AppError.notFound('Extinguisher not found');

    const req = await inspectionRequestRepository.create({
      extinguisherId: dto.extinguisherId,
      requestedBy: userId,
      preferredAt: dto.preferredAt,
      notes: dto.notes,
    });

    const requester = await userEmail(userId);
    await alertRepository.create({
      alertType: AdminAlertType.INSPECTION_REQUEST,
      title: `Inspection request: ${ext.serialNumber}`,
      message: `${requester?.name ?? 'User'} requested inspection for ${ext.serialNumber}.`,
      extinguisherId: ext.id,
      requestId: req.id,
    });

    const preferred = dto.preferredAt.toLocaleString();
    const plain = `New inspection request from ${requester?.name} for ${ext.serialNumber} at ${preferred}.`;
    const html = newInspectionRequestAdminEmailHtml(requester?.name ?? 'Facility manager', ext.serialNumber, preferred);
    for (const email of await adminEmails()) {
      await notify(email, 'New inspection request — TWZ Ltd', plain, html);
    }

    return (await inspectionRequestRepository.findById(req.id)) ?? req;
  },

  async list(
    filters: { status?: InspectionRequestStatus; requestedBy?: string },
    page: number,
    pageSize: number,
  ): Promise<Paginated<InspectionRequest>> {
    const offset = (page - 1) * pageSize;
    const { items, total } = await inspectionRequestRepository.list({
      ...filters,
      limit: pageSize,
      offset,
    });
    return buildPaginated(items, total, page, pageSize);
  },

  async stats(userId: string, role: UserRole) {
    const requestedBy = role === UserRole.ADMIN ? undefined : userId;
    return inspectionRequestRepository.stats(requestedBy);
  },

  async getById(id: string, userId: string, role: UserRole): Promise<InspectionRequest> {
    const request = await inspectionRequestRepository.findById(id);
    if (!request) throw AppError.notFound('Inspection request not found');
    if (role !== UserRole.ADMIN && request.requestedBy !== userId) {
      throw AppError.forbidden('You do not have access to this request');
    }
    return request;
  },

  async review(id: string, dto: ReviewDto, adminId: string): Promise<InspectionRequest> {
    const existing = await inspectionRequestRepository.findById(id);
    if (!existing) throw AppError.notFound('Request not found');

    if (dto.status === InspectionRequestStatus.APPROVED) {
      if (!dto.inspectorId || !dto.scheduledAt) {
        throw AppError.badRequest('inspectorId and scheduledAt are required to approve');
      }
      const inspection = await inspectionRepository.create({
        extinguisherId: existing.extinguisherId,
        scheduledAt: dto.scheduledAt,
        inspectorId: dto.inspectorId,
        notes: dto.adminNotes ?? existing.notes,
        createdBy: adminId,
      });
      await setExtinguisherUnderInspection(existing.extinguisherId);

      const ext = await extinguisherRepository.findById(existing.extinguisherId);
      const inspector = await userEmail(dto.inspectorId);
      const admin = await userEmail(adminId);
      if (inspector && ext) {
        const scheduledLabel = dto.scheduledAt.toLocaleString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const mailOpts = {
          notes: dto.adminNotes ?? existing.notes ?? undefined,
          assignedBy: admin?.name,
          portalUrl: `${env.FRONTEND_URL.replace(/\/$/, '')}/inspector`,
        };
        await notify(
          inspector.email,
          'Field inspection assigned — TWZ Ltd',
          inspectionAssignedEmailPlain(
            inspector.name,
            ext.serialNumber,
            ext.location,
            scheduledLabel,
            mailOpts,
          ),
          inspectionAssignedEmailHtml(
            inspector.name,
            ext.serialNumber,
            ext.location,
            scheduledLabel,
            mailOpts,
          ),
        );
      }

      const updated = await inspectionRequestRepository.update(id, {
        status: InspectionRequestStatus.APPROVED,
        adminNotes: dto.adminNotes,
        inspectorId: dto.inspectorId,
        inspectionId: inspection.id,
        reviewedBy: adminId,
      });

      const requester = await userEmail(existing.requestedBy);
      if (requester && ext) {
        const detail = `Your request was approved. Field inspection scheduled for ${dto.scheduledAt.toLocaleString()}. Please await on-site checking.`;
        await notify(
          requester.email,
          'Inspection request APPROVED',
          detail,
          inspectionRequestStatusEmailHtml(requester.name, 'APPROVED', ext.serialNumber, detail),
        );
      }

      await alertRepository.acknowledgeByRequestId(id);

      return updated!;
    }

    const updated = await inspectionRequestRepository.update(id, {
      status: dto.status,
      adminNotes: dto.adminNotes,
      reviewedBy: adminId,
    });
    if (!updated) throw AppError.notFound('Request not found');

    const ext = await extinguisherRepository.findById(existing.extinguisherId);
    const requester = await userEmail(existing.requestedBy);
    if (requester && ext) {
      const detail =
        dto.status === InspectionRequestStatus.DENIED
          ? dto.adminNotes ?? 'Your request was denied. Contact the admin for details.'
          : dto.adminNotes ?? 'Your request is being reviewed by the admin team.';
      await notify(
        requester.email,
        `Inspection request ${dto.status}`,
        detail,
        inspectionRequestStatusEmailHtml(requester.name, dto.status, ext.serialNumber, detail),
      );
    }

    await alertRepository.acknowledgeByRequestId(id);

    return updated;
  },

  async acknowledgeAlert(requestId: string): Promise<void> {
    await alertRepository.acknowledgeByRequestId(requestId);
  },
};
