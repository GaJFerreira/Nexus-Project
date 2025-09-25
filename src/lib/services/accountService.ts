import admin from 'firebase-admin';
import { initializeAdminApp } from '../firebase/admin';

interface Account {
    nome: string;
    saldo: number;
    tipo: string;

}

export async function createAccount(userId: string, account: Account) {

    if (!account.nome || account.nome.trim() === '') {
        throw new Error('Nome da conta é obrigatório.');
    }

    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const newAccount = {
        userId: userId,
        nome: account.nome,
        saldo: account.saldo,
        tipo: account.tipo
    }

    const docRef = await db.collection('accounts').add(newAccount);

    return {
        id: docRef.id,
        ...newAccount
    }

}

export async function getAccountsByUserId(userId: string) {

    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const accountsRef = db.collection('accounts');
    const snapshot = await accountsRef.where('userId', '==', userId).get();

    if (snapshot.empty) {
        return [];
    }

    const accounts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return accounts;

}

export async function updateAccount(userId: string, accountId: string, account: Account) {
    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const accountRef = db.collection('accounts').doc(accountId);
    const doc = await accountRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
        throw new Error('Conta não encontrada ou não pertence ao usuário.');
    }

    const newAccount = {
        userId: userId,
        nome: account.nome,
        saldo: account.saldo,
        tipo: account.tipo
    }

    await accountRef.update(newAccount);
    
    return { id: accountId, ...newAccount };
}