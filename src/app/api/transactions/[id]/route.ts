import { NextResponse } from "next/server";
import { initializeAdminApp } from "@/lib/firebase/admin";
import { auth as adminAuth, firestore } from "firebase-admin";
import { updateAccount, deleteAccount } from "@/lib/services/accountService";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const adminApp = initializeAdminApp();

    try {
        /* const idToken = request.headers.get("Authorization")?.split('Bearer ')[1];
          if(!idToken){
              return NextResponse.json({message: "Acesso não autorizado. Token encontrado"}, {status: 401});
          }
  
          const decodedtoken = await adminAuth().verifyIdToken(idToken);
          const userId = decodedtoken.uid;
          */

        const userId = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2";

        const accountId = params.id;
        const accountdata = await request.json();

        const accountUpdate = await updateAccount(userId, accountId, accountdata);

    } catch (error: any) {
        console.error("Erro ao atualizar trasação:", error)
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const adminApp = initializeAdminApp();

    try {
        /* const idToken = request.headers.get("Authorization")?.split('Bearer ')[1];
       if(!idToken){
           return NextResponse.json({message: "Acesso não autorizado. Token encontrado"}, {status: 401});
       }

       const decodedtoken = await adminAuth().verifyIdToken(idToken);
       const userId = decodedtoken.uid;
       */

        const transactionId = params.id;
        const userId = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2";

        const db = adminApp.firestore();
        const transactionRef = db.collection('transactions').doc(transactionId);

        const doc = await transactionRef.get();
        if (!doc.exists || doc.data()?.userId !== userId) {
            return NextResponse.json({ message: "Transaçâo não encontrada ou não pertence ao usuario" }, { status: 404 });
        }

        await transactionRef.delete();

        return NextResponse.json({ message: "Transação deletada com sucesso" }, { status: 200 });


    } catch (error: any) {
        console.error("Erro ao deletar transação:", error);
        return NextResponse.json({ message: "Erro ao deletar transação." }, { status: 500 });
    }
}