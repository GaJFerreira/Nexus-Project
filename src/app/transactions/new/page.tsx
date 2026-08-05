"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, CreditCard, Tag, Layers } from "lucide-react";
import Link from "next/link"
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import DashboardClient from "@/components/DashboardClient";

const transactionsSchema = z.object({
  description: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),  
  amount: z.string().refine((val) => !isNaN(Number(val.replace(',', '.'))) && Number(val.replace(',', '.')) > 0, {message: "O valor deve ser maior que zero"}),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Selecione uma categoria"),
  paymentMethod: z.string().min(1, "Selecione um método de pagamento"),
  date: z.string().min(1,"Selecione uma data"),
  accountId: z.string().min(1,"Selecione uma conta"),
  isInstallment: z.boolean().optional(),
  installmentTotal: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.enum(["monthly", "yearly"]).optional(),
});

type TransactionsFormData = z.infer<typeof transactionsSchema>;

export const dynamic = "force-dynamic";

export default function TransactionsForm(){
  return (
    <DashboardClient>
      {() => <TransactionsFormContent />}
    </DashboardClient>
  );
}

function TransactionsFormContent(){
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register, handleSubmit, watch, formState: {errors},
  } = useForm<TransactionsFormData>({
    resolver: zodResolver(transactionsSchema),
    defaultValues:{
      type: "expense",
      date: new Date().toISOString().split('T')[0],
      isInstallment: false,
      installmentTotal: "1",
      isRecurring: false,
      recurringFrequency: "monthly"
    },
  });

  const type = watch("type");
  const paymentMethod = watch("paymentMethod");
  const isInstallment = watch("isInstallment");
  const isRecurring = watch("isRecurring");

  const showInstallments = paymentMethod === "credit_parcelado" || isInstallment;

  useEffect(() => {
    async function fetchAccounts(){
      try{
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;

        const res = await fetch('/api/accounts', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setAccounts(data);
        }
      } catch (error){
        console.error("Erro ao buscar contas", error);
      }
    }
    fetchAccounts();
  } ,[]);

  const onSubmit = async (data: TransactionsFormData) => {
    setLoading(true);
    try{
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Usuário não autenticado");

      const amountInCents = Math.round(Number(data.amount.replace(',', '.')) * 100);
      const totalInstallments = showInstallments && data.installmentTotal ? Number(data.installmentTotal) : 1;
      
      const payload = {
        ...data,
        amount: amountInCents,
        isInstallment: showInstallments && totalInstallments > 1,
        installmentTotal: totalInstallments,
        isRecurring: Boolean(data.isRecurring),
        recurringFrequency: data.recurringFrequency || "monthly"
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok){
        router.push("/transactions");
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || "Erro ao salvar transação");
      }

    } catch (error){
      console.error(error);
      alert("Erro ao conectar com o servidor");
    } finally{
      setLoading(false);
    }
  }

  const amountValue = watch("amount");
  const installmentTotalValue = watch("installmentTotal");

  const rawAmount = Number((amountValue || "0").replace(',', '.'));
  const numInstallments = Number(installmentTotalValue || "2");
  const monthlyPreview = (!isNaN(rawAmount) && rawAmount > 0 && !isNaN(numInstallments) && numInstallments > 1) 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rawAmount / numInstallments)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header Mobile-First */}
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/transactions" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
                  type="text"
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
                  placeholder="Ex: Mercado mensal, Combustível, Almoço..."
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
                <option value="">Selecione uma categoria...</option>
                <option value="Mercado">Mercado</option>
                <option value="Combustível">Combustível</option>
                <option value="Lazer">Lazer</option>
                <option value="Alimentação">Alimentação / Restaurantes</option>
                <option value="Transporte">Transporte / Uber</option>
                <option value="Moradia">Moradia / Contas de Casa</option>
                <option value="Saúde">Saúde / Farmácia</option>
                <option value="Educação">Educação</option>
                <option value="Salário">Salário</option>
                <option value="Investimentos">Investimentos</option>
                <option value="Outros">Outros</option>
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>

            {/* Conta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta / Cartão de Origem</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                </div>
                <select {...register("accountId")} className="block w-full pl-10 pr-3 py-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border bg-white text-black">
                  <option value="">Selecione uma conta...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.nome} ({acc.tipo.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>
              {errors.accountId && <p className="text-red-500 text-xs mt-1">{errors.accountId.message}</p>}
            </div>

            {/* Data e Pagamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data da Transação</label>
                <input
                  type="date"
                  className="block w-full py-3 px-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border text-black"
                  {...register("date")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                <select {...register("paymentMethod")} className="block w-full py-3 px-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border bg-white text-black">
                  <option value="">Selecione...</option>
                  <option value="pix">PIX</option>
                  <option value="debit">Débito à Vista</option>
                  <option value="credit">Crédito à Vista</option>
                  <option value="credit_parcelado">Crédito Parcelado</option>
                  <option value="cash">Dinheiro</option>
                </select>
              </div>
            </div>

            {/* Opção de Parcelamento */}
            {type === 'expense' && (
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    {...register("isInstallment")}
                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <span>Compra Parcelada?</span>
                </label>

                {showInstallments && (
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-2 animate-in fade-in">
                    <label className="block text-sm font-semibold text-purple-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-600" />
                      Número de Parcelas
                    </label>
                    <select
                      {...register("installmentTotal")}
                      className="block w-full py-2.5 px-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border bg-white text-black font-semibold"
                    >
                      {Array.from({ length: 23 }, (_, i) => i + 2).map((num) => (
                        <option key={num} value={num}>{num}x parcelas</option>
                      ))}
                    </select>
                    {monthlyPreview ? (
                      <p className="text-xs font-bold text-purple-800 bg-purple-100 p-2.5 rounded-lg border border-purple-200 mt-2">
                        {numInstallments}x de {monthlyPreview} / mês (Valor total: R$ {rawAmount.toFixed(2).replace('.', ',')})
                      </p>
                    ) : (
                      <p className="text-xs text-purple-600">
                        As parcelas subsequentes serão criadas automaticamente nos meses futuros.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Opção de Assinatura / Gasto Recorrente */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800 text-sm">
                <input
                  type="checkbox"
                  {...register("isRecurring")}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <span>É uma Assinatura ou Despesa Recorrente? (Streaming, Celular, Aluguel)</span>
              </label>

              {isRecurring && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3 animate-in fade-in">
                  <label className="block text-sm font-semibold text-indigo-900">Frequência da Cobrança</label>
                  <select
                    {...register("recurringFrequency")}
                    className="block w-full py-2.5 px-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border bg-white text-black font-semibold"
                  >
                    <option value="monthly">Mensal (Cobrança a cada mês)</option>
                    <option value="yearly">Anual (Cobrança 1x ao ano)</option>
                  </select>
                  <p className="text-xs font-semibold text-indigo-700">
                    ✨ Projeção de cobrança gerada automaticamente para os próximos 12 meses nas faturas futuras.
                  </p>
                </div>
              )}
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando Transação..." : "Salvar Transação"}
          </button>

        </form>
      </main>
    </div>
  );

}

