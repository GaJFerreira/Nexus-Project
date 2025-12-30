import { getAccountsByUserId, createAccount } from "@/core/services/accountService";
import { getTransactions, createTransaction } from "@/core/services/transactionsservice";
import { Wallet, ArrowUpCircle, ArrowDownCircle, DollarSign, Calendar, Database, Plus } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link"; // Importante: Importar o Link

const TEST_USER_ID = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2";

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const accounts = await getAccountsByUserId(TEST_USER_ID);
  const transactions = await getTransactions(TEST_USER_ID, {});

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.saldo, 0);
  
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);
  };

  async function seedDatabase() {
    "use server";
    try {
      console.log("Iniciando seed de teste...");
      
      const newAccount = await createAccount(TEST_USER_ID, {
        nome: "Conta Teste Nubank",
        saldo: 150000,
        tipo: "checking"
      });

      if (newAccount.id) {
        await createTransaction(TEST_USER_ID, {
          accountId: newAccount.id,
          description: "Salário de Teste",
          amount: 500000,
          type: "income",
          category: "Salário",
          paymentMethod: "pix",
          date: new Date()
        });

        await createTransaction(TEST_USER_ID, {
          accountId: newAccount.id,
          description: "Compra Gamer (Mouse)",
          amount: 25000,
          type: "expense",
          category: "Lazer",
          paymentMethod: "debit",
          date: new Date()
        });
      }
      revalidatePath("/");
    } catch (error) {
      console.error("Erro ao rodar seed:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nexus Dashboard</h1>
            <p className="text-gray-500">Visão geral da sua vida financeira</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Botão de Seed (Apenas para Testes - Pode remover depois) */}
            <form action={seedDatabase}>
              <button 
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                title="Gerar dados fictícios"
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Seed</span>
              </button>
            </form>

            {/* BOTÃO NOVA TRANSAÇÃO (O Principal) */}
            <Link 
              href="/transactions/new" 
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-md shadow-purple-200"
            >
              <Plus className="w-4 h-4" />
              Nova Transação
            </Link>
          </div>
        </div>

        {/* Cards de Resumo (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Saldo */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Saldo Total</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatMoney(totalBalance)}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Card Receitas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Receitas</p>
                <h3 className="text-2xl font-bold text-green-600 mt-2">{formatMoney(income)}</h3>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <ArrowUpCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Card Despesas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Despesas</p>
                <h3 className="text-2xl font-bold text-red-600 mt-2">{formatMoney(expense)}</h3>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <ArrowDownCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Lista de Transações */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Transações Recentes</h3>
              <Link href="/transactions" className="text-sm text-purple-600 hover:text-purple-700 font-medium">Ver todas</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhuma transação encontrada. Comece adicionando uma!
                </div>
              ) : (
                transactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                        <DollarSign className={`w-4 h-4 ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{t.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{t.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(t.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lista de Contas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-fit">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Minhas Contas</h3>
              {/* Botão opcional para criar conta */}
              <Link href="/accounts/new" className="text-xs bg-gray-100 p-2 rounded-lg hover:bg-gray-200">
                <Plus className="w-4 h-4 text-gray-600" />
              </Link>
            </div>
            <div className="p-4 space-y-4">
              {accounts.length === 0 ? (
                 <div className="text-center text-gray-500 text-sm py-4">Nenhuma conta cadastrada.</div>
              ) : (
                accounts.map((acc) => (
                  <div key={acc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{acc.nome}</p>
                      <p className="text-xs text-gray-500 capitalize">{acc.tipo.replace('_', ' ')}</p>
                    </div>
                    <p className="font-semibold text-sm text-gray-700">{formatMoney(acc.saldo)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}