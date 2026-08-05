"use client";

import { fetchBudgetForecastApi, saveBudgetPlanApi, closeMonthBudgetApi, fetchAnnualSummaryApi, fetchTransactions } from "@/core/services/apiService";
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Calendar, Layers, Repeat, Settings, CheckCircle2, Lock, FileText, AlertTriangle, X, Sparkles, Printer, BarChart2, Award } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { exportReportToPDF } from "@/lib/exportUtils";

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function PlanningContent({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [forecast, setForecast] = useState<any>(null);
  const [annualSummary, setAnnualSummary] = useState<any>(null);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Modais
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Form de Ajuste de Planejamento
  const [formExpectedIncome, setFormExpectedIncome] = useState("");
  const [formCategoryBudgets, setFormCategoryBudgets] = useState<{ [cat: string]: string }>({});

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [fData, aData] = await Promise.all([
        fetchBudgetForecastApi(selectedMonth, selectedYear),
        fetchAnnualSummaryApi(selectedYear)
      ]);
      setForecast(fData);
      setAnnualSummary(aData);
    } catch (err) {
      console.error("Erro ao carregar planejamento/anual:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);
  };

  const handleOpenEditModal = () => {
    if (!forecast) return;
    setFormExpectedIncome((forecast.expectedIncome / 100).toFixed(2).replace('.', ','));

    const initialBudgets: { [cat: string]: string } = {};
    const categories = ['Mercado', 'Combustível', 'Alimentação', 'Lazer', 'Moradia', 'Transporte', 'Saúde', 'Outros'];
    categories.forEach(cat => {
      const val = forecast.categoryBudgets[cat] || 0;
      initialBudgets[cat] = (val / 100).toFixed(2).replace('.', ',');
    });
    setFormCategoryBudgets(initialBudgets);
    setShowEditModal(true);
  };

  const handleSavePlanning = async (e: React.FormEvent) => {
    e.preventDefault();
    const incomeCents = Math.round(Number(formExpectedIncome.replace(',', '.')) * 100);
    if (isNaN(incomeCents) || incomeCents < 0) {
      alert("Informe uma expectativa de receita válida.");
      return;
    }

    const budgetsCents: { [cat: string]: number } = {};
    Object.keys(formCategoryBudgets).forEach(cat => {
      const valCents = Math.round(Number((formCategoryBudgets[cat] || "0").replace(',', '.')) * 100);
      budgetsCents[cat] = isNaN(valCents) ? 0 : valCents;
    });

    setSubmitting(true);
    try {
      await saveBudgetPlanApi({
        month: selectedMonth,
        year: selectedYear,
        expectedIncome: incomeCents,
        categoryBudgets: budgetsCents
      });
      setShowEditModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar planejamento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseMonthSubmit = async () => {
    setSubmitting(true);
    try {
      await closeMonthBudgetApi(selectedMonth, selectedYear);
      setShowCloseModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Erro ao fechar mês");
    } finally {
      setSubmitting(false);
    }
  };

  const currentMonthName = MONTH_NAMES[selectedMonth - 1];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Planejamento & Previsões</h1>
              <p className="text-gray-500 font-medium">Orçamento previsto, acompanhamento e fechamento mensal</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Navegação de Mês */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-3 font-bold text-sm text-gray-800 min-w-[130px] text-center">
                {currentMonthName} {selectedYear}
              </span>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleOpenEditModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 font-bold text-sm shadow-sm"
            >
              <Settings className="w-4 h-4 text-purple-600" />
              Ajustar Metas
            </button>

            <button
              onClick={() => setShowCloseModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold text-sm shadow-md shadow-purple-200"
            >
              <FileText className="w-4 h-4" />
              {forecast?.status === 'closed' ? 'Ver Fechamento' : 'Fechar Mês'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        ) : !forecast ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-gray-100">
            Erro ao carregar dados do planejamento.
          </div>
        ) : (
          <>
            {/* Status do Mês */}
            {forecast.status === 'closed' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-900">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-sm">Este mês já foi oficializado e fechado!</h3>
                    <p className="text-xs text-emerald-700">Confira o relatório oficial no botão "Ver Fechamento".</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700"
                >
                  Abrir Relatório
                </button>
              </div>
            )}

            {/* KPI Cards (Expectativas vs Realizado) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Renda Esperada */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-green-600">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Receita Prevista</span>
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-gray-900">{formatMoney(forecast.expectedIncome)}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-1">
                    Entrou até agora: <span className="text-green-600 font-extrabold">{formatMoney(forecast.actualIncome)}</span>
                  </p>
                </div>
              </div>

              {/* Saídas Totais Previstas */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-red-500">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Saídas Previstas</span>
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-gray-900">{formatMoney(forecast.expectedTotalExpense)}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-1">
                    Gasto até agora: <span className="text-red-500 font-extrabold">{formatMoney(forecast.actualExpense)}</span>
                  </p>
                </div>
              </div>

              {/* Saldo Final Esperado */}
              <div className="bg-gradient-to-br from-slate-900 to-purple-950 text-white rounded-3xl p-6 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-purple-200">
                  <span className="text-xs font-bold uppercase tracking-wider">Saldo Final Esperado</span>
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-white">{formatMoney(forecast.expectedFinalBalance)}</p>
                  <p className="text-xs text-slate-300 mt-1">
                    Estimativa do saldo bancário no último dia de {currentMonthName}
                  </p>
                </div>
              </div>

            </div>

            {/* Compromissos Fixos (Parcelas + Assinaturas do Mês) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Parcelas do Cartão */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 text-purple-600 font-bold">
                    <Layers className="w-5 h-5" />
                    <h3 className="text-gray-900">Parcelas Ativas em {currentMonthName}</h3>
                  </div>
                  <span className="text-xs font-extrabold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">
                    {formatMoney(forecast.totalInstallmentExpense)}
                  </span>
                </div>

                <div className="space-y-3">
                  {forecast.installmentTransactions.length === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">Nenhuma parcela neste mês.</p>
                  ) : (
                    forecast.installmentTransactions.map((tx: any) => (
                      <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <p className="font-bold text-sm text-gray-900">{tx.description}</p>
                          <p className="text-xs text-gray-500">{tx.category}</p>
                        </div>
                        <span className="font-extrabold text-sm text-purple-900">{formatMoney(tx.amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Assinaturas & Recorrências */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold">
                    <Repeat className="w-5 h-5" />
                    <h3 className="text-gray-900">Assinaturas em {currentMonthName}</h3>
                  </div>
                  <span className="text-xs font-extrabold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                    {formatMoney(forecast.totalRecurringExpense)}
                  </span>
                </div>

                <div className="space-y-3">
                  {forecast.recurringTransactions.length === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">Nenhuma assinatura registrada neste mês.</p>
                  ) : (
                    forecast.recurringTransactions.map((tx: any) => (
                      <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <p className="font-bold text-sm text-gray-900">{tx.description}</p>
                          <p className="text-xs text-gray-500">{tx.category}</p>
                        </div>
                        <span className="font-extrabold text-sm text-indigo-900">{formatMoney(tx.amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Tabela de Planejado vs Realizado por Categoria */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Gastos Variáveis por Categoria</h2>
                  <p className="text-xs text-gray-500">Comparativo em tempo real entre o limite planejado e o valor gasto</p>
                </div>

                <button
                  onClick={handleOpenEditModal}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 underline"
                >
                  Editar Limites
                </button>
              </div>

              <div className="space-y-5">
                {Object.keys(forecast.categoryBudgets).map((cat) => {
                  const planned = forecast.categoryBudgets[cat] || 0;
                  const actual = forecast.categoryActualMap[cat] || 0;
                  const percentage = planned > 0 ? (actual / planned) * 100 : (actual > 0 ? 100 : 0);
                  const isOver = actual > planned && planned > 0;

                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{cat}</span>
                          {isOver && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" /> Excedido
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-500">
                            {formatMoney(actual)} de {formatMoney(planned)}
                          </span>
                          <span className={`font-extrabold text-sm ${isOver ? 'text-red-600' : 'text-purple-600'}`}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-purple-600'}`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfico Comparativo Anual */}
            {annualSummary && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Evolução Financeira Anual ({selectedYear})</h2>
                    <p className="text-xs text-gray-500">Histórico de Entradas, Saídas e Balanço Líquido mês a mês</p>
                  </div>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-green-600" />
                      Maior Economia: {annualSummary.bestMonth.monthName} ({formatMoney(annualSummary.bestMonth.netBalance)})
                    </span>
                    <span className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      Maior Gasto: {annualSummary.worstMonth.monthName} ({formatMoney(annualSummary.worstMonth.expense)})
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={annualSummary.monthsData.map((m: any) => ({
                        name: m.monthName,
                        Entradas: m.income / 100,
                        Saídas: m.expense / 100,
                        Balanço: m.netBalance / 100
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                      <Tooltip
                        formatter={(val: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val))}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Balanço" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </>
        )}

      </div>

      {/* Modal Ajustar Metas */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Ajustar Planejamento</h2>
                <p className="text-xs text-gray-500">Defina sua renda estimada e os limites de gastos por categoria</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlanning} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Receita / Salário Esperado (R$)</label>
                <input
                  type="text"
                  value={formExpectedIncome}
                  onChange={(e) => setFormExpectedIncome(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 font-extrabold text-gray-900 text-lg"
                  required
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 border-b border-purple-100 pb-1">
                  Limites por Categoria (R$)
                </h3>

                {Object.keys(formCategoryBudgets).map((cat) => (
                  <div key={cat} className="flex justify-between items-center gap-4">
                    <label className="text-sm font-bold text-gray-800 w-1/2">{cat}</label>
                    <input
                      type="text"
                      value={formCategoryBudgets[cat]}
                      onChange={(e) => setFormCategoryBudgets({ ...formCategoryBudgets, [cat]: e.target.value })}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 font-semibold text-gray-900 text-right"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-1/3 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 shadow-md shadow-purple-200 disabled:opacity-50"
                >
                  {submitting ? "Salvando..." : "Salvar Planejamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fechamento do Mês / Relatório */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Relatório de Fechamento do Mês</h2>
                <p className="text-xs font-bold text-purple-600">{currentMonthName} de {selectedYear}</p>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {forecast?.closingReport ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl space-y-2 text-center shadow-lg">
                  <span className="text-xs uppercase tracking-wider font-bold text-emerald-200">Balanço do Mês</span>
                  <p className="text-4xl font-extrabold">
                    {forecast.closingReport.netBalance >= 0 ? '+' : ''}{formatMoney(forecast.closingReport.netBalance)}
                  </p>
                  <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                    {forecast.closingReport.netBalance >= 0 ? '🎉 Balanço Positivo' : '⚠️ Balanço Negativo'}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Saldo Inicial do Mês:</span>
                    <span className="font-bold text-gray-900">{formatMoney(forecast.closingReport.initialBalance)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Total de Entradas:</span>
                    <span className="font-bold text-green-600">+{formatMoney(forecast.closingReport.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Total de Saídas:</span>
                    <span className="font-bold text-red-600">-{formatMoney(forecast.closingReport.totalExpense)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold border-t border-gray-200 pt-2">
                    <span className="text-gray-900">Saldo Final do Mês:</span>
                    <span className="text-purple-700">{formatMoney(forecast.closingReport.finalBalance)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={async () => {
                      const txs = await fetchTransactions({ month: selectedMonth, year: selectedYear });
                      exportReportToPDF(
                        `Fechamento do Mês`,
                        `${currentMonthName} de ${selectedYear}`,
                        txs,
                        {
                          income: forecast.closingReport.totalIncome,
                          expense: forecast.closingReport.totalExpense,
                          balance: forecast.closingReport.netBalance
                        }
                      );
                    }}
                    className="px-4 py-2.5 bg-purple-50 text-purple-700 font-bold rounded-xl text-sm hover:bg-purple-100 flex items-center gap-2 border border-purple-100"
                  >
                    <Printer className="w-4 h-4 text-purple-600" />
                    Baixar Relatório PDF
                  </button>

                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-gray-800"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-center">
                <div className="p-4 bg-purple-50 rounded-2xl text-purple-900 text-sm font-medium leading-relaxed">
                  Ao clicar em <strong>Confirmar Fechamento</strong>, o sistema calculará o balanço oficial de {currentMonthName} de {selectedYear} e travará o relatório mensal para consulta futura.
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-2 text-left text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Entradas Realizadas:</span>
                    <span className="font-bold text-green-600">+{formatMoney(forecast?.actualIncome || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saídas Realizadas:</span>
                    <span className="font-bold text-red-600">-{formatMoney(forecast?.actualExpense || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-gray-900 pt-1 border-t">
                    <span>Balanço Previsto:</span>
                    <span className={forecast?.actualNetBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {forecast?.actualNetBalance >= 0 ? '+' : ''}{formatMoney(forecast?.actualNetBalance || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="w-1/3 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCloseMonthSubmit}
                    disabled={submitting}
                    className="w-2/3 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 shadow-md disabled:opacity-50"
                  >
                    {submitting ? "Fechando..." : "Confirmar Fechamento do Mês"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
