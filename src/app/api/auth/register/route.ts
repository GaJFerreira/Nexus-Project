

import { NextResponse } from 'next/server';
import { initializeAdminApp } from '@/lib/firebase/admin'; // Importa nosso inicializador
import { auth as adminAuth } from 'firebase-admin';


export async function POST(request: Request) {

  initializeAdminApp();

  try {
    const { nome, email, password } = await request.json();

    if (!nome || !email || !password) {
      return NextResponse.json({ message: "Nome, email e senha são obrigatórios." }, { status: 400 });
    }

    const userRecord = await adminAuth().createUser({
      email: email,
      password: password,
      displayName: nome,
    });

    return NextResponse.json({ 
      uid: userRecord.uid, 
      email: userRecord.email, 
      nome: userRecord.displayName 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Erro ao registrar usuário:", error);
    return NextResponse.json({ message: "Erro ao registrar usuário." }, { status: 500 });
  }
}