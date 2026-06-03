import { Router } from 'express';
import { asyncHandler, buildPaginated, ok, parsePagination } from '@fire-system/shared-utils';
import { authenticate } from '../../auth';
import { reportService } from './report.service';
import { StockPeriod } from './report.repository';
import {
  parseFormat,
  ReportFormat,
  sendCsv,
  sendPdf,
  TabularReport,
} from './report.export';

export const reportRouter = Router();

// Any authenticated user may read and download reports.
reportRouter.use(authenticate);

// When a download format is requested we return everything; otherwise paginate.
const EXPORT_LIMIT = 10000;

/** Respond with a tabular report as JSON, CSV, or PDF based on ?format=. */
function respond(res: Parameters<typeof sendCsv>[0], format: ReportFormat, report: TabularReport): void {
  if (format === 'csv') return sendCsv(res, report);
  if (format === 'pdf') return sendPdf(res, report);
  res.json(ok(report));
}

function now(): string {
  return new Date().toISOString();
}

// --- Dashboard summary ------------------------------------------------------
reportRouter.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    res.json(ok(await reportService.summary()));
  }),
);

// --- Stock intake by period (daily | monthly | yearly) ----------------------
reportRouter.get(
  '/stock',
  asyncHandler(async (req, res) => {
    const allowed: StockPeriod[] = ['daily', 'monthly', 'yearly'];
    const period = (allowed as string[]).includes(String(req.query.period))
      ? (req.query.period as StockPeriod)
      : 'monthly';
    const data = await reportService.stockByPeriod(period);
    respond(res, parseFormat(req.query.format), {
      title: `Extinguisher stock (${period})`,
      generatedAt: now(),
      columns: ['Period', 'Count'],
      rows: data.map((d) => [d.key, d.count]),
    });
  }),
);

// --- Inspection status breakdown -------------------------------------------
reportRouter.get(
  '/inspections',
  asyncHandler(async (req, res) => {
    const data = await reportService.inspectionStatus();
    respond(res, parseFormat(req.query.format), {
      title: 'Inspection status',
      generatedAt: now(),
      columns: ['Status', 'Count'],
      rows: data.map((d) => [d.key, d.count]),
    });
  }),
);

// --- Expired extinguishers --------------------------------------------------
reportRouter.get(
  '/expired',
  asyncHandler(async (req, res) => {
    const format = parseFormat(req.query.format);
    const { page, pageSize, offset } = parsePagination(req.query);
    const limit = format === 'json' ? pageSize : EXPORT_LIMIT;
    const { items, total } = await reportService.expired(limit, format === 'json' ? offset : 0);

    if (format === 'json') {
      return res.json(ok(buildPaginated(items, total, page, pageSize)));
    }
    respond(res, format, {
      title: 'Expired extinguishers',
      generatedAt: now(),
      columns: ['Serial number', 'Location', 'Type', 'Expiry date', 'Status'],
      rows: items.map((i) => [i.serialNumber, i.location, i.type, i.expiryDate, i.status]),
    });
  }),
);

// --- Maintenance history ----------------------------------------------------
reportRouter.get(
  '/maintenance',
  asyncHandler(async (req, res) => {
    const format = parseFormat(req.query.format);
    const { page, pageSize, offset } = parsePagination(req.query);
    const limit = format === 'json' ? pageSize : EXPORT_LIMIT;
    const { items, total } = await reportService.maintenance(limit, format === 'json' ? offset : 0);

    if (format === 'json') {
      return res.json(ok(buildPaginated(items, total, page, pageSize)));
    }
    respond(res, format, {
      title: 'Maintenance history',
      generatedAt: now(),
      columns: ['Serial number', 'Action taken', 'Action date', 'Condition noted'],
      rows: items.map((i) => [i.serialNumber, i.actionTaken, i.actionDate, i.conditionNoted]),
    });
  }),
);
