"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, Landmark, CreditCard, Wallet, Banknote, PiggyBank, Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import DashboardClient from "@/components/DashboardClient";
import { auth } from "@/lib/firebase/client";

// Esquema de Validação
const accountSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  saldo: z.string().refine((val) => !isNaN(Number(val.replace(',', '.'))), {
    message: "Valor inválido",
  }),
  tipo: z.enum(['bank', 'checking', 'savings', 'credit_card', 'investment', 'cash']),
  possuiCartaoCredito: z.boolean(),
  faturaAtual: z.string().optional(),
  limiteCredito: z.string().optional(),
  diaFechamento: z.string().optional(),
  diaVencimento: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.possuiCartaoCredito || data.tipo === 'credit_card') {
    if (!data.limiteCredito) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Limite é obrigatório para cartões",
        path: ["limiteCredito"],
      });
    }
    if (!data.diaFechamento) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Dia de fechamento é obrigatório",
        path: ["diaFechamento"],
      });
    }
    if (!data.diaVencimento) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Dia de vencimento é obrigatório",
        path: ["diaVencimento"],
      });
    }
  }
});

type AccountFormData = z.infer<typeof accountSchema>;

export const dynamic = "force-dynamic";

export default function NewAccountPage() {
  return (
    <DashboardClient>
      {() => <NewAccountForm />}
    </DashboardClient>
  );
}

function NewAccountForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      tipo: "bank",
      saldo: "0,00",
      faturaAtual: "0,00",
      possuiCartaoCredito: true
    },
  });

  const tipoConta = watch("tipo");
  const possuiCartaoCredito = watch("possuiCartaoCredito");

  const onSubmit = async (data: AccountFormData) => {
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Usuário não autenticado");

      const saldoInCents = Math.round(Number(data.saldo.replace(',', '.')) * 100);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        nome: data.nome,
        saldo: saldoInCents,
        tipo: data.tipo,
        possuiCartaoCredito: Boolean(data.possuiCartaoCredito || data.tipo === 'credit_card'),
      };

      if (data.possuiCartaoCredito || data.tipo === 'credit_card') {
        const faturaInCents = Math.round(Number((data.faturaAtual || "0").replace(',', '.')) * 100);
        payload.faturaAtual = isNaN(faturaInCents) ? 0 : faturaInCents;
        payload.limiteCredito = Math.round(Number(data.limiteCredito?.replace(',', '.')) * 100);
        payload.diaFechamento = Number(data.diaFechamento);
        payload.diaVencimento = Number(data.diaVencimento);
      }

      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/accounts"); 
        router.refresh();
      } else {
        alert("Erro ao criar conta");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/accounts" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Nova Conta Bancária</h1>
        </div>
      </header>

      <main className="flex-1 p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6">
          
          {/* Nome da Conta */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Instituição / Banco</label>
              <input
                type="text"
                placeholder="Ex: Nubank, Itaú, Santander, Carteira..."
                className="block w-full px-3 py-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border text-black font-semibold"
                {...register("nome")}
              />
              {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
            </div>

            {/* Saldo da Conta Corrente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Saldo na Conta Corrente / Débito (R$)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0,00"
                  className="block w-full px-3 py-3 text-lg border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border text-black font-bold"
                  {...register("saldo")}
                />
              </div>
              {errors.saldo && <p className="text-red-500 text-xs mt-1">{errors.saldo.message}</p>}
            </div>
          </div>

          {/* Tipo de Conta */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Instituição</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${tipoConta === 'bank' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'hover:border-purple-200 text-gray-600'}`}>
                <input type="radio" value="bank" {...register("tipo")} className="sr-only" />
                <Building2 className="w-6 h-6" />
                <span className="text-sm font-medium">Banco Completo</span>
              </label>

              <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${tipoConta === 'checking' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'hover:border-purple-200 text-gray-600'}`}>
                <input type="radio" value="checking" {...register("tipo")} className="sr-only" />
                <Landmark className="w-6 h-6" />
                <span className="text-sm font-medium">Conta Corrente</span>
              </label>

              <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${tipoConta === 'credit_card' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'hover:border-purple-200 text-gray-600'}`}>
                <input type="radio" value="credit_card" {...register("tipo")} className="sr-only" />
                <CreditCard className="w-6 h-6" />
                <span className="text-sm font-medium">Só Cartão</span>
              </label>

              <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${tipoConta === 'savings' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'hover:border-purple-200 text-gray-600'}`}>
                <input type="radio" value="savings" {...register("tipo")} className="sr-only" />
                <PiggyBank className="w-6 h-6" />
                <span className="text-sm font-medium">Poupança</span>
              </label>

              <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${tipoConta === 'investment' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'hover:border-purple-200 text-gray-600'}`}>
                <input type="radio" value="investment" {...register("tipo")} className="sr-only" />
                <Banknote className="w-6 h-6" />
                <span className="text-sm font-medium">Investimento</span>
              </label>

              <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${tipoConta === 'cash' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'hover:border-purple-200 text-gray-600'}`}>
                <input type="radio" value="cash" {...register("tipo")} className="sr-only" />
                <Wallet className="w-6 h-6" />
                <span className="text-sm font-medium">Dinheiro</span>
              </label>
            </div>
          </div>

          {/* Toggle / Checkbox de Cartão de Crédito Integrado */}
          {tipoConta !== 'cash' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Cartão de Crédito Vinculado</h3>
                  <p className="text-xs text-gray-500">Esta conta possui limite de crédito para compras parceladas ou à vista?</p>
                </div>
                <input
                  type="checkbox"
                  checked={possuiCartaoCredito}
                  onChange={(e) => setValue("possuiCartaoCredito", e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {/* Campos de Cartão de Crédito */}
              {(possuiCartaoCredito || tipoConta === 'credit_card') && (
                <div className="pt-4 border-t border-purple-100 space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Limite Total de Crédito (R$)</label>
                      <input
                        type="text"
                        placeholder="Ex: 5000,00"
                        className="block w-full px-3 py-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border text-black font-semibold"
                        {...register("limiteCredito")}
                      />
                      {errors.limiteCredito && <p className="text-red-500 text-xs mt-1">{errors.limiteCredito.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fatura Atual do Cartão (R$)</label>
                      <input
                        type="text"
                        placeholder="0,00"
                        className="block w-full px-3 py-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border text-black font-semibold"
                        {...register("faturaAtual")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dia Fechamento Fatura</label>
                      <select {...register("diaFechamento")} className="block w-full px-3 py-3 border-gray-300 rounded-lg text-black bg-white font-semibold">
                        <option value="">Dia...</option>
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>Dia {day}</option>
                        ))}
                      </select>
                      {errors.diaFechamento && <p className="text-red-500 text-xs mt-1">{errors.diaFechamento.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dia Vencimento Fatura</label>
                      <select {...register("diaVencimento")} className="block w-full px-3 py-3 border-gray-300 rounded-lg text-black bg-white font-semibold">
                        <option value="">Dia...</option>
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>Dia {day}</option>
                        ))}
                      </select>
                      {errors.diaVencimento && <p className="text-red-500 text-xs mt-1">{errors.diaVencimento.message}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Criando Conta..." : "Criar Conta Bancária"}
          </button>

        </form>
      </main>
    </div>
  );
}