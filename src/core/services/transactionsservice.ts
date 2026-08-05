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

    if (!transaction.accountId || transaction.accountId.trim() === '') {
        throw new Error('Conta é obrigatória.');
    }

    let dateObj: Date;
    if (transaction.date instanceof Date) {
        dateObj = transaction.date;
    } else if (typeof transaction.date === 'string') {
        const dateStr = (transaction.date as string).split('T')[0];
        const parts = dateStr.split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
            dateObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        } else {
            dateObj = new Date(transaction.date);
        }
    } else {
        dateObj = new Date(transaction.date);
    }

    if (isNaN(dateObj.getTime())) {
        throw new Error('Data inválida.');
    }

    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const accountRef = db.collection('accounts').doc(transaction.accountId);

    // Método de pagamento de crédito vs débito/pix/dinheiro
    const isCreditPayment = ['credit', 'credit_parcelado', 'cartao_credito', 'credito'].includes(transaction.paymentMethod);
    const affectsBalance = transaction.type === 'income' || ['debit', 'pix', 'cash', 'debito'].includes(transaction.paymentMethod);

    const isInstallment = Boolean(transaction.isInstallment || (transaction.installmentTotal && transaction.installmentTotal > 1));
    const totalInstallments = (isInstallment && transaction.installmentTotal) ? transaction.installmentTotal : 1;
    const isParentTransaction = isInstallment && (!transaction.installmentParentId);

    // Se for o lançamento da compra parcelada inicial, divide o valor total pelo número de parcelas
    const installmentAmount = (isParentTransaction && totalInstallments > 1) 
        ? Math.round(transaction.amount / totalInstallments) 
        : transaction.amount;

    let createdId = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let createdTransaction: any = null;

    await db.runTransaction(async (t) => {
        const accountDoc = await t.get(accountRef);
        if (!accountDoc.exists || accountDoc.data()?.userId !== userId) {
            throw new Error('Conta associada não foi encontrada ou não pertence ao usuário.');
        }

        const newTxRef = db.collection('transactions').doc();
        createdId = newTxRef.id;

        const descriptionWithInstallment = (isParentTransaction && totalInstallments > 1)
            ? `${transaction.description} (1/${totalInstallments})`
            : transaction.description;

        createdTransaction = {
            userId: userId,
            accountId: transaction.accountId,
            description: descriptionWithInstallment,
            amount: installmentAmount,
            type: transaction.type,
            category: transaction.category,
            paymentMethod: transaction.paymentMethod,
            date: dateObj,
            isInstallment: isInstallment,
            installmentTotal: totalInstallments,
            installmentCurrent: transaction.installmentCurrent || 1,
            installmentParentId: transaction.installmentParentId || null,
            isRecurring: Boolean(transaction.isRecurring),
            recurringFrequency: transaction.recurringFrequency || (transaction.isRecurring ? 'monthly' : undefined),
            createdAt: new Date(),
        };

        t.set(newTxRef, createdTransaction);

        const accountData = accountDoc.data()!;

        if (isCreditPayment) {
            const currentFatura = accountData.faturaAtual || 0;
            const faturaDelta = transaction.type === 'expense' ? installmentAmount : -installmentAmount;
            t.update(accountRef, { faturaAtual: Math.max(0, currentFatura + faturaDelta) });
        } else if (affectsBalance) {
            const currentBalance = accountData.saldo || 0;
            const balanceDelta = transaction.type === 'income' ? installmentAmount : -installmentAmount;
            t.update(accountRef, { saldo: currentBalance + balanceDelta });
        }
    });

    // Se for compra parcelada no cartão de crédito, criar as parcelas filhas subsequentes com o valor de cada parcela
    if (isInstallment && totalInstallments > 1 && !transaction.installmentParentId) {
        const batch = db.batch();

        for (let i = 2; i <= totalInstallments; i++) {
            const monthsToAdd = i - 1;
            let targetMonth = (dateObj.getMonth() + 1) + monthsToAdd;
            let targetYear = dateObj.getFullYear() + Math.floor((targetMonth - 1) / 12);
            targetMonth = ((targetMonth - 1) % 12) + 1;
            if (targetMonth <= 0) targetMonth += 12;

            const maxDays = new Date(targetYear, targetMonth, 0).getDate();
            const targetDay = Math.min(dateObj.getDate(), maxDays);
            const childDate = new Date(targetYear, targetMonth - 1, targetDay, 12, 0, 0);

            const childTxRef = db.collection('transactions').doc();
            batch.set(childTxRef, {
                userId: userId,
                accountId: transaction.accountId,
                description: `${transaction.description} (${i}/${totalInstallments})`,
                amount: installmentAmount,
                type: transaction.type,
                category: transaction.category,
                paymentMethod: transaction.paymentMethod,
                date: childDate,
                isInstallment: true,
                installmentTotal: totalInstallments,
                installmentCurrent: i,
                installmentParentId: createdId,
                isRecurring: Boolean(transaction.isRecurring),
                recurringFrequency: transaction.recurringFrequency,
                createdAt: new Date(),
            });
        }
        await batch.commit();
    } else if (transaction.isRecurring && !isInstallment) {
        // Se for assinatura ou gasto recorrente, projetar ocorrências para os meses futuros
        const batch = db.batch();
        const frequency = transaction.recurringFrequency || 'monthly';
        const numProjections = frequency === 'yearly' ? 2 : 11;

        for (let i = 1; i <= numProjections; i++) {
            const childDate = new Date(dateObj);
            if (frequency === 'yearly') {
                childDate.setFullYear(childDate.getFullYear() + i);
            } else {
                childDate.setMonth(childDate.getMonth() + i);
            }

            const childTxRef = db.collection('transactions').doc();
            batch.set(childTxRef, {
                userId: userId,
                accountId: transaction.accountId,
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type,
                category: transaction.category,
                paymentMethod: transaction.paymentMethod,
                date: childDate,
                isRecurring: true,
                recurringFrequency: frequency,
                createdAt: new Date(),
            });
        }
        await batch.commit();
    }


    return {
        id: createdId, 
        ...createdTransaction
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

    const snapshot = await query.get();

    if (snapshot.empty) {
        return [];
    }

    let transactions = snapshot.docs.map(doc => {
        const data = doc.data();
        let dateObj: Date;
        if (data.date && typeof data.date.toDate === 'function') {
            dateObj = data.date.toDate();
        } else if (typeof data.date === 'string') {
            const dateStr = data.date.split('T')[0];
            const parts = dateStr.split('-').map(Number);
            if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
                dateObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
            } else {
                dateObj = new Date(data.date);
            }
        } else {
            dateObj = new Date(data.date);
        }

        return { 
            id: doc.id, 
            ...data,
            date: dateObj
        } as Transaction;
    });

    if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        transactions = transactions.filter(t => {
            const time = t.date.getTime();
            return time >= start.getTime() && time <= end.getTime();
        });
    } else if (filters.month && filters.year) {
        transactions = transactions.filter(t => {
            const d = t.date;
            return d.getFullYear() === filters.year && (d.getMonth() + 1) === filters.month;
        });
    }

    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function updateTransaction(userId: string, transactionId: string, transaction: Partial<Transaction>) {
    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const transactionRef = db.collection('transactions').doc(transactionId);

    let updatedTx: any = null;

    await db.runTransaction(async (t) => {
        const doc = await t.get(transactionRef);
        if (!doc.exists || doc.data()?.userId !== userId) {
            throw new Error("Transação não encontrada ou não pertence ao usuário");
        }

        const oldData = doc.data()!;
        const newAccountId = transaction.accountId || oldData.accountId;
        const newAmount = transaction.amount !== undefined ? transaction.amount : oldData.amount;
        const newType = transaction.type || oldData.type;
        const newPaymentMethod = transaction.paymentMethod || oldData.paymentMethod;

        // Trata data se informada
        let newDateObj: Date;
        if (transaction.date) {
            if (transaction.date instanceof Date) {
                newDateObj = transaction.date;
            } else if (typeof transaction.date === 'string') {
                const dateStr = (transaction.date as string).split('T')[0];
                const parts = dateStr.split('-').map(Number);
                if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
                    newDateObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
                } else {
                    newDateObj = new Date(transaction.date);
                }
            } else {
                newDateObj = new Date(transaction.date);
            }
        } else if (oldData.date && typeof oldData.date.toDate === 'function') {
            newDateObj = oldData.date.toDate();
        } else {
            newDateObj = new Date(oldData.date);
        }

        // 1. Reverter efeitos da transação antiga na conta antiga
        const oldAccountRef = db.collection('accounts').doc(oldData.accountId);
        const oldAccountDoc = await t.get(oldAccountRef);
        const oldIsCredit = ['credit', 'credit_parcelado', 'cartao_credito', 'credito'].includes(oldData.paymentMethod);
        const oldAffectsBalance = oldData.type === 'income' || ['debit', 'pix', 'cash', 'debito'].includes(oldData.paymentMethod);

        if (oldAccountDoc.exists) {
            const accData = oldAccountDoc.data()!;
            if (oldIsCredit) {
                const currentFatura = accData.faturaAtual || 0;
                const faturaDelta = oldData.type === 'expense' ? -oldData.amount : oldData.amount;
                t.update(oldAccountRef, { faturaAtual: Math.max(0, currentFatura + faturaDelta) });
            } else if (oldAffectsBalance) {
                const currentBalance = accData.saldo || 0;
                const balanceDelta = oldData.type === 'income' ? -oldData.amount : oldData.amount;
                t.update(oldAccountRef, { saldo: currentBalance + balanceDelta });
            }
        }

        // 2. Aplicar novos efeitos na nova conta
        const newAccountRef = db.collection('accounts').doc(newAccountId);
        const newAccountDoc = (newAccountId === oldData.accountId && oldAccountDoc.exists) 
            ? oldAccountDoc 
            : await t.get(newAccountRef);

        const newIsCredit = ['credit', 'credit_parcelado', 'cartao_credito', 'credito'].includes(newPaymentMethod);
        const newAffectsBalance = newType === 'income' || ['debit', 'pix', 'cash', 'debito'].includes(newPaymentMethod);

        if (newAccountDoc.exists) {
            const accData = newAccountDoc.data()!;
            let currentFatura = accData.faturaAtual || 0;
            let currentBalance = accData.saldo || 0;

            if (newAccountId === oldData.accountId) {
                if (oldIsCredit) {
                    const faturaDelta = oldData.type === 'expense' ? -oldData.amount : oldData.amount;
                    currentFatura = Math.max(0, currentFatura + faturaDelta);
                } else if (oldAffectsBalance) {
                    const balanceDelta = oldData.type === 'income' ? -oldData.amount : oldData.amount;
                    currentBalance = currentBalance + balanceDelta;
                }
            }

            if (newIsCredit) {
                const faturaDelta = newType === 'expense' ? newAmount : -newAmount;
                t.update(newAccountRef, { faturaAtual: Math.max(0, currentFatura + faturaDelta) });
            } else if (newAffectsBalance) {
                const balanceDelta = newType === 'income' ? newAmount : -newAmount;
                t.update(newAccountRef, { saldo: currentBalance + balanceDelta });
            }
        }

        // 3. Atualizar documento da transação sem usar JSON.stringify que corrompe Date objetos
        const updateFields: Record<string, any> = {
            accountId: newAccountId,
            description: transaction.description !== undefined ? transaction.description : oldData.description,
            amount: newAmount,
            type: newType,
            category: transaction.category !== undefined ? transaction.category : oldData.category,
            paymentMethod: newPaymentMethod,
            date: newDateObj,
            updatedAt: new Date()
        };

        t.update(transactionRef, updateFields);
        updatedTx = { id: transactionId, ...oldData, ...updateFields };
    });

    return updatedTx;
}


