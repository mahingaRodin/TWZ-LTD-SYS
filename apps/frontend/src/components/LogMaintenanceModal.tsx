import { FormEvent, useEffect, useState } from 'react';
import type { Extinguisher } from '@fire-system/shared-types';
import { Alert } from '@/components/Alert';
import { Modal } from '@/components/Modal';
import type { MaintenanceLogDraft } from '@/lib/maintenanceDraft';
import { todayActionDate } from '@/lib/maintenanceDraft';
import * as maintApi from '@/api/maintenance';
import { getErrorMessage } from '@/lib/errors';

export function LogMaintenanceModal({
  open,
  onClose,
  extinguishers,
  onSuccess,
  draft,
}: {
  open: boolean;
  onClose: () => void;
  extinguishers: Extinguisher[];
  onSuccess: () => void;
  draft?: MaintenanceLogDraft | null;
}) {
  const fromInspection = Boolean(draft);
  const [extinguisherId, setExtinguisherId] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [actionDate, setActionDate] = useState(todayActionDate());
  const [conditionNoted, setConditionNoted] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (draft) {
      setExtinguisherId(draft.extinguisherId);
      setActionTaken(draft.suggestedAction ?? '');
      setActionDate(draft.actionDate);
      setConditionNoted(draft.conditionNoted ?? '');
    } else {
      setExtinguisherId('');
      setActionTaken('');
      setActionDate(todayActionDate());
      setConditionNoted('');
    }
  }, [open, draft]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await maintApi.logMaintenance({
        extinguisherId,
        actionTaken,
        actionDate: fromInspection ? draft!.actionDate : actionDate,
        conditionNoted: conditionNoted.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const selectedUnit = extinguishers.find((ex) => ex.id === extinguisherId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={fromInspection ? 'Log maintenance after inspection' : 'Log Maintenance Activity'}
      wide
    >
      {fromInspection && (
        <p className="mb-4 rounded-input border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-text">
          Inspection recorded. Log the maintenance actions taken on site — action date is set to today.
        </p>
      )}
      <form onSubmit={handleSubmit} className="mx-auto max-w-form space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <div>
          <label className="label-field">Extinguisher</label>
          {fromInspection && selectedUnit ? (
            <p className="input-field flex items-center bg-surface/80 text-text">
              {selectedUnit.serialNumber} — {selectedUnit.location}
            </p>
          ) : (
            <select
              required
              className="input-field"
              value={extinguisherId}
              onChange={(e) => setExtinguisherId(e.target.value)}
            >
              <option value="">Select unit…</option>
              {extinguishers.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.serialNumber} — {ex.location}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="label-field">Action Taken</label>
          <input
            required
            className="input-field"
            placeholder="e.g. Pressure test, hose replacement, seal check"
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
          />
        </div>
        <div>
          <label className="label-field">Date of Action</label>
          <input
            type="date"
            required
            className="input-field"
            value={actionDate}
            onChange={(e) => setActionDate(e.target.value)}
            readOnly={fromInspection}
            disabled={fromInspection}
            title={fromInspection ? 'Automatically set to today when inspection was completed' : undefined}
          />
          {fromInspection && (
            <p className="mt-1 text-xs text-muted">Logged automatically ({actionDate})</p>
          )}
        </div>
        <div>
          <label className="label-field">Condition Noted</label>
          <textarea
            required={fromInspection}
            className="input-field min-h-[80px]"
            placeholder="Describe unit condition observed during maintenance"
            value={conditionNoted}
            onChange={(e) => setConditionNoted(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Saving…' : 'Log Activity'}
        </button>
      </form>
    </Modal>
  );
}
