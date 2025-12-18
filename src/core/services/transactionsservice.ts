import admin from 'firebase-admin';
import { initializeAdminApp } from '@/lib/firebase/admin';
import { Transaction, TransactionFilters } from '@/core/models';

export async function createTransaction(userId: string, transaction: Omit<Transaction, 'id' | 'userId'>) {

    if (!transaction.description || transaction.description.trim() === '') {
        throw new Error('Descrição é obrigatória.');
    }

    if (!transaction.amount || transaction.amount <= 0) {
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

    const dateObj = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
    if (isNaN(dateObj.getTime())) {
        throw new Error('Data inválida.');
    }

    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const newTransaction = {
        userId: userId,
        accountId: transaction.accountId,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        paymentMethod: transaction.paymentMethod,
        date: dateObj,
        isInstallment: transaction.isInstallment || false,
        installmentTotal: transaction.installmentTotal || 1,
        installmentCurrent: transaction.installmentCurrent || 1,
        installmentParentId: transaction.installmentParentId || null,
        createdAt: new Date(),
    };

    const docRef = await db.collection('transactions').add(newTransaction);

    return {
        id: docRef.id, 
        ...newTransaction
    };
}

export async function getTransactions(userId: string, filters: TransactionFilters) {

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
        const startDate = new Date(filters.year, filters.month - 1, 1);
        const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);
        
        query = query.where('date', '>=', startDate).where('date', '<=', endDate);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
        return [];
    }

    const transactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            date: data.date.toDate ? data.date.toDate() : new Date(data.date) 
        } as Transaction;
    });

    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function updateTransaction(userId: string, transactionId: string, transaction: Partial<Transaction>) {
    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const transactionRef = db.collection('transactions').doc(transactionId);
    const doc = await transactionRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
        throw new Error("Transação não encontrada ou não pertence ao usuario");
    }

    const updateData = JSON.parse(JSON.stringify({
        accountId: transaction.accountId,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        paymentMethod: transaction.paymentMethod,
        date: transaction.date,
        isInstallment: transaction.isInstallment,
        installmentTotal: transaction.installmentTotal,
        installmentCurrent: transaction.installmentCurrent,
        updatedAt: new Date()
    }));

    await transactionRef.update(updateData);

    return {
        id: transactionId, ...updateData
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