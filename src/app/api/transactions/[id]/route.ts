import { NextResponse } from "next/server";
import { initializeAdminApp } from "@/lib/firebase/admin";
import { auth as adminAuth, firestore } from "firebase-admin";

export async function PUT(request: Request,{params}: {params: {id: string}}){
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
    
        const {descricao, valor, data, tipo, categoria, metodoPagamento, totalParcelas, parcelaAtual} = await request.json();
        
        if(!descricao || !valor || !data || !tipo || !categoria || !metodoPagamento){
            return NextResponse.json({message: "Campos obrigatorios não foram preenchidos"}, {status: 400});
        }

        const db = adminApp.firestore();
        const transactionRef = db.collection('transactions').doc(transactionId);
    
        const doc = await transactionRef.get();
        if (!doc.exists || doc.data()?.userId !== userId) {
            return NextResponse.json({ message: "Transação não encontrada ou não pertence ao usuário." }, { status: 404 });
        }

        await transactionRef.update({
            descricao: descricao,
            valor: valor,
            data: new Date(data),
            tipo: tipo,
            categoria: categoria,
            metodoPagamento: metodoPagamento,
            totalParcelas: totalParcelas || 1,
            parcelaAtual: parcelaAtual || 1,
        });

        const updatedDoc = await transactionRef.get();
        return NextResponse.json({id: updatedDoc.id, ...updatedDoc.data()}, {status: 200});

    } catch (error: any) {
        console.error("Erro ao atualizar trasação:" , error)
    }
}

export async function DELETE(request: Request, {params}:{params: {id: string}}) {
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
        if(!doc.exists || doc.data()?.userId !== userId){
            return NextResponse.json({message: "Transaçâo não encontrada ou não pertence ao usuario"}, {status: 404});
        }

        await transactionRef.delete();

        return NextResponse.json({message: "Transação deletada com sucesso"}, {status: 200});

        
    } catch (error:any) {
        console.error("Erro ao deletar transação:", error);
        return NextResponse.json({message: "Erro ao deletar transação."}, {status: 500});
    }
}