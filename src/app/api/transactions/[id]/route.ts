import { NextResponse } from "next/server";
import { updateTransaction, deleteTransaction } from "@/core/services/transactionsservice";
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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const transactionData = await request.json();

        const updatedTransaction = await updateTransaction(userId, id, transactionData);

        return NextResponse.json(updatedTransaction, { status: 200 });
    } catch (error) {
        console.error("Erro ao atualizar transação:", error);
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        return NextResponse.json({ message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
        }

        const { id } = await params;
        
        await deleteTransaction(userId, id);

        return NextResponse.json({ message: "Transação deletada com sucesso" }, { status: 200 });

    } catch (error) {
        console.error("Erro ao deletar transação:", error);
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        return NextResponse.json({ message }, { status: 500 });
    }
}