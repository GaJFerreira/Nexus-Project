import { getAccountsByUserId } from "@/core/services/accountService";
import { Wallet, Plus, CreditCard, Landmark, PiggyBank, Banknote, ArrowLeft } from "lucide-react";
import Link from "next/link";

const TEST_USER_ID = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2";

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const accounts = await getAccountsByUserId(TEST_USER_ID);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'checking': return <Landmark className="w-6 h-6 text-purple-600" />;
      case 'credit_card': return <CreditCard className="w-6 h-6 text-purple-600" />;
      case 'savings': return <PiggyBank className="w-6 h-6 text-purple-600" />;
      case 'investment': return <Banknote className="w-6 h-6 text-purple-600" />;
      case 'cash': return <Wallet className="w-6 h-6 text-purple-600" />;
      default: return <Wallet className="w-6 h-6 text-purple-600" />;
    }
  };

  const getLabelForType = (type: string) => {
      switch (type) {
        case 'checking': return 'Conta Corrente';
        case 'credit_card': return 'Cartão de Crédito';
        case 'savings': return 'Poupança';
        case 'investment': return 'Investimento';
        case 'cash': return 'Dinheiro';
        default: return type;
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Minhas Contas</h1>
                <p className="text-gray-500">Gerencie seus saldos e cartões</p>
            </div>
          </div>
          
          <Link 
            href="/accounts/new" 
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-md shadow-purple-200"
          >
            <Plus className="w-4 h-4" />
            Nova Conta
          </Link>
        </div>

        {/* Grid de Contas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.length === 0 ? (
             <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Wallet className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>Nenhuma conta encontrada.</p>
                <Link href="/accounts/new" className="text-purple-600 hover:underline mt-2 inline-block">
                  Criar minha primeira conta
                </Link>
             </div>
          ) : (
            accounts.map((acc) => (
              <div key={acc.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                    {getIconForType(acc.tipo)}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{acc.nome}</h3>
                  <p className="text-sm text-gray-500 mb-4">{getLabelForType(acc.tipo)}</p>
                  
                  <div className="pt-4 border-t border-gray-50">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                      {acc.tipo === 'credit_card' ? 'Limite Disponível' : 'Saldo Atual'}
                    </p>
                    <p className={`text-2xl font-bold ${acc.saldo < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatMoney(acc.saldo)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}