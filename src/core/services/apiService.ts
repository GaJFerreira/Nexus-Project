import { Account, Transaction } from "@/core/models";
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

export async function fetchTransactions(accountId?: string): Promise<Transaction[]> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) return [];

  let url = '/api/transactions';
  if (accountId) url += `?accountId=${accountId}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  if (!res.ok) throw new Error("Erro ao buscar transações");
  return res.json();
}
