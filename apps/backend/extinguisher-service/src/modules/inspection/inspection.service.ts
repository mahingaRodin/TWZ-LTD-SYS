import { Inspection, InspectionResult, Paginated } from '@fire-system/shared-types';
import {
  AppError,
  buildPaginated,
  inspectionAssignedEmailHtml,
  inspectionAssignedEmailPlain,
} from '@fire-system/shared-utils';
import {
  refreshExtinguisherStatusAfterInspection,
  setExtinguisherUnderInspection,
} from '../extinguisher/extinguisher-status.sync';
import { extinguisherRepository } from '../extinguisher/extinguisher.repository';
import { env } from '../../config/env';
import { notify } from '../../utils/notifier';
import {
  CreateInspectionInput,
  InspectionListFilters,
  inspectionRepository,
} from './inspection.repository';

export const inspectionService = {
  /** Schedule an inspection and notify the assigned inspector (best-effort). */
  async schedule(input: CreateInspectionInput): Promise<Inspection> {
    const extinguisher = await extinguisherRepository.findById(input.extinguisherId);
    if (!extinguisher) throw AppError.notFound('Extinguisher not found');

    const inspection = await inspectionRepository.create(input);
    await setExtinguisherUnderInspection(input.extinguisherId);

    if (input.inspectorId) {
      const contact = await inspectionRepository.findUserContact(input.inspectorId);
      const assigner = input.createdBy
        ? await inspectionRepository.findUserContact(input.createdBy)
        : null;
      if (contact) {
        const scheduledLabel = input.scheduledAt.toLocaleString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const mailOpts = {
          notes: input.notes ?? undefined,
          assignedBy: assigner?.firstName,
          portalUrl: `${env.FRONTEND_URL.replace(/\/$/, '')}/inspector`,
        };
        await notify(
          contact.email,
          'Field inspection assigned — TWZ Ltd',
          inspectionAssignedEmailPlain(
            contact.firstName,
            extinguisher.serialNumber,
            extinguisher.location,
            scheduledLabel,
            mailOpts,
          ),
          inspectionAssignedEmailHtml(
            contact.firstName,
            extinguisher.serialNumber,
            extinguisher.location,
            scheduledLabel,
            mailOpts,
          ),
        );
      }
    }
    return inspection;
  },

  async list(
    filters: InspectionListFilters,
    page: number,
    pageSize: number,
  ): Promise<Paginated<Inspection>> {
    const { items, total } = await inspectionRepository.list(filters);
    return buildPaginated(items, total, page, pageSize);
  },

  async stats(inspectorId?: string) {
    return inspectionRepository.stats(inspectorId);
  },

  async getById(id: string): Promise<Inspection> {
    const found = await inspectionRepository.findById(id);
    if (!found) throw AppError.notFound('Inspection not found');
    return found;
  },

  async complete(id: string, result: InspectionResult, notes?: string): Promise<Inspection> {
    const updated = await inspectionRepository.complete(id, result, notes);
    if (!updated) {
      throw AppError.badRequest('Inspection not found or is not in a SCHEDULED state');
    }
    await refreshExtinguisherStatusAfterInspection(updated.extinguisherId);
    return updated;
  },

  async cancel(id: string): Promise<Inspection> {
    const updated = await inspectionRepository.cancel(id);
    if (!updated) {
      throw AppError.badRequest('Inspection not found or is not in a SCHEDULED state');
    }
    await refreshExtinguisherStatusAfterInspection(updated.extinguisherId);
    return updated;
  },
};
