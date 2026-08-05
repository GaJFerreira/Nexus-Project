import { createAccount } from '@/core/services/accountService';

jest.mock('@/lib/firebase/admin', () => ({
  initializeAdminApp: jest.fn(() => ({
    firestore: jest.fn(() => ({
      collection: jest.fn(() => ({
        add: jest.fn().mockResolvedValue({ id: 'test-account-id' }),
      })),
    })),
  })),
}));

describe('Account Service', () => {
  it('deve lançar erro se o nome da conta estiver vazio', async () => {
    await expect(
      createAccount('user-123', {
        nome: '',
        saldo: 1000,
        tipo: 'checking',
      })
    ).rejects.toThrow('Nome da conta é obrigatório.');
  });

  it('deve criar uma conta com dados válidos', async () => {
    const result = await createAccount('user-123', {
      nome: 'Conta Itaú',
      saldo: 5000,
      tipo: 'checking',
    });

    expect(result).toHaveProperty('id', 'test-account-id');
    expect(result.nome).toBe('Conta Itaú');
    expect(result.saldo).toBe(5000);
  });
});
