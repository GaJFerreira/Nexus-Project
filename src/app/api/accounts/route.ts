import { NextResponse } from "next/server";
import { initializeAdminApp } from "@/lib/firebase/admin";
import { auth as adminAuth, firestore } from "firebase-admin";


export async function POST(request: Request) {

    const adminApp = initializeAdminApp(); //Apenas pra testes

    try {
       /* const idToken = request.headers.get("Authorization")?.split('Bearer ')[1];
        if(!idToken){
            return NextResponse.json({message: "Acesso não autorizado. Token encontrado"}, {status: 401});
        }

        const decodedtoken = await adminAuth().verifyIdToken(idToken);
        const userId = decodedtoken.uid;
        */
        const userId = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2";

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

        const db = adminApp.firestore();
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

export async function GET(request: Request) {
    const adminApp = initializeAdminApp();
  
    try {
      /*
      const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
      if (!idToken) {
        return NextResponse.json({ message: "Acesso não autorizado." }, { status: 401 });
      }
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;
      */
  
      const userId = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2";
  

      const db = adminApp.firestore();
      const accountsRef = db.collection('accounts');
      
      const snapshot = await accountsRef.where('userId', '==', userId).get();
  
      if (snapshot.empty) {
        return NextResponse.json([], { status: 200 }); // Retorna uma lista vazia se não encontrar nada
      }
  
      const accounts: any[] = [];
      snapshot.forEach(doc => {
        accounts.push({
          id: doc.id,
          ...doc.data()
        });
      });
  
      return NextResponse.json(accounts, { status: 200 }); // 200 significa "OK"
  
    } catch (error: any) {
      console.error("Erro ao buscar contas:", error);
      return NextResponse.json({ message: "Erro ao buscar contas." }, { status: 500 });
    }
  }

  export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const adminApp = initializeAdminApp();
  
    try {
      const accountId = params.id;
      const userId = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2"; // Seu ID de teste
  
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