import { initializeAdminApp } from '@/lib/firebase/admin';
import { Goal } from '@/core/models';

export async function getGoals(userId: string): Promise<Goal[]> {
  const adminApp = initializeAdminApp();
  const db = adminApp.firestore();

  const snapshot = await db.collection('goals')
    .where('userId', '==', userId)
    .get();

  if (snapshot.empty) return [];

  const goals = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      deadline: data.deadline?.toDate ? data.deadline.toDate() : (data.deadline ? new Date(data.deadline) : undefined),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined,
    } as Goal;
  });

  return goals.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
}

export async function createGoal(userId: string, goalData: Omit<Goal, 'id' | 'userId'>): Promise<Goal> {
  const adminApp = initializeAdminApp();
  const db = adminApp.firestore();

  if (!goalData.name || goalData.name.trim() === '') {
    throw new Error('Nome da meta é obrigatório.');
  }

  if (!goalData.targetAmount || goalData.targetAmount <= 0) {
    throw new Error('Valor da meta deve ser maior que zero.');
  }

  let deadlineObj: Date | null = null;
  if (goalData.deadline) {
    if (goalData.deadline instanceof Date) {
      deadlineObj = goalData.deadline;
    } else if (typeof goalData.deadline === 'string') {
      const dateStr = (goalData.deadline as string).split('T')[0];
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        deadlineObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      } else {
        deadlineObj = new Date(goalData.deadline);
      }
    } else {
      deadlineObj = new Date(goalData.deadline);
    }
  }

  const newDoc: Record<string, any> = {
    userId,
    name: goalData.name,
    targetAmount: goalData.targetAmount,
    currentAmount: goalData.currentAmount || 0,
    category: goalData.category || 'reserva',
    color: goalData.color || '#6366f1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (deadlineObj) {
    newDoc.deadline = deadlineObj;
  }

  const ref = await db.collection('goals').add(newDoc);
  return { id: ref.id, ...newDoc } as Goal;
}

export async function updateGoal(userId: string, goalId: string, goalData: Partial<Goal>): Promise<Goal> {
  const adminApp = initializeAdminApp();
  const db = adminApp.firestore();

  const goalRef = db.collection('goals').doc(goalId);
  const doc = await goalRef.get();

  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new Error('Meta não encontrada ou não pertence ao usuário');
  }

  const updateFields: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (goalData.deadline) {
    let deadlineObj: Date | null = null;
    if (goalData.deadline instanceof Date) {
      deadlineObj = goalData.deadline;
    } else if (typeof goalData.deadline === 'string') {
      const dateStr = (goalData.deadline as string).split('T')[0];
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        deadlineObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      } else {
        deadlineObj = new Date(goalData.deadline);
      }
    }
    if (deadlineObj) {
      updateFields.deadline = deadlineObj;
    }
  }

  if (goalData.name !== undefined) updateFields.name = goalData.name;
  if (goalData.targetAmount !== undefined) updateFields.targetAmount = goalData.targetAmount;
  if (goalData.currentAmount !== undefined) updateFields.currentAmount = goalData.currentAmount;
  if (goalData.category !== undefined) updateFields.category = goalData.category;
  if (goalData.color !== undefined) updateFields.color = goalData.color;

  await goalRef.update(updateFields);

  return { id: goalId, ...doc.data(), ...updateFields } as Goal;
}

