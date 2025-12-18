import { NextResponse } from "next/server";
import { initializeAdminApp } from '@/lib/firebase/admin';
import { auth as adminAuth } from 'firebase-admin';

export async function POST(request: Request){
    initializeAdminApp();

    try{
        const {idToken} = await request.json();

        if(!idToken){
            return NextResponse.json({message: "Token de ID é obrigatório."}, {status: 400});
        }

        const decodedtoken = await adminAuth().verifyIdToken(idToken);

        const uid = decodedtoken.uid;
        const user = await adminAuth().getUser(uid);

        return NextResponse.json({
            message: "Login bem-sucedido!",
            uid: user.uid,
            email: user.email,
            nome: user.displayName
        }, {status: 200});
    } catch(error){
        console.error("Erro ao fazer login:", error);
        return NextResponse.json({message: "Acesso não autorizado ou token inválido"}, {status: 401})
    }
}