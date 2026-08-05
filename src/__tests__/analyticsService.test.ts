import { getAnnualSummary } from '@/core/services/analyticsService';

jest.mock('@/core/services/transactionsservice', () => ({
  getTransactions: jest.fn().mockImplementation(async (userId: string, filters: any) => {
    if (filters.month === 8) {
      return [
        { id: 'tx-1', amount: 500000, type: 'income' },
        { id: 'tx-2', amount: 200000, type: 'expense' },
      ];
    }
    return [
      { id: 'tx-3', amount: 100000, type: 'income' },
      { id: 'tx-4', amount: 50000, type: 'expense' },
    ];
  })
}));

describe('Analytics Service', () => {
  it('deve agrupar o resumo financeiro dos 12 meses do ano', async () => {
    const summary = await getAnnualSummary('user-123', 2026);

    expect(summary).toBeDefined();
    expect(summary.year).toBe(2026);
    expect(summary.monthsData.length).toBe(12);

    const aug = summary.monthsData.find(m => m.month === 8);
    expect(aug).toBeDefined();
    expect(aug?.income).toBe(500000);
    expect(aug?.expense).toBe(200000);
    expect(aug?.netBalance).toBe(300000);

    expect(summary.bestMonth.month).toBe(8);
  });
});