export async function depositToGoal(userId: string, goalId: string, accountId: string, amount: number) {
  const adminApp = initializeAdminApp();
  const db = adminApp.firestore();

  if (amount <= 0) throw new Error('Valor do depósito deve ser maior que zero');

  const goalRef = db.collection('goals').doc(goalId);
  const accountRef = db.collection('accounts').doc(accountId);

  let updatedGoal: any = null;
  let updatedAccount: any = null;

  await db.runTransaction(async (t) => {
    const goalDoc = await t.get(goalRef);
    if (!goalDoc.exists || goalDoc.data()?.userId !== userId) {
      throw new Error('Meta não encontrada');
    }

    const accountDoc = await t.get(accountRef);
    if (!accountDoc.exists || accountDoc.data()?.userId !== userId) {
      throw new Error('Conta não encontrada');
    }

    const goalData = goalDoc.data()!;
    const accountData = accountDoc.data()!;

    const currentBalance = accountData.saldo || 0;
    if (currentBalance < amount) {
      throw new Error('Saldo insuficiente na conta selecionada para realizar o depósito');
    }

    const newGoalAmount = (goalData.currentAmount || 0) + amount;
    const newAccountBalance = currentBalance - amount;

    // 1. Atualiza Caixinha
    t.update(goalRef, { currentAmount: newGoalAmount, updatedAt: new Date() });

    // 2. Deduz da Conta Bancária
    t.update(accountRef, { saldo: newAccountBalance, updatedAt: new Date() });

    // 3. Registra Transação de Saída de Conta para Caixinha
    const txRef = db.collection('transactions').doc();
    t.set(txRef, {
      userId,
      accountId,
      description: `Guardado na Caixinha (${goalData.name})`,
      amount,
      type: 'expense',
      category: 'Investimentos',
      paymentMethod: 'pix',
      date: new Date(),
      createdAt: new Date(),
    });

    updatedGoal = { id: goalId, ...goalData, currentAmount: newGoalAmount };
    updatedAccount = { id: accountId, ...accountData, saldo: newAccountBalance };
  });

  return { goal: updatedGoal, account: updatedAccount };
}

export async function withdrawFromGoal(userId: string, goalId: string, accountId: string, amount: number) {
  const adminApp = initializeAdminApp();
  const db = adminApp.firestore();

  if (amount <= 0) throw new Error('Valor do resgate deve ser maior que zero');

  const goalRef = db.collection('goals').doc(goalId);
  const accountRef = db.collection('accounts').doc(accountId);

  let updatedGoal: any = null;
  let updatedAccount: any = null;

  await db.runTransaction(async (t) => {
    const goalDoc = await t.get(goalRef);
    if (!goalDoc.exists || goalDoc.data()?.userId !== userId) {
      throw new Error('Meta não encontrada');
    }

    const accountDoc = await t.get(accountRef);
    if (!accountDoc.exists || accountDoc.data()?.userId !== userId) {
      throw new Error('Conta não encontrada');
    }

    const goalData = goalDoc.data()!;
    const accountData = accountDoc.data()!;

    const currentGoalAmount = goalData.currentAmount || 0;
    if (currentGoalAmount < amount) {
      throw new Error('Saldo insuficiente na Caixinha para realizar o resgate');
    }

    const newGoalAmount = currentGoalAmount - amount;
    const newAccountBalance = (accountData.saldo || 0) + amount;

    // 1. Atualiza Caixinha
    t.update(goalRef, { currentAmount: newGoalAmount, updatedAt: new Date() });

    // 2. Adiciona de volta ao Saldo da Conta Bancária
    t.update(accountRef, { saldo: newAccountBalance, updatedAt: new Date() });

    // 3. Registra Transação de Entrada vinda da Caixinha
    const txRef = db.collection('transactions').doc();
    t.set(txRef, {
      userId,
      accountId,
      description: `Resgate da Caixinha (${goalData.name})`,
      amount,
      type: 'income',
      category: 'Investimentos',
      paymentMethod: 'pix',
      date: new Date(),
      createdAt: new Date(),
    });

    updatedGoal = { id: goalId, ...goalData, currentAmount: newGoalAmount };
    updatedAccount = { id: accountId, ...accountData, saldo: newAccountBalance };
  });

  return { goal: updatedGoal, account: updatedAccount };
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const adminApp = initializeAdminApp();
  const db = adminApp.firestore();

  const goalRef = db.collection('goals').doc(goalId);
  const doc = await goalRef.get();

  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new Error('Meta não encontrada ou não pertence ao usuário');
  }

  await goalRef.delete();
}
