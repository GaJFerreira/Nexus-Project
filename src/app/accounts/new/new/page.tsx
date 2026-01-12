"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Landmark, Wallet, Banknote, PiggyBank } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// MELHORIA: Regex simples para validar formato brasileiro de moeda (aceita 1000,00 ou 1000)
const currencyRegex = /^\d+(,\d{1,2})?$/; 

const accountSchema = z.object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    saldo: z.string().refine((val) => {
        if (!val) return false;
        const cleanVal = val.replace(/\./g, '').replace(',', '.');
        return !isNaN(Number(cleanVal));
    }, {
        message: "Valor inválido. Use formato: 0,00",
    }),
    tipo: z.enum(['checking', 'savings', 'credit_card', 'investment', 'cash']),
    limiteCredito: z.string().optional(), 
    diaFechamento: z.string().optional(),
    diaVencimento: z.string().optional(),
}).superRefine((data, ctx) => {
    if(data.tipo === 'credit_card'){
        if(!data.limiteCredito){
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Limite é obrigatório para cartões",
                path: ["limiteCredito"],
            });
        }
        if(!data.diaFechamento){
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Dia de fechamento é obrigatório",
                path: ["diaFechamento"],
            });
        }
        if(!data.diaVencimento){
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Dia de vencimento é obrigatório",
                path: ["diaVencimento"],
            });
        }
    }
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function NewAccountPage(){
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const {
        register, handleSubmit, watch, formState: { errors },
    } = useForm<AccountFormData>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            tipo: "checking",
            saldo: "0,00"
        },
    });

    const tipoConta = watch("tipo");

    const parseCurrencyToCents = (value: string | undefined) => {
        if (!value) return 0;
        const cleanString = value.replace(/\./g, '').replace(',', '.');
        return Math.round(Number(cleanString) * 100);
    };

    const onSubmit = async (data: AccountFormData) => {
        setLoading(true);
        try {
            const saldoInCents = parseCurrencyToCents(data.saldo);

            const payload: any = {
                nome: data.nome,
                saldo: saldoInCents,
                tipo: data.tipo,
            };

            if (data.tipo === 'credit_card') {
                payload.limiteCredito = parseCurrencyToCents(data.limiteCredito);
                payload.diaFechamento = Number(data.diaFechamento);
                payload.diaVencimento = Number(data.diaVencimento);
            }

            const res = await fetch("/api/accounts",{
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });

            if(res.ok){
                router.push("/");
                router.refresh();
            }else{
                alert("Erro ao criar conta");
            }
        } catch (error){
            console.error(error);
            alert("Erro ao conectar com o servidor");
        }finally{
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
            <div className="max-w-2xl mx-auto flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Nova Conta</h1>
            </div>
          </header>
    
          <main className="flex-1 p-4">
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6">
              
              {/* Nome da Conta */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta</label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank, Itaú, Carteira..."
                    className="block w-full px-3 py-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border text-black"
                    {...register("nome")}
                  />
                  {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
                </div>
    
                {/* Saldo Inicial */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {tipoConta === 'credit_card' ? 'Fatura Atual (R$)' : 'Saldo Atual (R$)'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal" // MELHORIA: Abre teclado numérico no celular
                      placeholder="0,00"
                      className="block w-full px-3 py-3 text-lg border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border text-black"
                      {...register("saldo")}
                    />
                  </div>
                  {errors.saldo && <p className="text-red-500 text-xs mt-1">{errors.saldo.message}</p>}
                </div>
              </div>
    
              {/* Tipo de Conta */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Conta</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {/* ... MANTIVE OS RADIOS IGUAIS, POIS ESTAVAM CORRETOS ... */}
                  <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${tipoConta === 'checking' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'hover:border-purple-200 text-gray-600'}`}>
                    <input type="radio" value="checking" {...register("tipo")} className="sr-only" />
                    <Landmark className="w-6 h-6" />
                    <span className="text-sm font-medium">Corrente</span>
                  </label>
    
                  <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${tipoConta === 'credit_card' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'hover:border-purple-200 text-gray-600'}`}>
                    <input type="radio" value="credit_card" {...register("tipo")} className="sr-only" />
                    <CreditCard className="w-6 h-6" />
                    <span className="text-sm font-medium">Cartão</span>
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
    
              {/* Campos Específicos de Cartão de Crédito */}
              {tipoConta === 'credit_card' && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Detalhes do Cartão</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Limite Total (R$)</label>
                    <input
                      type="text"
                      inputMode="decimal" // MELHORIA
                      placeholder="Ex: 5000,00"
                      className="block w-full px-3 py-3 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 border text-black"
                      {...register("limiteCredito")}
                    />
                    {errors.limiteCredito && <p className="text-red-500 text-xs mt-1">{errors.limiteCredito.message}</p>}
                  </div>
    
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dia Fechamento</label>
                      <select {...register("diaFechamento")} className="block w-full px-3 py-3 border-gray-300 rounded-lg text-black bg-white">
                        <option value="">Dia...</option>
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      {errors.diaFechamento && <p className="text-red-500 text-xs mt-1">{errors.diaFechamento.message}</p>}
                    </div>
    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dia Vencimento</label>
                      <select {...register("diaVencimento")} className="block w-full px-3 py-3 border-gray-300 rounded-lg text-black bg-white">
                        <option value="">Dia...</option>
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      {errors.diaVencimento && <p className="text-red-500 text-xs mt-1">{errors.diaVencimento.message}</p>}
                    </div>
                  </div>
                </div>
              )}
    
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Criando Conta..." : "Criar Conta"}
              </button>
    
            </form>
          </main>
        </div>
      );
}