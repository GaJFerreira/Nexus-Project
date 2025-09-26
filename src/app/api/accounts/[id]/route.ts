import { NextResponse } from "next/server";
import { initializeAdminApp } from "@/lib/firebase/admin";
import { updateAccount,deleteAccount } from "@/lib/services/accountService";

export async function PUT(request: Request, { params }: { params: { id: string } }) {

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

    return NextResponse.json(accountUpdate, { status: 200 });

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

    const userId = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2";

    const accountId = params.id;

    const deleteAcc = await deleteAccount(userId, accountId);

    return NextResponse.json({ message: "Conta deletada com sucesso." }, { status: 200 });

  } catch (error: any) {
    console.error("Erro ao deletar conta:", error);
    return NextResponse.json({ message: "Erro ao deletar conta." }, { status: 500 });
  }
}