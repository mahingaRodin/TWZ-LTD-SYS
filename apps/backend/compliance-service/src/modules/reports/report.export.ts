import type { Response } from 'express';
import PDFDocument from 'pdfkit';

/** A generic tabular report that can be rendered as JSON, CSV, or PDF. */
export interface TabularReport {
  title: string;
  generatedAt: string;
  columns: string[];
  rows: Array<Array<string | number | null>>;
}

export type ReportFormat = 'json' | 'csv' | 'pdf';

/** Pick the requested format from a query value, defaulting to JSON. */
export function parseFormat(value: unknown): ReportFormat {
  return value === 'csv' || value === 'pdf' ? value : 'json';
}

function csvCell(value: string | number | null): string {
  const s = value === null || value === undefined ? '' : String(value);
  // Quote when the value contains a comma, quote, or newline (RFC 4180).
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Render a report as CSV text. */
export function toCsv(report: TabularReport): string {
  const header = report.columns.map(csvCell).join(',');
  const body = report.rows.map((row) => row.map(csvCell).join(',')).join('\n');
  return `${header}\n${body}`;
}

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Stream a report as a CSV download. */
export function sendCsv(res: Response, report: TabularReport): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${slug(report.title)}.csv"`);
  res.send(toCsv(report));
}

/** Stream a report as a simple, readable PDF download. */
export function sendPdf(res: Response, report: TabularReport): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${slug(report.title)}.pdf"`);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(18).text(report.title, { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor('#666').text(`Generated: ${report.generatedAt}`);
  doc.moveDown(0.8).fillColor('#000');

  // Header row
  doc.fontSize(10).font('Helvetica-Bold').text(report.columns.join('   |   '));
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(9);

  if (report.rows.length === 0) {
    doc.moveDown(0.5).fillColor('#666').text('No records.');
  } else {
    for (const row of report.rows) {
      doc.text(row.map((c) => (c === null ? '' : String(c))).join('   |   '));
    }
  }

  doc.end();
}
