import { NextResponse } from "next/server";
import { initializeAdminApp } from "@/lib/firebase/admin";
import { auth as adminAuth, firestore } from "firebase-admin";


export async function POST(request: Request) {
    try {
        const idToken = request.headers.get("Authorization")?.split('Bearer ')[1];
        if(!idToken){
            return NextResponse.json({message: "Acesso não autorizado. Token encontrado"}, {status: 401});
        }

        const decodedtoken = await adminAuth().verifyIdToken(idToken);
        const userId = decodedtoken.uid;

        const {nome, saldo, tipo} = await request.json();

        if(!nome || saldo === undefined || !tipo){
            return NextResponse.json({message: "Nome, Saldo e Tipo são obrigatorios"}, {status: 400})
        }

        const newAccount = {
            userId: userId,
            nome: nome,
            saldo: saldo,
            tipo: tipo,
            data: firestore.FieldValue.serverTimestamp(),
        };

        const db = firestore();
        const docRef = await db.collection('accounts').add(newAccount);

        return NextResponse.json({id: docRef.id, ...newAccount}, {status: 201})

    } catch (error: any) {
         console.error("Erro ao criar conta:", error);
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ message: "Token expirado. Faça login novamente." }, { status: 401 });
    }
    return NextResponse.json({ message: "Erro ao criar conta." }, { status: 500 });
 
    }
}