export async function deleteTransaction(userId: string, transactionId: string) {

    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();

    const transactionRef = db.collection('transactions').doc(transactionId);

    await db.runTransaction(async (t) => {
        const doc = await t.get(transactionRef);
        if (!doc.exists || doc.data()?.userId !== userId) {
            throw new Error("Transação não encontrada ou não pertence ao usuario");
        }

        const data = doc.data()!;
        const accountRef = db.collection('accounts').doc(data.accountId);
        const accountDoc = await t.get(accountRef);

        const isCreditPayment = ['credit', 'credit_parcelado', 'cartao_credito', 'credito'].includes(data.paymentMethod);
        const affectsBalance = data.type === 'income' || ['debit', 'pix', 'cash', 'debito'].includes(data.paymentMethod);

        if (accountDoc.exists) {
            const accountData = accountDoc.data()!;
            if (isCreditPayment) {
                const currentFatura = accountData.faturaAtual || 0;
                const faturaDelta = data.type === 'expense' ? -data.amount : data.amount;
                t.update(accountRef, { faturaAtual: Math.max(0, currentFatura + faturaDelta) });
            } else if (affectsBalance) {
                const currentBalance = accountData.saldo || 0;
                const balanceDelta = data.type === 'income' ? -data.amount : data.amount;
                t.update(accountRef, { saldo: currentBalance + balanceDelta });
            }
        }

        t.delete(transactionRef);
    });
}
