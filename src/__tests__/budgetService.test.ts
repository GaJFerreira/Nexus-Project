import { getBudgetForecast, saveBudgetPlan, closeMonthBudget } from '@/core/services/budgetService';

const mockRunTransaction = jest.fn();

jest.mock('@/core/services/accountService', () => ({
  getAccountsByUserId: jest.fn().mockResolvedValue([
    { id: 'acc-1', userId: 'user-123', nome: 'Nubank', saldo: 250000, tipo: 'checking' }
  ])
}));

jest.mock('@/core/services/transactionsservice', () => ({
  getTransactions: jest.fn().mockResolvedValue([
    { id: 'tx-1', userId: 'user-123', amount: 300000, type: 'income', category: 'Salário', paymentMethod: 'pix', date: new Date() },
    { id: 'tx-2', userId: 'user-123', amount: 40000, type: 'expense', category: 'Mercado', paymentMethod: 'debit', date: new Date() },
    { id: 'tx-3', userId: 'user-123', amount: 15000, type: 'expense', category: 'Lazer', paymentMethod: 'credit', isInstallment: true, date: new Date() },
    { id: 'tx-4', userId: 'user-123', amount: 5500, type: 'expense', category: 'Assinaturas', paymentMethod: 'credit', isRecurring: true, date: new Date() },
  ])
}));

jest.mock('@/lib/firebase/admin', () => ({
  initializeAdminApp: jest.fn(() => ({
    firestore: () => ({
      collection: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [
            {
              id: 'plan-123',
              data: () => ({
                userId: 'user-123',
                month: 8,
                year: 2026,
                expectedIncome: 300000,
                categoryBudgets: { Mercado: 40000, Combustível: 30000, Lazer: 20000 },
                status: 'active',
              }),
            },
          ],
        }),
        doc: jest.fn(() => ({
          update: jest.fn().mockResolvedValue(true),
        })),
        add: jest.fn().mockResolvedValue({ id: 'plan-new' }),
      })),
      runTransaction: mockRunTransaction,
    }),
  })),
}));

describe('Budget Service', () => {
  it('deve calcular a previsão orçamentária englobando parcelas e assinaturas', async () => {
    const forecast = await getBudgetForecast('user-123', 8, 2026);

    expect(forecast).toBeDefined();
    expect(forecast.actualIncome).toBe(300000);
    expect(forecast.totalInstallmentExpense).toBe(15000);
    expect(forecast.totalRecurringExpense).toBe(5500);
    expect(forecast.expectedFinalBalance).toBeDefined();
  });

  it('deve fechar o mês e gerar o relatório de fechamento oficial', async () => {
    const plan = await closeMonthBudget('user-123', 8, 2026);

    expect(plan).toBeDefined();
    expect(plan.status).toBe('closed');
    expect(plan.closingReport).toBeDefined();
    expect(plan.closingReport?.netBalance).toBe(300000 - (40000 + 15000 + 5500));
  });
});
