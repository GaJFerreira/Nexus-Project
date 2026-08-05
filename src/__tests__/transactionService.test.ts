import { createTransaction } from '@/core/services/transactionsservice';

jest.mock('@/lib/firebase/admin', () => ({
  initializeAdminApp: jest.fn(() => ({
    firestore: jest.fn(() => ({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          id: 'mock-tx-id',
        })),
      })),
      runTransaction: jest.fn(async (cb) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({ userId: 'user-123', saldo: 10000 }),
          }),
          set: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        };
        return cb(mockTransaction);
      }),
      batch: jest.fn(() => ({
        set: jest.fn(),
        commit: jest.fn().mockResolvedValue(true),
      })),
    })),
  })),
}));

describe('Transaction Service Validation', () => {
  it('deve lançar erro se a descrição for vazia', async () => {
    await expect(
      createTransaction('user-123', {
        description: '',
        amount: 500,
        type: 'expense',
        category: 'Alimentação',
        paymentMethod: 'pix',
        date: new Date(),
        accountId: 'acc-1',
      })
    ).rejects.toThrow('Descrição é obrigatória.');
  });

  it('deve lançar erro se o valor for menor ou igual a zero', async () => {
    await expect(
      createTransaction('user-123', {
        description: 'Mercado',
        amount: 0,
        type: 'expense',
        category: 'Alimentação',
        paymentMethod: 'pix',
        date: new Date(),
        accountId: 'acc-1',
      })
    ).rejects.toThrow('Valor deve ser maior que zero.');
  });

  it('deve lançar erro se a conta não for informada', async () => {
    await expect(
      createTransaction('user-123', {
        description: 'Mercado',
        amount: 1500,
        type: 'expense',
        category: 'Alimentação',
        paymentMethod: 'pix',
        date: new Date(),
        accountId: '',
      })
    ).rejects.toThrow('Conta é obrigatória.');
  });

  it('deve criar uma transação com dados válidos', async () => {
    const result = await createTransaction('user-123', {
      description: 'Mercado',
      amount: 1500,
      type: 'expense',
      category: 'Alimentação',
      paymentMethod: 'pix',
      date: new Date('2026-08-01'),
      accountId: 'acc-1',
    });

    expect(result).toHaveProperty('id');
    expect(result.description).toBe('Mercado');
    expect(result.amount).toBe(1500);
  });
});
