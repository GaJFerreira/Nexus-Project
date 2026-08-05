"use client";

import { fetchAccounts, fetchTransactions, fetchGoals } from "@/core/services/apiService";
import { Account, Transaction, Goal } from "@/core/models";
import { Wallet, ArrowUpCircle, ArrowDownCircle, DollarSign, Calendar, Plus, PieChart as PieChartIcon, ChevronLeft, ChevronRight, Repeat, PiggyBank, Target, Compass } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const CATEGORY_COLORS: { [key: string]: string } = {
  Alimentação: "#8884d8",
  Mercado: "#8884d8",
  Lazer: "#82ca9d",
  Transporte: "#ffc658",
  Combustível: "#ff7300",
  Moradia: "#a4de6c",
  Saúde: "#d0ed57",
  Educação: "#83a6ed",
  Outros: "#8884d8",
};

const DEFAULT_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#a4de6c", "#d0ed57", "#83a6ed", "#82ca9d"];

export default function DashboardContent({ userId }: { userId: string }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [accs, trans, gls] = await Promise.all([
          fetchAccounts(),
          fetchTransactions({ month: selectedMonth, year: selectedYear }),
          fetchGoals()
        ]);
        setAccounts(accs);
        setTransactions(trans);
        setGoals(gls);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedMonth, selectedYear]);

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.saldo, 0);
  
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const recurringTransactions = transactions.filter(t => t.isRecurring);
  const totalRecurringMonthly = recurringTransactions.reduce((acc, t) => acc + t.amount, 0);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);
  };

  // Agrupamento de despesas por categoria
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalExpenseAmount = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);

  const categoryMap: { [key: string]: number } = {};
  expenseTransactions.forEach((t) => {
    const cat = t.category || "Outros";
    categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
  });

  const categoryData = Object.keys(categoryMap).map((cat, index) => {
    const amount = categoryMap[cat];
    const percentage = totalExpenseAmount > 0 ? (amount / totalExpenseAmount) * 100 : 0;
    return {
      name: cat,
      value: amount,
      percentage: Number(percentage.toFixed(1)),
      color: CATEGORY_COLORS[cat] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    };
  }).sort((a, b) => b.value - a.value);

  const currentMonthName = MONTH_NAMES[selectedMonth - 1];

  const formatTxDate = (dateInput: Date | string) => {
    let d: Date;
    if (typeof dateInput === 'string') {
      const dateStr = dateInput.split('T')[0];
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      } else {
        d = new Date(dateInput);
      }
    } else {
      d = new Date(dateInput);
    }
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabeçalho com Seletor de Mês */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nexus Dashboard</h1>
            <p className="text-gray-500 font-medium">
              Gastos no mês de <span className="text-purple-700 font-bold underline decoration-purple-300">{currentMonthName} de {selectedYear}</span>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Seletor de Mês/Ano */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-3 font-bold text-sm text-gray-800 min-w-[130px] text-center">
                {currentMonthName} {selectedYear}
              </span>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                title="Próximo Mês"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* BOTÃO PLANEJAMENTO */}
            <Link 
              href="/planning" 
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl transition-colors text-sm font-bold border border-purple-100"
            >
              <Compass className="w-4 h-4 text-purple-600" />
              Planejamento & Previsões
            </Link>

            {/* BOTÃO CAIXINHAS & METAS */}
            <Link 
              href="/goals" 
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-colors text-sm font-bold border border-indigo-100"
            >
              <PiggyBank className="w-4 h-4 text-indigo-600" />
              Caixinhas & Metas
            </Link>

            {/* BOTÃO NOVA TRANSAÇÃO */}
            <Link 
              href="/transactions/new" 
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium shadow-md shadow-purple-200"
            >
              <Plus className="w-4 h-4" />
              Nova Transação
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* Cards de Resumo (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card Saldo */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Saldo Total Consolidado</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatMoney(totalBalance)}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Card Receitas no Mês */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Receitas ({currentMonthName})</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-2">{formatMoney(income)}</h3>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <ArrowUpCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Card Despesas no Mês */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Gastos no mês de {currentMonthName}</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-2">{formatMoney(expense)}</h3>
                  </div>
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                    <ArrowDownCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção de Distribuição de Gastos por Categoria */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <PieChartIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Distribuição de Gastos em {currentMonthName}</h2>
                  <p className="text-sm text-gray-500">Veja em porcentagem onde seu dinheiro foi gasto neste mês</p>
                </div>
              </div>

              {categoryData.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  Nenhuma despesa registrada no mês de {currentMonthName} de {selectedYear}.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Gráfico Donut/Pizza Recharts */}
                  <div className="lg:col-span-5 h-64 flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: any) => formatMoney(Number(val))}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Lista com Porcentagens e Barras de Progresso */}
                  <div className="lg:col-span-7 space-y-4">
                    {categoryData.map((cat) => (
                      <div key={cat.name} className="space-y-1.5">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                            <span className="font-semibold text-gray-800">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded">
                              {cat.percentage}%
                            </span>
                            <span className="font-bold text-gray-900 text-sm">
                              {formatMoney(cat.value)}
                            </span>
                          </div>
                        </div>
                        {/* Barra Visual */}
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-2.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(cat.percentage, 100)}%`,
                              backgroundColor: cat.color,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Lista de Transações */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Transações de {currentMonthName}</h3>
                  <Link href="/transactions" className="text-sm text-purple-600 hover:text-purple-700 font-medium">Ver fatura completa</Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {transactions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      Nenhuma transação registrada neste mês.
                    </div>
                  ) : (
                    transactions.slice(0, 6).map((t) => (
                      <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                            <DollarSign className={`w-4 h-4 ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {t.description}
                              {t.installmentTotal && t.installmentTotal > 1 && (
                                <span className="ml-2 text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                  {t.installmentCurrent}/{t.installmentTotal}
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{t.category}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatTxDate(t.date)}
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

              {/* Lista de Contas & Assinaturas */}
              <div className="space-y-8">
                
                {/* Card de Assinaturas & Custos Recorrentes */}
                <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
                        <Repeat className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">Assinaturas & Recorrências</h3>
                        <p className="text-xs text-indigo-700 font-semibold">Custo em {currentMonthName}</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-indigo-900 text-base">
                      {formatMoney(totalRecurringMonthly)}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    {recurringTransactions.length === 0 ? (
                      <div className="text-center py-6 space-y-2">
                        <p className="text-xs text-gray-500 font-medium">Nenhuma assinatura cadastrada.</p>
                        <Link 
                          href="/transactions/new" 
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar Assinatura
                        </Link>
                      </div>
                    ) : (
                      recurringTransactions.map((rec) => (
                        <div key={rec.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-indigo-50/50 transition-colors">
                          <div className="space-y-0.5">
                            <p className="font-bold text-sm text-gray-900">{rec.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded text-[10px] uppercase">
                                {rec.recurringFrequency === 'yearly' ? 'Anual' : 'Mensal'}
                              </span>
                              <span>•</span>
                              <span>{rec.category}</span>
                            </div>
                          </div>
                          <p className="font-extrabold text-sm text-indigo-900">{formatMoney(rec.amount)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Card de Caixinhas & Metas */}
                <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-600 text-white rounded-xl shadow-md shadow-purple-200">
                        <PiggyBank className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">Caixinhas & Metas</h3>
                        <p className="text-xs text-purple-700 font-semibold">{goals.length} caixinhas ativas</p>
                      </div>
                    </div>
                    <Link href="/goals" className="text-xs font-bold text-purple-600 hover:text-purple-700">Ver todas</Link>
                  </div>

                  <div className="p-4 space-y-3">
                    {goals.length === 0 ? (
                      <div className="text-center py-6 space-y-2">
                        <p className="text-xs text-gray-500 font-medium">Nenhuma caixinha criada ainda.</p>
                        <Link 
                          href="/goals" 
                          className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700"
                        >
                          <Plus className="w-3.5 h-3.5" /> Criar Caixinha
                        </Link>
                      </div>
                    ) : (
                      goals.slice(0, 3).map((g) => {
                        const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
                        return (
                          <div key={g.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-900">{g.name}</span>
                              <span className="font-extrabold text-purple-600">{pct.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: g.color || '#8b5cf6' }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                              <span>{formatMoney(g.currentAmount)}</span>
                              <span>de {formatMoney(g.targetAmount)}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Minhas Contas */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-fit">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Minhas Contas</h3>
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
          </>
        )}

      </div>
    </div>
  );
}


