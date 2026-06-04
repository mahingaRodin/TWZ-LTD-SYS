import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { InspectorAlertType, UserRole } from '@fire-system/shared-types';
import * as inspectorAlertsApi from '@/api/inspectorAlerts';
import { useAppSelector } from '@/store/hooks';

export function InspectorAlertBanner() {
  const navigate = useNavigate();
  const role = useAppSelector((s) => s.auth.user?.role);
  const [alerts, setAlerts] = useState<Awaited<ReturnType<typeof inspectorAlertsApi.listInspectorAlerts>>>([]);

  const load = useCallback(async () => {
    if (role !== UserRole.INSPECTOR) return;
    try {
      setAlerts(await inspectorAlertsApi.listInspectorAlerts());
    } catch {
      setAlerts([]);
    }
  }, [role]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    const onRefresh = () => load();
    window.addEventListener('twz:inspector-alerts-refresh', onRefresh);
    return () => {
      clearInterval(t);
      window.removeEventListener('twz:inspector-alerts-refresh', onRefresh);
    };
  }, [load]);

  if (role !== UserRole.INSPECTOR || alerts.length === 0) return null;

  const openInspection = (inspectionId: string) => {
    navigate(`/app/inspector?focus=${inspectionId}`);
  };

  return (
    <div className="space-y-1 border-b border-secondary/40 bg-secondary/10">
      {alerts.map((a) => {
        const isDue =
          a.alertType === InspectorAlertType.INSPECTION_DUE_SOON && !!a.inspectionId;
        const overdue = a.title.startsWith('OVERDUE');

        return (
          <div
            key={a.id}
            className={`flex items-start justify-between gap-3 px-4 py-2 text-sm ${
              overdue ? 'text-primary' : 'text-secondary'
            }`}
          >
            <div className="flex min-w-0 flex-1 gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-text">{a.title}</p>
                <p className="text-text/80">{a.message}</p>
              </div>
            </div>
            {isDue && (
              <button
                type="button"
                className="btn-secondary flex shrink-0 items-center gap-1 px-3 py-1.5 text-xs"
                onClick={() => openInspection(a.inspectionId)}
              >
                Open inspection
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
