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
  tipo: 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash';
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

