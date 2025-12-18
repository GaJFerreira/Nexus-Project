import { NextResponse } from "next/server";
import { updateAccount, deleteAccount } from "@/core/services/accountService";

// ID de teste temporário
const TEST_USER_ID = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const accountdata = await request.json();

    const accountUpdate = await updateAccount(TEST_USER_ID, id, accountdata);

    return NextResponse.json(accountUpdate, { status: 200 });

  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await deleteAccount(TEST_USER_ID, id);

    return NextResponse.json({ message: "Conta deletada com sucesso." }, { status: 200 });

  } catch (error) {
    console.error("Erro ao deletar conta:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ message }, { status: 500 });
  }
}