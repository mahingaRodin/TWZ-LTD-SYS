import { ExtinguisherStatus } from '@fire-system/shared-types';

const SERIAL_NUMBER_PATTERN = /^AE\d+$/i;

export interface ExtinguisherFormValues {
  serialNumber: string;
  location: string;
  installationDate: string;
  expiryDate: string;
  status: ExtinguisherStatus;
}

export function validateExtinguisherForm(values: ExtinguisherFormValues): string | null {
  const serial = values.serialNumber.trim();
  if (!SERIAL_NUMBER_PATTERN.test(serial)) {
    return 'Serial number must match AE followed by digits (e.g. AE123).';
  }

  const location = values.location.trim();
  if (location.length < 2) {
    return 'Location must be at least 2 characters.';
  }
  if (location.length > 200) {
    return 'Location must be at most 200 characters.';
  }

  const today = new Date().toISOString().slice(0, 10);
  const { installationDate, expiryDate, status } = values;

  if (installationDate > today) {
    return 'Installation date cannot be in the future.';
  }

  const earliest = new Date();
  earliest.setFullYear(earliest.getFullYear() - 50);
  if (installationDate < earliest.toISOString().slice(0, 10)) {
    return 'Installation date is too far in the past.';
  }

  if (expiryDate < today) {
    return 'Expiry date cannot be in the past.';
  }
  if (expiryDate < installationDate) {
    return 'Expiry date cannot be before the installation date.';
  }

  if (status === ExtinguisherStatus.EXPIRED && expiryDate >= today) {
    return 'Status cannot be EXPIRED while the expiry date is still in the future.';
  }
  if (status === ExtinguisherStatus.ACTIVE && expiryDate < today) {
    return 'Status cannot be ACTIVE when the expiry date has passed.';
  }

  return null;
}
