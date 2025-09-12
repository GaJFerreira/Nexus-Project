import { NextResponse } from "next/server";
import { initializeAdminApp } from "@/lib/firebase/admin";
import { auth as adminAuth, firestore } from "firebase-admin";

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

      const accountId = params.id;
      const userId = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2";
  
      const { nome, tipo, saldo } = await request.json();
  
      if (!nome || !tipo || saldo === undefined) {
        return NextResponse.json({ message: "Nome, tipo e saldo são obrigatórios." }, { status: 400 });
      }
      
      const db = adminApp.firestore();
      const accountRef = db.collection('accounts').doc(accountId);
  
      const doc = await accountRef.get();
      if (!doc.exists || doc.data()?.userId !== userId) {
        return NextResponse.json({ message: "Conta não encontrada ou não pertence ao usuário." }, { status: 404 });
      }
      
      await accountRef.update({
        nome: nome,
        tipo: tipo,
        saldo: saldo
      });
  
      const updatedDoc = await accountRef.get();
      return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() }, { status: 200 });
  
    } catch (error: any) {
      console.error("Erro ao atualizar conta:", error);
      return NextResponse.json({ message: "Erro ao atualizar conta." }, { status: 500 });
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

      const accountId = params.id;
    
      const userId = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2";

      const db = adminApp.firestore();
      const accountRef = db.collection('accounts').doc(accountId);
      
      const doc = await accountRef.get();
      if (!doc.exists || doc.data()?.userId !== userId) {
        return NextResponse.json({ message: "Conta não encontrada ou não pertence ao usuário." }, { status: 404 });
      }
      
      await accountRef.delete();

      const transactionsRef = db.collection('transactions');
      const snapshot = await transactionsRef.where('accountId', '==', accountId).get();
      
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
      
      return NextResponse.json({ message: `Conta ${accountId} e suas transações foram deletadas.` }, { status: 200 });
  
    } catch (error: any) {
      console.error("Erro ao deletar conta:", error);
      return NextResponse.json({ message: "Erro ao deletar conta." }, { status: 500 });
    }
  }