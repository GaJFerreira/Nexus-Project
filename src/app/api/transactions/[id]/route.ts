import { NextResponse } from "next/server";
import { updateTransaction, deleteTransaction } from "@/core/services/transactionsservice";

const TEST_USER_ID = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const transactionData = await request.json();

        const updatedTransaction = await updateTransaction(TEST_USER_ID, id, transactionData);

        return NextResponse.json(updatedTransaction, { status: 200 });
    } catch (error) {
        console.error("Erro ao atualizar transação:", error);
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        return NextResponse.json({ message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        
        await deleteTransaction(TEST_USER_ID, id);

        return NextResponse.json({ message: "Transação deletada com sucesso" }, { status: 200 });

    } catch (error) {
        console.error("Erro ao deletar transação:", error);
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        return NextResponse.json({ message }, { status: 500 });
    }
}