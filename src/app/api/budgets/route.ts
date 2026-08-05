import { NextResponse } from "next/server";
import { getBudgetForecast, saveBudgetPlan } from "@/core/services/budgetService";
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

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : (now.getMonth() + 1);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : now.getFullYear();

    const forecast = await getBudgetForecast(userId, month, year);
    return NextResponse.json(forecast, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const plan = await saveBudgetPlan(userId, body);
    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar planejamento";
    return NextResponse.json({ message }, { status: 400 });
  }
}
