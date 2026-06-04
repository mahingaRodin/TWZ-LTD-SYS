import { FormEvent, useState } from 'react';
import {
  EXTINGUISHER_SIZES,
  ExtinguisherStatus,
  ExtinguisherType,
  type Extinguisher,
  type ExtinguisherSize,
  UserRole,
} from '@fire-system/shared-types';
import { Alert } from '@/components/Alert';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import * as extApi from '@/api/extinguishers';
import { getErrorMessage } from '@/lib/errors';
import { validateExtinguisherForm } from '@/lib/extinguisherValidation';
import { canEditExtinguishers, canManageExtinguishers } from '@/lib/roles';
import { useAppSelector } from '@/store/hooks';

interface Props {
  initial?: Extinguisher | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ExtinguisherForm({ initial, onSuccess, onCancel }: Props) {
  const role = useAppSelector((s) => s.auth.user?.role ?? UserRole.USER);
  const isNew = !initial;
  const canCreate = canManageExtinguishers(role);
  const canEdit = canEditExtinguishers(role);
  const today = new Date().toISOString().slice(0, 10);

  const [serialNumber, setSerialNumber] = useState(initial?.serialNumber ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [type, setType] = useState<ExtinguisherType>(
    initial?.type ?? ExtinguisherType.CO2,
  );
  const [size, setSize] = useState<ExtinguisherSize>(initial?.size ?? '5lbs');
  const [installationDate, setInstallationDate] = useState(
    initial?.installationDate ?? '',
  );
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? '');
  const [status, setStatus] = useState<ExtinguisherStatus>(
    initial?.status ?? ExtinguisherStatus.ACTIVE,
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
  const toast = useToast();

  if (isNew && !canCreate) {
    return <Alert variant="error">Only admins can register new extinguishers.</Alert>;
  }
  if (!isNew && !canEdit) {
    return <Alert variant="error">You do not have permission to edit extinguishers.</Alert>;
  }

  const formValues = {
    serialNumber,
    location,
    installationDate,
    expiryDate,
    status,
  };

  const persist = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        serialNumber: serialNumber.trim(),
        location: location.trim(),
        type,
        size,
        installationDate,
        expiryDate,
        status,
      };
      if (isNew) {
        await extApi.createExtinguisher(payload);
        toast.success('Extinguisher registered', `${payload.serialNumber} was added to the fleet.`);
      } else {
        await extApi.updateExtinguisher(initial!.id, payload);
        toast.success('Extinguisher updated', `${payload.serialNumber} changes were saved.`);
      }
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setConfirmUpdateOpen(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validationError = validateExtinguisherForm(formValues);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (isNew) {
      void persist();
    } else {
      setConfirmUpdateOpen(true);
    }
  };

  const expiryMin = installationDate && installationDate > today ? installationDate : today;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">Serial Number</label>
            <input
              required
              className="input-field"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
              placeholder="e.g. AE123"
              pattern="AE[0-9]+"
              title="Format: AE followed by digits (e.g. AE123)"
            />
          </div>
          <div>
            <label className="label-field">Location</label>
            <input
              required
              minLength={2}
              maxLength={200}
              className="input-field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Building, floor, or site name"
            />
          </div>
          <div>
            <label className="label-field">Type</label>
            <select
              className="input-field"
              value={type}
              onChange={(e) => setType(e.target.value as ExtinguisherType)}
            >
              {Object.values(ExtinguisherType).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Size</label>
            <select
              className="input-field"
              value={size}
              onChange={(e) => setSize(e.target.value as ExtinguisherSize)}
            >
              {EXTINGUISHER_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Installation Date</label>
            <input
              type="date"
              required
              max={today}
              className="input-field"
              value={installationDate}
              onChange={(e) => setInstallationDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field">Expiry Date</label>
            <input
              type="date"
              required
              className="input-field"
              value={expiryDate}
              min={expiryMin}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field">Status</label>
            <select
              className="input-field"
              value={status}
              onChange={(e) => setStatus(e.target.value as ExtinguisherStatus)}
            >
              {Object.values(ExtinguisherStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving…' : isNew ? 'Register' : 'Save Changes'}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmUpdateOpen}
        onClose={() => setConfirmUpdateOpen(false)}
        onConfirm={() => void persist()}
        title="Save extinguisher changes?"
        description={`Update unit ${serialNumber.trim()} at ${location.trim()}? This will change the fleet record immediately.`}
        confirmLabel="Save changes"
        variant="primary"
        loading={loading}
      />
    </>
  );
}
