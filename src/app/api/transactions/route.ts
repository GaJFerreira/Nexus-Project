import { NextResponse } from "next/server";
import { initializeAdminApp } from "@/lib/firebase/admin";
import { auth as adminAuth, firestore } from "firebase-admin";

export async function POST(request: Request) {
    
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

        const{accountId, descricao, valor, data, tipo, categoria, metodoPagamento, totalParcelas, parcelaAtual} = await request.json();

        if(!descricao || !valor || !data || !tipo || !categoria || !metodoPagamento){
            return NextResponse.json({message: "Campos obrigatorios não foram preenchidos"}, {status: 400});
        }

        const newTransaction = {
            userId: userId,
            accountId: accountId,
            descricao: descricao,
            valor: valor,
            data: new Date(data),
            tipo: tipo,
            categoria: categoria,
            metodoPagamento: metodoPagamento,
            totalParcelas: totalParcelas || 1,
            parcelaAtual: parcelaAtual || 1,
            createdAt: firestore.FieldValue.serverTimestamp(),
        }

        const db = adminApp.firestore();
        const docRef = await db.collection('transactions').add(newTransaction);

        return NextResponse.json({id: docRef.id, ...newTransaction}, {status: 201})

    } catch (error: any) {
        console.error("Erro ao criar transação:", error)
        return NextResponse.json({message: "Erro ao criar transação"}, {status: 500})
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
        const transactionsRef = db.collection('transactions');

        const snapshot = await transactionsRef.where('userId', '==', userId).get();

        if (snapshot.empty) {
            return NextResponse.json([], { status: 200 });
        }

        const transactions: any[] = [];
        snapshot.forEach(doc => {
            transactions.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return NextResponse.json(transactions, { status: 200 });

    } catch (error: any) {
        console.error("Erro ao buscar transações:", error);
        return NextResponse.json({ message: "Erro ao buscar transações." }, { status: 500 });
    }
}
