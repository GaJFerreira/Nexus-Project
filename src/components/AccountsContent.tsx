"use client";

import { fetchAccounts, updateAccountApi, deleteAccountApi } from "@/core/services/apiService";
import { Account } from "@/core/models";
import { Wallet, Plus, CreditCard, Landmark, PiggyBank, Banknote, ArrowLeft, Calendar, Clock, Pencil, Trash2, X, Building2, Receipt } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AccountsContent({ userId }: { userId: string }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State para Edição
  const [formNome, setFormNome] = useState("");
  const [formSaldo, setFormSaldo] = useState("");
  const [formTipo, setFormTipo] = useState<Account['tipo']>("bank");
  const [formPossuiCartao, setFormPossuiCartao] = useState(true);
  const [formFaturaAtual, setFormFaturaAtual] = useState("");
  const [formDiaFechamento, setFormDiaFechamento] = useState<number | "">("");
  const [formDiaVencimento, setFormDiaVencimento] = useState<number | "">("");
  const [formLimiteCredito, setFormLimiteCredito] = useState("");

  const loadData = async () => {
    try {
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setFormNome(acc.nome);
    setFormSaldo((acc.saldo / 100).toFixed(2).replace('.', ','));
    setFormTipo(acc.tipo);
    setFormPossuiCartao(Boolean(acc.possuiCartaoCredito || acc.tipo === 'credit_card'));
    setFormFaturaAtual(acc.faturaAtual ? (acc.faturaAtual / 100).toFixed(2).replace('.', ',') : "0,00");
    setFormDiaFechamento(acc.diaFechamento || "");
    setFormDiaVencimento(acc.diaVencimento || "");
    setFormLimiteCredito(acc.limiteCredito ? (acc.limiteCredito / 100).toFixed(2).replace('.', ',') : "");
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !editingAccount.id) return;

    if (!formNome.trim()) {
      alert("O nome da conta é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      const saldoInCents = Math.round(Number(formSaldo.replace(',', '.')) * 100);
      
      const payload: Partial<Account> = {
        nome: formNome,
        saldo: isNaN(saldoInCents) ? 0 : saldoInCents,
        tipo: formTipo,
        possuiCartaoCredito: formPossuiCartao,
      };

      if (formPossuiCartao || formTipo === 'credit_card') {
        const faturaInCents = Math.round(Number(formFaturaAtual.replace(',', '.')) * 100);
        payload.faturaAtual = isNaN(faturaInCents) ? 0 : faturaInCents;
        if (formDiaFechamento) payload.diaFechamento = Number(formDiaFechamento);
        if (formDiaVencimento) payload.diaVencimento = Number(formDiaVencimento);
        if (formLimiteCredito) {
          const limiteInCents = Math.round(Number(formLimiteCredito.replace(',', '.')) * 100);
          payload.limiteCredito = isNaN(limiteInCents) ? 0 : limiteInCents;
        }
      }

      await updateAccountApi(editingAccount.id, payload);
      await loadData();
      setEditingAccount(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao atualizar conta.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!editingAccount || !editingAccount.id) return;

    const confirmed = confirm(`Tem certeza que deseja excluir a conta "${editingAccount.nome}"? Todas as transações associadas também serão apagadas.`);
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteAccountApi(editingAccount.id);
      await loadData();
      setEditingAccount(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao excluir conta.");
    } finally {
      setSaving(false);
    }
  };

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
      case 'bank': return <Building2 className="w-6 h-6 text-purple-600" />;
      case 'checking': return <Landmark className="w-6 h-6 text-purple-600" />;
      case 'credit_card': return <CreditCard className="w-6 h-6 text-purple-600" />;
      case 'savings': return <PiggyBank className="w-6 h-6 text-purple-600" />;
      case 'investment': return <Banknote className="w-6 h-6 text-purple-600" />;
      case 'cash': return <Wallet className="w-6 h-6 text-purple-600" />;
      default: return <Building2 className="w-6 h-6 text-purple-600" />;
    }
  };

  const getLabelForType = (type: string) => {
      switch (type) {
        case 'bank': return 'Banco Completo';
        case 'checking': return 'Conta Corrente';
        case 'credit_card': return 'Cartão de Crédito';
        case 'savings': return 'Poupança';
        case 'investment': return 'Investimento';
        case 'cash': return 'Dinheiro';
        default: return type;
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Minhas Contas Bancárias</h1>
                <p className="text-gray-500">Gerencie saldos em conta corrente e cartões de crédito</p>
            </div>
          </div>
          
          <Link 
            href="/accounts/new" 
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-md shadow-purple-200"
          >
            <Plus className="w-4 h-4" />
            Nova Conta Bancária
          </Link>
        </div>

        {/* Grid de Contas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.length === 0 ? (
             <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>Nenhuma conta encontrada.</p>
                <Link href="/accounts/new" className="text-purple-600 hover:underline mt-2 inline-block">
                  Criar minha primeira conta
                </Link>
             </div>
          ) : (
            accounts.map((acc) => {
              const temCartao = Boolean(acc.possuiCartaoCredito || acc.tipo === 'credit_card');
              return (
                <div key={acc.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-3 bg-purple-50 rounded-2xl group-hover:bg-purple-100 transition-colors">
                        {getIconForType(acc.tipo)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                          {getLabelForType(acc.tipo)}
                        </span>
                        <button
                          onClick={() => handleOpenEditModal(acc)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Editar Banco e Cartão"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-extrabold text-gray-900 text-xl">{acc.nome}</h3>
                  </div>

                  {/* Bloco 1: Saldo Conta Corrente (PIX / Débito) */}
                  <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-purple-600" />
                        Conta Corrente (Débito/PIX)
                      </span>
                    </div>
                    <p className={`text-2xl font-bold ${acc.saldo < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatMoney(acc.saldo)}
                    </p>
                  </div>

                  {/* Bloco 2: Cartão de Crédito Integrado */}
                  {temCartao && (
                    <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-100 space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b border-purple-100 pb-2">
                        <span className="font-bold text-purple-900 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-purple-700" />
                          Cartão de Crédito
                        </span>
                        <span className="font-bold text-purple-700 bg-white px-2 py-0.5 rounded shadow-sm">
                          Fatura: {formatMoney(acc.faturaAtual || 0)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-gray-600">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-purple-600" /> Fecha:
                        </span>
                        <span className="font-bold text-gray-800">Dia {acc.diaFechamento || 'N/I'}</span>

                        <span className="flex items-center gap-1 font-medium ml-2">
                          <Clock className="w-3 h-3 text-red-500" /> Vence:
                        </span>
                        <span className="font-bold text-gray-800">Dia {acc.diaVencimento || 'N/I'}</span>
                      </div>

                      {acc.limiteCredito && (
                        <div className="flex justify-between items-center pt-1 border-t border-purple-100/60 text-purple-950 font-semibold">
                          <span>Limite Total:</span>
                          <span>{formatMoney(acc.limiteCredito)}</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Edição da Conta */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Editar Banco & Cartão</h2>
                <p className="text-xs text-gray-500">Atualize as informações da conta corrente e cartão de crédito</p>
              </div>
              <button 
                onClick={() => setEditingAccount(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Nome do Banco / Instituição</label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-semibold"
                  placeholder="Ex: Nubank, Itaú..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Saldo na Conta Corrente / Débito (R$)
                </label>
                <input
                  type="text"
                  value={formSaldo}
                  onChange={(e) => setFormSaldo(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-bold text-lg"
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Tipo de Instituição</label>
                <select
                  value={formTipo}
                  onChange={(e) => setFormTipo(e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-semibold bg-white"
                >
                  <option value="bank">Banco Completo</option>
                  <option value="checking">Conta Corrente</option>
                  <option value="credit_card">Só Cartão</option>
                  <option value="savings">Poupança</option>
                  <option value="investment">Investimento</option>
                  <option value="cash">Dinheiro</option>
                </select>
              </div>

              {/* Checkbox de Cartão Vinculado */}
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                <div>
                  <span className="font-bold text-xs text-purple-900">Possui Cartão de Crédito vinculado?</span>
                </div>
                <input
                  type="checkbox"
                  checked={formPossuiCartao}
                  onChange={(e) => setFormPossuiCartao(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {/* Se Possui Cartão de Crédito */}
              {(formPossuiCartao || formTipo === 'credit_card') && (
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 space-y-4">
                  <h4 className="font-bold text-purple-900 text-sm border-b border-purple-200 pb-2 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-purple-700" />
                    Configurações do Cartão de Crédito
                  </h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-purple-900 mb-1">Fatura Atual (R$)</label>
                    <input
                      type="text"
                      value={formFaturaAtual}
                      onChange={(e) => setFormFaturaAtual(e.target.value)}
                      className="w-full px-3 py-2 border border-purple-200 rounded-xl bg-white text-purple-950 font-bold"
                      placeholder="0,00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-purple-900 mb-1">Dia Fechamento Fatura</label>
                      <select
                        value={formDiaFechamento}
                        onChange={(e) => setFormDiaFechamento(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-purple-200 rounded-xl bg-white text-purple-950 font-bold"
                      >
                        <option value="">Selecione dia...</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>Dia {day}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-purple-900 mb-1">Dia Vencimento Fatura</label>
                      <select
                        value={formDiaVencimento}
                        onChange={(e) => setFormDiaVencimento(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-purple-200 rounded-xl bg-white text-purple-950 font-bold"
                      >
                        <option value="">Selecione dia...</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>Dia {day}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-purple-900 mb-1">Limite Total do Cartão (R$)</label>
                    <input
                      type="text"
                      value={formLimiteCredito}
                      onChange={(e) => setFormLimiteCredito(e.target.value)}
                      className="w-full px-3 py-2 border border-purple-200 rounded-xl bg-white text-purple-950 font-bold"
                      placeholder="Ex: 5000,00"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={saving}
                  className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors text-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors text-sm shadow-md shadow-purple-200 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



