import { NextResponse } from "next/server";
import { createTransaction, getTransactions } from "@/core/services/transactionsservice";
import { TransactionFilters } from "@/core/models";
import { initializeAdminApp } from '@/lib/firebase/admin';
import { auth as adminAuth } from 'firebase-admin';

async function getUserIdFromRequest(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        initializeAdminApp();
        const decodedToken = await adminAuth().verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const newTransaction = await createTransaction(userId, body);
        return NextResponse.json(newTransaction, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        return NextResponse.json({ message }, { status: 400 });
    }
}

export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        
        const filters: TransactionFilters = {
            accountId: searchParams.get('accountId'),
            type: searchParams.get('type') as 'income' | 'expense' | null,
            month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
            year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
            startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
            endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
        };

        const transactions = await getTransactions(userId, filters);
        return NextResponse.json(transactions, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        return NextResponse.json({ message }, { status: 500 });
    }
}