import { initializeAdminApp } from '@/lib/firebase/admin';
import { BudgetPlan, Transaction, Account } from '@/core/models';
import { getTransactions } from './transactionsservice';
import { getAccountsByUserId } from './accountService';

export async function getBudgetPlan(userId: string, month: number, year: number): Promise<BudgetPlan | null> {
  const adminApp = initializeAdminApp();
  const db = adminApp.firestore();

  const snapshot = await db.collection('budgets')
    .where('userId', '==', userId)
    .where('month', '==', month)
    .where('year', '==', year)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    ...data,
    closingReport: data.closingReport ? {
      ...data.closingReport,
      closedAt: data.closingReport.closedAt?.toDate ? data.closingReport.closedAt.toDate() : new Date(data.closingReport.closedAt)
    } : undefined,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
  } as BudgetPlan;
}

export async function saveBudgetPlan(
  userId: string, 
  planData: { month: number; year: number; expectedIncome: number; categoryBudgets: { [category: string]: number } }
): Promise<BudgetPlan> {
  const adminApp = initializeAdminApp();
  const db = adminApp.firestore();

  const existing = await getBudgetPlan(userId, planData.month, planData.year);

  const newFields = {
    userId,
    month: planData.month,
    year: planData.year,
    expectedIncome: planData.expectedIncome,
    categoryBudgets: planData.categoryBudgets,
    status: existing?.status || 'active',
    updatedAt: new Date(),
  };

  if (existing && existing.id) {
    const ref = db.collection('budgets').doc(existing.id);
    await ref.update(newFields);
    return { ...existing, ...newFields } as BudgetPlan;
  } else {
    const ref = await db.collection('budgets').add({
      ...newFields,
      createdAt: new Date(),
    });
    return { id: ref.id, ...newFields, createdAt: new Date() } as BudgetPlan;
  }
}

export async function getBudgetForecast(userId: string, month: number, year: number) {
  const [accounts, transactions, plan] = await Promise.all([
    getAccountsByUserId(userId),
    getTransactions(userId, { month, year }),
    getBudgetPlan(userId, month, year)
  ]);

  const currentTotalAccountsBalance = accounts.reduce((acc: number, a: Account) => acc + a.saldo, 0);

  const actualIncome = transactions
    .filter((t: Transaction) => t.type === 'income')
    .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

  const actualExpense = transactions
    .filter((t: Transaction) => t.type === 'expense')
    .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

  const categoryActualMap: { [cat: string]: number } = {};
  transactions
    .filter((t: Transaction) => t.type === 'expense')
    .forEach((t: Transaction) => {
      const cat = t.category || 'Outros';
      categoryActualMap[cat] = (categoryActualMap[cat] || 0) + t.amount;
    });

  const expectedIncome = plan?.expectedIncome || 300000;
  const categoryBudgets: { [cat: string]: number } = plan?.categoryBudgets || {
    Mercado: 40000,
    Combustível: 30000,
    Alimentação: 15000,
    Lazer: 20000,
    Moradia: 50000,
    Transporte: 10000,
    Saúde: 10000,
    Outros: 10000,
  };

  // Compras Parceladas do Mês
  const installmentTransactions = transactions.filter((t: Transaction) => t.isInstallment && t.type === 'expense');
  const totalInstallmentExpense = installmentTransactions.reduce((acc: number, t: Transaction) => acc + t.amount, 0);

  // Assinaturas / Despesas Recorrentes do Mês
  const recurringTransactions = transactions.filter((t: Transaction) => t.isRecurring && t.type === 'expense');
  const totalRecurringExpense = recurringTransactions.reduce((acc: number, t: Transaction) => acc + t.amount, 0);

  // Soma do Orçamento Variável Planejado
  const totalPlannedCategoryExpense = Object.values(categoryBudgets).reduce((acc: number, val: number) => acc + val, 0);

  // Gastos Totais Esperados (Variáveis + Parcelas + Assinaturas)
  const expectedTotalExpense = totalPlannedCategoryExpense;

  // Saldo Final Esperado
  const remainingExpectedIncome = Math.max(0, expectedIncome - actualIncome);
  const remainingExpectedExpense = Math.max(0, expectedTotalExpense - actualExpense);
  const expectedFinalBalance = currentTotalAccountsBalance + remainingExpectedIncome - remainingExpectedExpense;

  return {
    month,
    year,
    status: plan?.status || 'active',
    closingReport: plan?.closingReport,
    currentTotalAccountsBalance,
    expectedIncome,
    actualIncome,
    categoryBudgets,
    categoryActualMap,
    installmentTransactions,
    totalInstallmentExpense,
    recurringTransactions,
    totalRecurringExpense,
    expectedTotalExpense,
    actualExpense,
    expectedFinalBalance,
    actualNetBalance: actualIncome - actualExpense,
  };
}

export async function closeMonthBudget(userId: string, month: number, year: number): Promise<BudgetPlan> {
  const forecast = await getBudgetForecast(userId, month, year);

  const initialBalance = forecast.currentTotalAccountsBalance - forecast.actualNetBalance;
  const finalBalance = forecast.currentTotalAccountsBalance;
  const netBalance = forecast.actualNetBalance;

  const closingReport = {
    initialBalance,
    totalIncome: forecast.actualIncome,
    totalExpense: forecast.actualExpense,
    finalBalance,
    netBalance,
    closedAt: new Date(),
  };

  const adminApp = initializeAdminApp();
  const db = adminApp.firestore();

  const existing = await getBudgetPlan(userId, month, year);

  const updateData = {
    userId,
    month,
    year,
    expectedIncome: forecast.expectedIncome,
    categoryBudgets: forecast.categoryBudgets,
    status: 'closed' as const,
    closingReport,
    updatedAt: new Date(),
  };

  if (existing && existing.id) {
    const ref = db.collection('budgets').doc(existing.id);
    await ref.update(updateData);
    return { ...existing, ...updateData } as BudgetPlan;
  } else {
    const ref = await db.collection('budgets').add({
      ...updateData,
      createdAt: new Date(),
    });
    return { id: ref.id, ...updateData, createdAt: new Date() } as BudgetPlan;
  }
}
