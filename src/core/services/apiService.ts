import { Account, Transaction, Goal } from "@/core/models";
import { auth } from "@/lib/firebase/client";

export async function fetchAccounts(): Promise<Account[]> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) return [];

  const res = await fetch('/api/accounts', {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  if (!res.ok) throw new Error("Erro ao buscar contas");
  return res.json();
}

export async function fetchTransactions(filters?: { accountId?: string | null; month?: number; year?: number; type?: 'income' | 'expense' | null; startDate?: Date | string; endDate?: Date | string }): Promise<Transaction[]> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) return [];

  const params = new URLSearchParams();
  if (filters?.accountId) params.append('accountId', filters.accountId);
  if (filters?.month) params.append('month', filters.month.toString());
  if (filters?.year) params.append('year', filters.year.toString());
  if (filters?.type) params.append('type', filters.type);
  if (filters?.startDate) {
    const s = filters.startDate instanceof Date ? filters.startDate.toISOString() : filters.startDate;
    params.append('startDate', s);
  }
  if (filters?.endDate) {
    const e = filters.endDate instanceof Date ? filters.endDate.toISOString() : filters.endDate;
    params.append('endDate', e);
  }

  const queryString = params.toString();
  const url = `/api/transactions${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  if (!res.ok) throw new Error("Erro ao buscar transações");
  return res.json();
}

export async function updateAccountApi(accountId: string, accountData: Partial<Account>): Promise<Account> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Usuário não autenticado");

  const res = await fetch(`/api/accounts/${accountId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify(accountData)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao atualizar conta");
  }

  return res.json();
}

export async function deleteAccountApi(accountId: string): Promise<void> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Usuário não autenticado");

  const res = await fetch(`/api/accounts/${accountId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao deletar conta");
  }
}
export async function updateTransactionApi(transactionId: string, data: Partial<Transaction>): Promise<Transaction> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Usuário não autenticado");

  const res = await fetch(`/api/transactions/${transactionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao atualizar transação");
  }

  return res.json();
}

export async function deleteTransactionApi(transactionId: string): Promise<void> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Usuário não autenticado");

  const res = await fetch(`/api/transactions/${transactionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao excluir transação");
  }
}

export async function fetchGoals(): Promise<Goal[]> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) return [];

  const res = await fetch('/api/goals', {
    headers: { 'Authorization': `Bearer ${idToken}` }
  });
  if (!res.ok) throw new Error("Erro ao buscar metas");
  return res.json();
}

export async function createGoalApi(goalData: Partial<Goal>): Promise<Goal> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Usuário não autenticado");

  const res = await fetch('/api/goals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify(goalData)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao criar meta");
  }

  return res.json();
}

export async function depositToGoalApi(goalId: string, accountId: string, amount: number) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Usuário não autenticado");

  const res = await fetch(`/api/goals/${goalId}/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ accountId, amount })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao realizar depósito");
  }

  return res.json();
}

export async function withdrawFromGoalApi(goalId: string, accountId: string, amount: number) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Usuário não autenticado");

  const res = await fetch(`/api/goals/${goalId}/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ accountId, amount })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao realizar resgate");
  }

  return res.json();
}

export async function deleteGoalApi(goalId: string): Promise<void> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Usuário não autenticado");

  const res = await fetch(`/api/goals/${goalId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${idToken}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao excluir meta");
  }
}

export async function fetchBudgetForecastApi(month: number, year: number) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Usuário não autenticado");

  const res = await fetch(`/api/budgets?month=${month}&year=${year}`, {
    headers: { 'Authorization': `Bearer ${idToken}` }
  });

  if (!res.ok) throw new Error("Erro ao buscar previsão orçamentária");
  return res.json();
}

export async function saveBudgetPlanApi(planData: { month: number; year: number; expectedIncome: number; categoryBudgets: { [category: string]: number } }) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Usuário não autenticado");

  const res = await fetch('/api/budgets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify(planData)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao salvar planejamento");
  }

  return res.json();
}

export async function closeMonthBudgetApi(month: number, year: number) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Usuário não autenticado");

  const res = await fetch('/api/budgets/close', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ month, year })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao fechar mês");
  }

  return res.json();
}

export async function fetchAnnualSummaryApi(year: number) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Usuário não autenticado");

  const res = await fetch(`/api/analytics/annual?year=${year}`, {
    headers: { 'Authorization': `Bearer ${idToken}` }
  });

  if (!res.ok) throw new Error("Erro ao buscar resumo anual");
  return res.json();
}



