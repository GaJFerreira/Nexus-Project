import { NextResponse } from "next/server";
import { withdrawFromGoal } from "@/core/services/goalService";
import { initializeAdminApp } from '@/lib/firebase/admin';
import { auth as adminAuth } from 'firebase-admin';

async function getUserIdFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { accountId, amount } = body;

    if (!accountId || !amount) {
      return NextResponse.json({ message: "accountId e amount são obrigatórios" }, { status: 400 });
    }

    const result = await withdrawFromGoal(userId, id, accountId, amount);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao realizar resgate";
    return NextResponse.json({ message }, { status: 400 });
  }
}
