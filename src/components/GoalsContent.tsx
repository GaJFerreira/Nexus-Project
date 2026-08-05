"use client";

import { fetchAccounts, fetchGoals, createGoalApi, depositToGoalApi, withdrawFromGoalApi, deleteGoalApi } from "@/core/services/apiService";
import { Account, Goal } from "@/core/models";
import { ArrowLeft, Plus, PiggyBank, Target, ArrowUpRight, ArrowDownLeft, Trash2, X, Sparkles, ShieldCheck, Plane, Car, Gift } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const CATEGORY_ICONS: { [key: string]: any } = {
  reserva: ShieldCheck,
  viagem: Plane,
  bens: Car,
  outros: Gift,
};

const CATEGORY_NAMES: { [key: string]: string } = {
  reserva: 'Reserva de Emergência',
  viagem: 'Viagem / Férias',
  bens: 'Conquistas / Bens',
  outros: 'Outros Objetivos',
};

export default function GoalsContent({ userId }: { userId: string }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modais
  const [showNewModal, setShowNewModal] = useState(false);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [withdrawGoal, setWithdrawGoal] = useState<Goal | null>(null);

  // Form Nova Caixinha
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [initialAmount, setInitialAmount] = useState("0");
  const [category, setCategory] = useState<'reserva' | 'viagem' | 'bens' | 'outros'>("reserva");
  const [color, setColor] = useState("#8b5cf6");

  // Form Depósito / Resgate
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [actionAmount, setActionAmount] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [accs, gls] = await Promise.all([
        fetchAccounts(),
        fetchGoals()
      ]);
      setAccounts(accs);
      setGoals(gls);
    } catch (err) {
      console.error("Erro ao carregar metas/caixinhas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Informe o nome da Caixinha.");
      return;
    }

    const targetCents = Math.round(Number(targetAmount.replace(',', '.')) * 100);
    const initialCents = Math.round(Number(initialAmount.replace(',', '.')) * 100);

    if (isNaN(targetCents) || targetCents <= 0) {
      alert("Informe uma meta de valor válida maior que zero.");
      return;
    }

    setSubmitting(true);
    try {
      await createGoalApi({
        name,
        targetAmount: targetCents,
        currentAmount: isNaN(initialCents) ? 0 : initialCents,
        category,
        color
      });
      setShowNewModal(false);
      setName("");
      setTargetAmount("");
      setInitialAmount("0");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Erro ao criar Caixinha");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal || !depositGoal.id) return;
    if (!selectedAccountId) {
      alert("Selecione a conta bancária de onde sairá o dinheiro.");
      return;
    }

    const amountCents = Math.round(Number(actionAmount.replace(',', '.')) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      alert("Informe um valor válido maior que zero.");
      return;
    }

    setSubmitting(true);
    try {
      await depositToGoalApi(depositGoal.id, selectedAccountId, amountCents);
      setDepositGoal(null);
      setActionAmount("");
      setSelectedAccountId("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Erro ao depositar na Caixinha");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawGoal || !withdrawGoal.id) return;
    if (!selectedAccountId) {
      alert("Selecione a conta bancária para receber o resgate.");
      return;
    }

    const amountCents = Math.round(Number(actionAmount.replace(',', '.')) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      alert("Informe um valor válido maior que zero.");
      return;
    }

    setSubmitting(true);
    try {
      await withdrawFromGoalApi(withdrawGoal.id, selectedAccountId, amountCents);
      setWithdrawGoal(null);
      setActionAmount("");
      setSelectedAccountId("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Erro ao resgatar da Caixinha");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goal: Goal) => {
    if (!goal.id) return;
    const confirmed = confirm(`Tem certeza que deseja excluir a caixinha "${goal.name}"?`);
    if (!confirmed) return;

    try {
      await deleteGoalApi(goal.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir Caixinha");
    }
  };

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const overallPercentage = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

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
              <h1 className="text-3xl font-bold text-gray-900">Metas Financeiras & Caixinhas</h1>
              <p className="text-gray-500 font-medium">Guarde e faça seu dinheiro render para suas conquistas e sonhos</p>
            </div>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-bold text-sm shadow-md shadow-purple-200"
          >
            <Plus className="w-5 h-5" />
            Nova Caixinha
          </button>
        </div>

        {/* Cards Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-3xl p-6 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-purple-200">
              <span className="text-xs font-bold uppercase tracking-wider">Total Guardado</span>
              <PiggyBank className="w-6 h-6" />
            </div>
            <p className="text-3xl font-extrabold">{formatMoney(totalSaved)}</p>
            <p className="text-xs text-purple-200 font-medium">Em {goals.length} caixinhas ativas</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Meta Total</span>
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{formatMoney(totalTarget)}</p>
            <p className="text-xs text-gray-400 font-medium">Soma de todos os objetivos</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3 flex flex-col justify-center">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-700">Progresso Geral</span>
              <span className="text-purple-600">{overallPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 text-right font-medium">
              Faltam {formatMoney(Math.max(0, totalTarget - totalSaved))}
            </p>
          </div>
        </div>

        {/* Lista de Caixinhas */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Minhas Caixinhas</h2>

          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : goals.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-4">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Você ainda não possui caixinhas.</h3>
                <p className="text-gray-500 text-sm mt-1">Crie sua primeira caixinha para organizar sua reserva ou economizar para viagens e objetivos.</p>
              </div>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors shadow-md"
              >
                Criar Minha Primeira Caixinha
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => {
                const IconComponent = CATEGORY_ICONS[goal.category] || ShieldCheck;
                const percentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

                return (
                  <div key={goal.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5 hover:shadow-md transition-shadow flex flex-col justify-between">
                    
                    <div className="space-y-4">
                      {/* Topo do Card */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
                            style={{ backgroundColor: goal.color || '#8b5cf6' }}
                          >
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{goal.name}</h3>
                            <span className="text-xs font-semibold text-gray-400">
                              {CATEGORY_NAMES[goal.category] || 'Objetivo'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteGoal(goal)}
                          className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Excluir Caixinha"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Valores */}
                      <div className="space-y-1 pt-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-2xl font-extrabold text-gray-900">{formatMoney(goal.currentAmount)}</span>
                          <span className="text-xs text-gray-500 font-bold">de {formatMoney(goal.targetAmount)}</span>
                        </div>

                        {/* Barra de Progresso */}
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: goal.color || '#8b5cf6'
                            }}
                          ></div>
                        </div>

                        <div className="flex justify-between text-xs text-gray-400 font-medium pt-1">
                          <span>{percentage.toFixed(0)}% concluído</span>
                          <span>Faltam {formatMoney(remaining)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => { setDepositGoal(goal); setActionAmount(""); setSelectedAccountId(accounts[0]?.id || ""); }}
                        className="py-2.5 px-3 bg-purple-50 text-purple-700 rounded-xl font-bold text-xs hover:bg-purple-100 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ArrowDownLeft className="w-4 h-4 text-purple-600" />
                        Depositar
                      </button>
                      <button
                        onClick={() => { setWithdrawGoal(goal); setActionAmount(""); setSelectedAccountId(accounts[0]?.id || ""); }}
                        className="py-2.5 px-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ArrowUpRight className="w-4 h-4 text-gray-600" />
                        Resgatar
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Modal Criar Caixinha */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Nova Caixinha</h2>
                <p className="text-xs text-gray-500">Defina um objetivo financeiro para economizar</p>
              </div>
              <button onClick={() => setShowNewModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Nome da Caixinha</label>
                <input
                  type="text"
                  placeholder="Ex: Reserva de Emergência, Viagem Disney"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 font-semibold text-gray-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Meta de Valor (R$)</label>
                  <input
                    type="text"
                    placeholder="10000,00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 font-extrabold text-gray-900 text-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Valor Inicial (R$)</label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 font-bold text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Categoria do Objetivo</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 font-semibold text-gray-900 bg-white"
                >
                  <option value="reserva">Reserva de Emergência</option>
                  <option value="viagem">Viagem / Férias</option>
                  <option value="bens">Conquistas / Bens (Carro, Casa, Eletrônicos)</option>
                  <option value="outros">Outros Objetivos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Cor Temática</label>
                <div className="flex gap-2">
                  {['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#64748b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-110 ring-2 ring-offset-2 ring-purple-600' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="w-1/3 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 shadow-md shadow-purple-200 disabled:opacity-50"
                >
                  {submitting ? "Criando..." : "Criar Caixinha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Depositar */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Depositar na Caixinha</h2>
                <p className="text-xs font-semibold text-purple-600">{depositGoal.name}</p>
              </div>
              <button onClick={() => setDepositGoal(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Retirar da Conta Bancária</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 font-semibold text-gray-900 bg-white"
                  required
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.nome} (Saldo disponível: {formatMoney(acc.saldo)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Valor a Guardar (R$)</label>
                <input
                  type="text"
                  placeholder="500,00"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 font-extrabold text-gray-900 text-xl"
                  required
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="w-1/3 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 shadow-md shadow-purple-200 disabled:opacity-50"
                >
                  {submitting ? "Confirmando..." : "Confirmar Depósito"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Resgatar */}
      {withdrawGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Resgatar da Caixinha</h2>
                <p className="text-xs font-semibold text-purple-600">{withdrawGoal.name} (Saldo: {formatMoney(withdrawGoal.currentAmount)})</p>
              </div>
              <button onClick={() => setWithdrawGoal(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Receber na Conta Bancária</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 font-semibold text-gray-900 bg-white"
                  required
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.nome} ({acc.tipo.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Valor a Resgatar (R$)</label>
                <input
                  type="text"
                  placeholder="200,00"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 font-extrabold text-gray-900 text-xl"
                  required
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setWithdrawGoal(null)}
                  className="w-1/3 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 shadow-md shadow-purple-200 disabled:opacity-50"
                >
                  {submitting ? "Confirmando..." : "Confirmar Resgate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
