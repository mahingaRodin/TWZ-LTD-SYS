import { ExtinguisherStatus } from '@fire-system/shared-types';
import { inspectionRepository } from '../inspection/inspection.repository';
import { extinguisherRepository } from './extinguisher.repository';

function deriveOperationalStatus(expiryDate: string): ExtinguisherStatus {
  const today = new Date().toISOString().slice(0, 10);
  return expiryDate <= today ? ExtinguisherStatus.EXPIRED : ExtinguisherStatus.ACTIVE;
}

/** Mark unit as under inspection while a scheduled visit is open. */
export async function setExtinguisherUnderInspection(extinguisherId: string): Promise<void> {
  const ext = await extinguisherRepository.findById(extinguisherId);
  if (!ext || ext.status === ExtinguisherStatus.DECOMMISSIONED) return;
  if (ext.status === ExtinguisherStatus.MAINTENANCE) return;
  await extinguisherRepository.update(extinguisherId, { status: ExtinguisherStatus.MAINTENANCE });
}

/** Restore ACTIVE/EXPIRED when no scheduled inspections remain (if still in MAINTENANCE). */
export async function refreshExtinguisherStatusAfterInspection(extinguisherId: string): Promise<void> {
  const scheduled = await inspectionRepository.countScheduledForExtinguisher(extinguisherId);
  if (scheduled > 0) return;

  const ext = await extinguisherRepository.findById(extinguisherId);
  if (!ext || ext.status === ExtinguisherStatus.DECOMMISSIONED) return;
  if (ext.status !== ExtinguisherStatus.MAINTENANCE) return;

  await extinguisherRepository.update(extinguisherId, {
    status: deriveOperationalStatus(ext.expiryDate),
  });
}
