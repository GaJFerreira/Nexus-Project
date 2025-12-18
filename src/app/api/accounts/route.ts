import { NextResponse } from "next/server";
import { createAccount, getAccountsByUserId } from "@/core/services/accountService";

// ID de teste temporário
const TEST_USER_ID = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2";

export async function POST(request: Request) {
  try {
    const account = await request.json();
    const newAccount = await createAccount(TEST_USER_ID, account);

    return NextResponse.json(newAccount, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar conta:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const accounts = await getAccountsByUserId(TEST_USER_ID);
    return NextResponse.json(accounts, { status: 200 });

  } catch (error) {
    console.error("Erro ao buscar contas:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ message }, { status: 500 });
  }
}