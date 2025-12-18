import { initializeAdminApp } from '@/lib/firebase/admin';
import { Account } from '@/core/models';

export async function createAccount(userId: string, account: Omit<Account, 'id' | 'userId'>) {
    if (!account.nome || account.nome.trim() === '') {
        throw new Error('Nome da conta é obrigatório.');
    }

    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const newAccount = {
        userId: userId,
        nome: account.nome,
        saldo: account.saldo,
        tipo: account.tipo,
        ...(account.diaFechamento && { diaFechamento: account.diaFechamento }),
        ...(account.diaVencimento && { diaVencimento: account.diaVencimento }),
        ...(account.limiteCredito && { limiteCredito: account.limiteCredito }),
        createdAt: new Date()
    };

    const docRef = await db.collection('accounts').add(newAccount);

    return {
        id: docRef.id,
        ...newAccount
    };
}

export async function getAccountsByUserId(userId: string): Promise<Account[]> {
    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const accountsRef = db.collection('accounts');
    const snapshot = await accountsRef.where('userId', '==', userId).get();

    if (snapshot.empty) {
        return [];
    }

    const accounts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            userId: data.userId,
            nome: data.nome,
            saldo: data.saldo,
            tipo: data.tipo,
            diaFechamento: data.diaFechamento,
            diaVencimento: data.diaVencimento,
            limiteCredito: data.limiteCredito
        } as Account;
    });

    return accounts;
}

export async function updateAccount(userId: string, accountId: string, account: Partial<Account>) {
    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const accountRef = db.collection('accounts').doc(accountId);
    const doc = await accountRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
        throw new Error('Conta não encontrada ou não pertence ao usuário.');
    }

    const updateData = JSON.parse(JSON.stringify({
        nome: account.nome,
        saldo: account.saldo,
        tipo: account.tipo,
        diaFechamento: account.diaFechamento,
        diaVencimento: account.diaVencimento,
        limiteCredito: account.limiteCredito
    }));

    await accountRef.update(updateData);
    
    return { id: accountId, ...updateData };
}

export async function deleteAccount(userId: string, accountId: string) {
    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const accountRef = db.collection('accounts').doc(accountId);
    const doc = await accountRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
        throw new Error('Conta não encontrada ou não pertence ao usuário.');
    }

    const transactionRef = db.collection('transactions');
    const snapshot = await transactionRef.where('accountId', '==', accountId).get();

    const batch = db.batch();

    batch.delete(accountRef);

    if (!snapshot.empty) {
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
    }

    await batch.commit();
}