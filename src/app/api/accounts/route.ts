import { NextResponse } from "next/server";
import { createAccount, getAccountsByUserId } from "@/core/services/accountService";
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

    const account = await request.json();
    const newAccount = await createAccount(userId, account);

    return NextResponse.json(newAccount, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar conta:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const accounts = await getAccountsByUserId(userId);
    return NextResponse.json(accounts, { status: 200 });

  } catch (error) {
    console.error("Erro ao buscar contas:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ message }, { status: 500 });
  }
}