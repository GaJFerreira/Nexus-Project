import { createGoal, depositToGoal, withdrawFromGoal } from '@/core/services/goalService';

const mockRunTransaction = jest.fn();
const mockBatch = jest.fn(() => ({
  set: jest.fn(),
  commit: jest.fn(),
}));

jest.mock('@/lib/firebase/admin', () => ({
  initializeAdminApp: jest.fn(() => ({
    firestore: () => ({
      collection: jest.fn((colName: string) => ({
        doc: jest.fn((docId?: string) => ({
          get: jest.fn().mockImplementation(async () => {
            if (colName === 'goals') {
              return {
                exists: true,
                id: docId || 'goal-123',
                data: () => ({
                  userId: 'user-123',
                  name: 'Reserva de Emergência',
                  targetAmount: 500000,
                  currentAmount: 100000,
                  category: 'reserva',
                }),
              };
            }
            if (colName === 'accounts') {
              return {
                exists: true,
                id: docId || 'acc-123',
                data: () => ({
                  userId: 'user-123',
                  nome: 'Nubank',
                  saldo: 200000,
                  tipo: 'checking',
                }),
              };
            }
            return { exists: false, data: () => null };
          }),
          update: jest.fn(),
          delete: jest.fn(),
        })),
        add: jest.fn().mockResolvedValue({ id: 'goal-new-id' }),
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [
            {
              id: 'goal-123',
              data: () => ({
                userId: 'user-123',
                name: 'Reserva de Emergência',
                targetAmount: 500000,
                currentAmount: 100000,
                category: 'reserva',
              }),
            },
          ],
        }),
      })),
      runTransaction: mockRunTransaction,
      batch: mockBatch,
    }),
  })),
}));

describe('Goal Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar uma nova caixinha/meta com dados válidos', async () => {
    const goal = await createGoal('user-123', {
      name: 'Viagem Cancún',
      targetAmount: 1000000,
      currentAmount: 0,
      category: 'viagem',
    });

    expect(goal).toBeDefined();
    expect(goal.id).toBe('goal-new-id');
    expect(goal.name).toBe('Viagem Cancún');
    expect(goal.targetAmount).toBe(1000000);
  });

  it('deve lançar erro ao tentar criar meta sem nome ou com valor zero', async () => {
    await expect(createGoal('user-123', { name: '', targetAmount: 1000, currentAmount: 0, category: 'outros' }))
      .rejects.toThrow('Nome da meta é obrigatório.');

    await expect(createGoal('user-123', { name: 'Teste', targetAmount: 0, currentAmount: 0, category: 'outros' }))
      .rejects.toThrow('Valor da meta deve ser maior que zero.');
  });

  it('deve realizar depósito na caixinha ajustando os saldos dentro de runTransaction', async () => {
    mockRunTransaction.mockImplementation(async (callback) => {
      const mockGoalGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ userId: 'user-123', name: 'Reserva', currentAmount: 100000 }),
      });
      const mockAccountGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ userId: 'user-123', saldo: 200000 }),
      });
      const mockUpdate = jest.fn();
      const mockSet = jest.fn();

      const transactionObject = {
        get: (ref: any) => {
          if (ref.path?.includes?.('goals') || ref._path?.segments?.includes?.('goals')) return mockGoalGet();
          return mockAccountGet();
        },
        update: mockUpdate,
        set: mockSet,
      };

      return callback(transactionObject);
    });

    const result = await depositToGoal('user-123', 'goal-123', 'acc-123', 50000);
    expect(result).toBeDefined();
    expect(mockRunTransaction).toHaveBeenCalled();
  });
});
