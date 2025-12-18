import { NextResponse } from "next/server";
import { createTransaction, getTransactions } from "@/core/services/transactionsservice";
import { TransactionFilters } from "@/core/models";

const TEST_USER_ID = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const newTransaction = await createTransaction(TEST_USER_ID, body);
        return NextResponse.json(newTransaction, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        return NextResponse.json({ message }, { status: 400 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        
        const filters: TransactionFilters = {
            accountId: searchParams.get('accountId'),
            type: searchParams.get('type') as 'income' | 'expense' | null,
            month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
            year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
        };

        const transactions = await getTransactions(TEST_USER_ID, filters);
        return NextResponse.json(transactions, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        return NextResponse.json({ message }, { status: 500 });
    }
}