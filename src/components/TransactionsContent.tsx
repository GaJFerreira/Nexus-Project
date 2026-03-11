"use client";

import { fetchTransactions } from "@/core/services/apiService";
import { Transaction } from "@/core/models";
import { Wallet, Plus, ArrowLeft, Search, Calendar } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TransactionsContent({ userId }: { userId: string }) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await fetchTransactions();
                setTransactions(data);
            } catch (error) {
                console.error("Erro ao carregar transações:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
            </div>
        );
    }
    
    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);
    };

    const getIconForType = (type: string) => {
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
                        <Link href="/dashboard" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
                            <p className="text-gray-500">Gerencie suas transações</p>
                        </div>
                    </div>
                    <Link href='/transactions/new'
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-md shadow-purple-200">
                            <Plus className="w-4 h-4" />
                            Nova Transação
                    </Link>
                </div>

                {/*lista de Transações*/}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Nenhuma transação encontrada.</h3>
                            <p className="text-gray-500 mt-1">Comece registrando alguma transação!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {/*Cabeçalho*/} 
                            <div className="hidden md:grid grid-cols-12 gap-4 p-4  bg-gray-50 font-medium text-gray-500 uppercase tracking-wider">
                                <div className="col-span-6">Descrição / Categoria</div>
                                <div className="col-span-3">Data</div>
                                <div className="col-span-3 text-right">Valor</div>    
                            </div>

                            {transactions.map((t) => (
                                <div key={t.id} className="p-4 hover:bg-gray-50 transition-colors group">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

                                        {/*Icone e descrição*/}
                                        <div className="col-span-12 md:col-span-6 flex items-center gap-4">
                                            {getIconForType(t.type)}
                                            <div>
                                                <p className="font-semibold text-gray-900">{t.description}</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{t.category}</span> 
                                                    <span className="text-xs capitalize">{t.paymentMethod.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/*Data*/}
                                        <div className="col-span-6 md:col-span-3 flex md:justify-start items-center text-sm text-gray-500">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {formatDate(t.date)}
                                        </div>

                                        {/*Valor*/}
                                        <div className={`col-span-6 md:col-span-3 flex justify-end font-bold text-lg ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
