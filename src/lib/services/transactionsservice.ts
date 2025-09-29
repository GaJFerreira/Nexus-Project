import admin from 'firebase-admin'
import { initializeAdminApp } from '../firebase/admin'
import { Filter } from 'firebase-admin/firestore';

interface Transaction {
    accountId: string,
    description: string,
    value: number,
    type: string,
    category: string,
    paymentMethod: string,
    date: Date,
    totalInstallments?: number,
    currentInstallment?: number,
}

export async function createTransaction(userId: string, transaction: Transaction) {

    if (!transaction.description || transaction.description.trim() === '') {
        throw new Error('Descrição é obrigatória.');
    }

    if (!transaction.value || transaction.value <= 0) {
        throw new Error('Valor deve ser maior que zero.');
    }

    if (!transaction.type || (transaction.type !== 'income' && transaction.type !== 'expense')) {
        throw new Error('Tipo inválido. Deve ser "income" ou "expense".');
    }

    if (!transaction.category || transaction.category.trim() === '') {
        throw new Error('Categoria é obrigatória.');
    }

    if (!transaction.paymentMethod || transaction.paymentMethod.trim() === '') {
        throw new Error('Método de pagamento é obrigatório.');
    }

    if (!transaction.date || isNaN(transaction.date.getTime())) {
        throw new Error('Data inválida.');
    }

    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const newTransaction = {
        userId: userId,
        accountId: transaction.accountId,
        description: transaction.description,
        value: transaction.value,
        type: transaction.type,
        category: transaction.category,
        paymentMethod: transaction.paymentMethod,
        date: transaction.date,
        totalInstallments: transaction.totalInstallments || 1,
        currentInstallment: transaction.currentInstallment || 1,
    }

    const docRef = await db.collection('transactions').add(newTransaction);

    return {
        id: docRef.id, ...newTransaction
    }
}

interface Filters {
    accountId?: string | null;
    month?: string | null;
    year?: string | null;
    type?: string | null;
}

export async function getTransactions(userId: string, filters: Filters) {

    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();
    let query: admin.firestore.Query = db.collection('transactions');

    query = query.where('userId', '==', userId);

    if (filters.accountId) {
        query = query.where('accountId', '==', filters.accountId);
    }

    if (filters.type) {
        query = query.where('type', '==', filters.type);
    }

    if (filters.month && filters.year) {
        const numMes = parseInt(filters.month, 10);
        const numAno = parseInt(filters.year, 10);
        const startDate = new Date(numAno, numMes - 1, 1);
        const endDate = new Date(numAno, numMes, 1);
        query = query.where('data', '>=', startDate).where('data', '<', endDate);
    }

    query = query.orderBy('data', 'desc')

    const snapshot = await query.get();

    if (snapshot.empty) {
        return []
    }

    const transactions: any[] = [];
    snapshot.forEach(doc => {
        transactions.push({ id: doc.id, ...doc.data() });
    });

    return transactions;
}

export async function updateTransaction(userId: string, transactionId: string, transaction: Transaction) {
    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const transactionRef = db.collection('transactions').doc(transactionId);
    const doc = await transactionRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
        throw new Error("Transação não encontrada ou não pertence ao usuario");
    }

    const newTransaction = {
        userId: userId,
        accountId: transaction.accountId,
        description: transaction.description,
        value: transaction.value,
        type: transaction.type,
        category: transaction.category,
        paymentMethod: transaction.paymentMethod,
        date: transaction.date,
        totalInstallments: transaction.totalInstallments || 1,
        currentInstallment: transaction.currentInstallment || 1,
    }

    await transactionRef.update(newTransaction);

    return {
        id: transactionId, ...newTransaction
    };
}

export async function deleteTransaction(userId: string, transactionId: string) {

    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const transactionRef = db.collection('transactions').doc(transactionId);
    const doc = await transactionRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
        throw new Error("Transação não encontrada ou não pertence ao usuario");
    }

    await transactionRef.delete();


}
