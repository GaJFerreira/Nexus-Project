import { getAccountsByUserId, createAccount } from "@/core/services/accountService";
import { getTransactions, createTransaction } from "@/core/services/transactionsservice";
import { Wallet, ArrowUpCircle, ArrowDownCircle, DollarSign, Calendar, Database, Plus } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";



export default async function home() {

  return (
    <div>


      <main className="bg-white min-h-screen text-black flex justify-around p-4">Conteudo</main>

      <footer className="bg-gray-500 p-2">rodape</footer>
    </div>
  );
}