"use client"

import {useForm} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { ArrowLeft, DollarSign, ArrowUpCircle, ArrowDownCircle, CreditCard, Tag } from "lucide-react";
import Link from "next/link"
import { useState, useEffect } from "react";
import { Transaction } from "firebase-admin/firestore"

const transactionsSchema = z.object({
  description: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),  
  amount: z.string().refine((val) => !isNaN(Number(val.replace(',', '.'))) && Number(val.replace(',', '.')) > 0, {message: "O valor deve ser amior que zero"}),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Selecione uma categoria"),
  paymentMethod: z.string().min(1, "Selecione um metodo de pagamento"),
  date: z.string().min(1,"Selecione uma data"),
  accountId: z.string().min(1,"Selecione uma conta"),
});

type TransactionsFormData = z.infer<typeof transactionsSchema>;

export default function TransactionsForm(){

  const router = useRouter();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const{
    register, handleSubmit, watch, formState: {errors},
  } = useForm<TransactionsFormData>({
    resolver: zodResolver(transactionsSchema),
    defaultValues:{
      type: "expense",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const type = watch("type");

  useEffect(() => {
    async function fetchAccounts(){
      try{
        const res = await fetch('api/accounts');
        const data = await res.json();
        setAccounts(data);
      } catch (error){
        console.error("Erro ao buscar contas", error);
      }
    }
  } ,[]);

  const onSubmit = async (data: TransactionsFormData) => {
    setLoading(true);
    try{
      const amountInCents = Math.round(Number(data.amount.replace(',', '.')) * 100)
      
      const playload = {
        ...data,
        amount: amountInCents,
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(playload),
      });

      if (res.ok){
        router.push("/");
        router.refresh();
      } else {
        alert("Erro ao salvar transação");
      }

    } catch (error){
      console.error(error);
      alert("Erro ao conectar com o servidor");
    } finally{
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Mobile-First */}
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Nova Transação</h1>
        </div>
      </header>

      <main className="flex-1 p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6">
          
          {/* Seletor de Tipo (Receita/Despesa) */}
          <div className="grid grid-cols-2 gap-4">
            <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${type === 'expense' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-500 hover:border-red-200'}`}>
              <input type="radio" value="expense" {...register("type")} className="sr-only" />
              <ArrowDownCircle className="w-6 h-6" />
              <span className="font-medium">Despesa</span>
            </label>
            <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${type === 'income' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:border-green-200'}`}>
              <input type="radio" value="income" {...register("type")} className="sr-only" />
              <ArrowUpCircle className="w-6 h-6" />
              <span className="font-medium">Receita</span>
            </label>
          </div>

          {/* Valor */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-semibold">R$</span>
                </div>
                <input
                  type="text" // Usando text para facilitar input de moeda
                  placeholder="0,00"
                  className="block w-full pl-10 pr-3 py-3 text-lg border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border text-black"
                  {...register("amount")}
                />
              </div>
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Ex: Almoço, Uber, Salário..."
                  className="block w-full pl-10 pr-3 py-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border text-black"
                  {...register("description")}
                />
              </div>
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
          </div>

          {/* Detalhes */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            
            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select {...register("category")} className="block w-full py-3 px-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border bg-white text-black">
                <option value="">Selecione...</option>
                <option value="Alimentação">Alimentação</option>
                <option value="Transporte">Transporte</option>
                <option value="Lazer">Lazer</option>
                <option value="Moradia">Moradia</option>
                <option value="Saúde">Saúde</option>
                <option value="Educação">Educação</option>
                <option value="Salário">Salário</option>
                <option value="Investimentos">Investimentos</option>
                <option value="Outros">Outros</option>
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>

            {/* Conta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta / Cartão</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                </div>
                <select {...register("accountId")} className="block w-full pl-10 pr-3 py-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border bg-white text-black">
                  <option value="">Selecione uma conta...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.nome}</option>
                  ))}
                </select>
              </div>
              {errors.accountId && <p className="text-red-500 text-xs mt-1">{errors.accountId.message}</p>}
            </div>

            {/* Data e Pagamento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  className="block w-full py-3 px-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border text-black"
                  {...register("date")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pagamento</label>
                <select {...register("paymentMethod")} className="block w-full py-3 px-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border bg-white text-black">
                  <option value="">Selecione...</option>
                  <option value="credit">Crédito</option>
                  <option value="debit">Débito</option>
                  <option value="pix">PIX</option>
                  <option value="cash">Dinheiro</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : "Salvar Transação"}
          </button>

        </form>
      </main>
    </div>
  );

}
