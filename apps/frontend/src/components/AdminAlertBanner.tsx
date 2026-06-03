import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import { AdminAlert, AdminAlertType, UserRole } from '@fire-system/shared-types';
import * as alertsApi from '@/api/alerts';
import { useAppSelector } from '@/store/hooks';

export function AdminAlertBanner() {
  const navigate = useNavigate();
  const role = useAppSelector((s) => s.auth.user?.role);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);

  const load = useCallback(async () => {
    if (role !== UserRole.ADMIN) return;
    try {
      setAlerts(await alertsApi.listOpenAlerts());
    } catch {
      setAlerts([]);
    }
  }, [role]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    const onRefresh = () => load();
    window.addEventListener('twz:alerts-refresh', onRefresh);
    return () => {
      clearInterval(t);
      window.removeEventListener('twz:alerts-refresh', onRefresh);
    };
  }, [load]);

  if (role !== UserRole.ADMIN || alerts.length === 0) return null;

  const dismiss = async (id: string) => {
    await alertsApi.acknowledgeAlert(id);
    load();
  };

  const openInspectionRequest = (requestId: string) => {
    navigate(`/app/inspection-requests?review=${requestId}`);
  };

  return (
    <div className="space-y-1 border-b border-primary/40 bg-primary/10">
      {alerts.map((a) => {
        const isRequestAlert =
          a.alertType === AdminAlertType.INSPECTION_REQUEST && !!a.requestId;

        return (
          <div
            key={a.id}
            className={`flex items-start justify-between gap-3 px-4 py-2 text-sm ${
              a.alertType === AdminAlertType.EXPIRY_CRITICAL ? 'text-primary' : 'text-secondary'
            }`}
          >
            <div className="flex min-w-0 flex-1 gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold">{a.title}</p>
                <p className="text-text/80">{a.message}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {isRequestAlert && (
                <button
                  type="button"
                  className="btn-secondary flex items-center gap-1 text-xs py-1.5 px-3"
                  onClick={() => openInspectionRequest(a.requestId!)}
                >
                  View request
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                className="btn-ghost p-1"
                onClick={() => dismiss(a.id)}
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
