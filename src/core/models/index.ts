export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  createdAt?: Date;
}

export interface Account {
  id?: string;
  userId: string;
  nome: string;
  saldo: number;
  tipo: 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash' | 'bank';
  possuiCartaoCredito?: boolean;
  faturaAtual?: number;
  diaFechamento?: number;
  diaVencimento?: number;
  limiteCredito?: number;
}

export interface Transaction {
  id?: string;
  userId: string;
  accountId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: string;
  date: Date;
  isInstallment?: boolean;
  installmentTotal?: number;
  installmentCurrent?: number;
  installmentParentId?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'monthly' | 'yearly';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransactionFilters {
  accountId?: string | null;
  month?: number;
  year?: number;
  type?: 'income' | 'expense' | null;
  startDate?: Date;
  endDate?: Date;
}

export interface Goal {
  id?: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: 'reserva' | 'viagem' | 'bens' | 'outros';
  deadline?: Date;
  color?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClosingReport {
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  finalBalance: number;
  netBalance: number;
  closedAt: Date;
}

export interface BudgetPlan {
  id?: string;
  userId: string;
  month: number;
  year: number;
  expectedIncome: number;
  categoryBudgets: { [category: string]: number };
  status: 'active' | 'closed';
  closingReport?: ClosingReport;
  createdAt?: Date;
  updatedAt?: Date;
}

