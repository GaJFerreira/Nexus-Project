import { NextResponse } from "next/server";
import { closeMonthBudget } from "@/core/services/budgetService";
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

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { month, year } = body;

    if (!month || !year) {
      return NextResponse.json({ message: "month e year são obrigatórios" }, { status: 400 });
    }

    const closedPlan = await closeMonthBudget(userId, month, year);
    return NextResponse.json(closedPlan, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao fechar mês";
    return NextResponse.json({ message }, { status: 400 });
  }
}
