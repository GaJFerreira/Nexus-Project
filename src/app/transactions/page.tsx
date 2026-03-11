import { getTransactions, createTransaction } from "@/core/services/transactionsservice";
import { get } from "http";
import { Wallet, Plus, ArrowLeft, Search, Calendar } from "lucide-react";
import Link from "next/link";

const TEST_USER_ID = "Di7CMExsxfYG1ZiMXMmHUPecIAZ2";

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
    const transactions = await getTransactions(TEST_USER_ID, {});
    
    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);
    };

    const getInconForType = (type: string) => {
        switch (type) {
            case 'income': return <Plus className="w-6 h-6 text-green-600" />;
            case 'expense': return <Plus className="w-6 h-6 text-red-600" />;
            default: return <Wallet className="w-6 h-6 text-purple-600" />;
        }
    };

     const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };  

    return(
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto space-y-8">

                {/*Cabeçalho*/}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
                            <p className="text-gray-500">Gerencie suas transações</p>
                        </div>
                    </div>
                    <Link href='/transactions/new'
                          className="flex itens-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transiton-collors texxt-sm font-medium shadow-md shadow-purple-200">
                            <Plus className="w-4 h-4" />
                            Nova Transação
                    </Link>
                </div>

                {/*lista de Transações*/}
                <div className="bg-white rounded-xl shadow-sm border-gray-100 overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex intems-center justify-center mx-auto mb-4">
                                <Search className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Nenhuma transação encontrada.</h3>
                            <p className="text=gray-500 mt-1">Comece registrando alguma transação!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {/*Cabeçalho*/} 
                            <div className="hidden md:grid grid-cols-12 gap-4 p-4  bg-gray-50 font-medium text-gray-500 uppercase tracking-wider">
                                <div className="col-span-1">Descrição / Categoria</div>
                                <div className="col-span-2">Data</div>
                                <div className="col-span-2">Valor</div>    
                            </div>

                            {transactions.map((t) => (
                                <div key={t.id} className="p-4 hover:bg-gray-50 trasiciton-colors group">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 itens-center">

                                        {/*Icone e descrição*/}
                                        <div className="col-span-12 md:col-span-6 flex items-center gap-4">
                                            {getInconForType(t.type)}
                                                                                        <p className="font-semibold text-gray-900">{t.description}</p>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                                <span className="bg-gray-100 px-2 py-5 rounded text-xs">{t.category}</span> 
                                                <span className="text-xs">{t.paymentMethod}</span>
                                            </div>
                                        </div>

                                        {/*Data*/}
                                        <div className="col-span-6 md:col-span-3 flex md:justify-end items-center text-sm text-gray-500">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {formatDate(t.date)}
                                        </div>

                                        {/*Valor*/}
                                        <div className={`col-span-6 md:col-span-3 flex justify-end font-bold text-lg ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}
                                        </div>

                                    </div>
                                </div>


                            ) )}

                        </div>

                    )}
                </div>


            </div>
        </div>
    )
}