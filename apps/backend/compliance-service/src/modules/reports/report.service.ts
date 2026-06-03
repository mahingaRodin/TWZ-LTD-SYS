import { reportRepository, StockPeriod } from './report.repository';

export const reportService = {
  /** High-level dashboard counts across the whole system. */
  async summary() {
    const [total, byStatus, byType, expiredCount, inspections] = await Promise.all([
      reportRepository.totalExtinguishers(),
      reportRepository.countBy('status'),
      reportRepository.countBy('type'),
      reportRepository.expiredCount(),
      reportRepository.inspectionsByStatus(),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      totalExtinguishers: total,
      expiredCount,
      byStatus,
      byType,
      inspectionsByStatus: inspections,
    };
  },

  stockByPeriod(period: StockPeriod) {
    return reportRepository.stockByPeriod(period);
  },

  inspectionStatus() {
    return reportRepository.inspectionsByStatus();
  },

  expired(limit: number, offset: number) {
    return reportRepository.expiredList(limit, offset);
  },

  maintenance(limit: number, offset: number) {
    return reportRepository.maintenanceHistory(limit, offset);
  },
};
