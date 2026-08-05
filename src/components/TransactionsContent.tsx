"use client";

import { fetchAccounts, fetchTransactions, updateTransactionApi, deleteTransactionApi } from "@/core/services/apiService";
import { Account, Transaction } from "@/core/models";
import { Wallet, Plus, ArrowLeft, Search, Calendar, ChevronLeft, ChevronRight, Filter, Receipt, Layers, Pencil, Trash2, X, Tag, Repeat, Download, Printer, Info } from "lucide-react";
import { exportTransactionsToCSV, exportReportToPDF } from "@/lib/exportUtils";
import { getBillingCycleDates, getCalendarMonthDates } from "@/lib/dateUtils";
import Link from "next/link";
import { useEffect, useState } from "react";

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function TransactionsContent({ userId }: { userId: string }) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state para edição de transação
    const [formDescription, setFormDescription] = useState("");
    const [formAmount, setFormAmount] = useState("");
    const [formType, setFormType] = useState<'income' | 'expense'>("expense");
    const [formCategory, setFormCategory] = useState("");
    const [formAccountId, setFormAccountId] = useState("");
    const [formDate, setFormDate] = useState("");
    const [formPaymentMethod, setFormPaymentMethod] = useState("");

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
    const [selectedAccount, setSelectedAccount] = useState<string>("all");
    const [viewMode, setViewMode] = useState<'billing_cycle' | 'calendar'>('billing_cycle');

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

    const activeAccountObj = accounts.find(a => a.id === selectedAccount);
    const creditAccount = accounts.find(a => a.tipo === 'credit_card');
    const closingDay = activeAccountObj?.diaFechamento || creditAccount?.diaFechamento || 27;

    const billingCycleInfo = getBillingCycleDates(selectedMonth, selectedYear, closingDay);
    const calendarMonthInfo = getCalendarMonthDates(selectedMonth, selectedYear);

    const loadData = async () => {
        setLoading(true);
        try {
            const accs = await fetchAccounts();
            setAccounts(accs);

            const currActive = accs.find(a => a.id === selectedAccount);
            const currCredit = accs.find(a => a.tipo === 'credit_card');
            const cDay = currActive?.diaFechamento || currCredit?.diaFechamento || 27;

            let trans: Transaction[] = [];
            if (viewMode === 'billing_cycle') {
                const cycle = getBillingCycleDates(selectedMonth, selectedYear, cDay);
                trans = await fetchTransactions({
                    startDate: cycle.startDate,
                    endDate: cycle.endDate,
                    accountId: selectedAccount === "all" ? null : selectedAccount
                });
            } else {
                trans = await fetchTransactions({
                    month: selectedMonth,
                    year: selectedYear,
                    accountId: selectedAccount === "all" ? null : selectedAccount
                });
            }
            setTransactions(trans);
        } catch (error) {
            console.error("Erro ao carregar transações/fatura:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedMonth, selectedYear, selectedAccount, viewMode]);

    const handleOpenEditModal = (t: Transaction) => {
        setEditingTx(t);
        setFormDescription(t.description);
        setFormAmount((t.amount / 100).toFixed(2).replace('.', ','));
        setFormType(t.type);
        setFormCategory(t.category);
        setFormAccountId(t.accountId);
        setFormPaymentMethod(t.paymentMethod);

        let dateStr = "";
        if (typeof t.date === 'string') {
            dateStr = (t.date as string).split('T')[0];
        } else if (t.date instanceof Date) {
            dateStr = t.date.toISOString().split('T')[0];
        } else {
            dateStr = new Date(t.date).toISOString().split('T')[0];
        }
        setFormDate(dateStr);
    };

    const handleSaveTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTx || !editingTx.id) return;

        if (!formDescription.trim()) {
            alert("A descrição é obrigatória.");
            return;
        }

        const amountInCents = Math.round(Number(formAmount.replace(',', '.')) * 100);
        if (isNaN(amountInCents) || amountInCents <= 0) {
            alert("O valor deve ser maior que zero.");
            return;
        }

        setSaving(true);
        try {
            const payload: Partial<Transaction> = {
                description: formDescription,
                amount: amountInCents,
                type: formType,
                category: formCategory,
                accountId: formAccountId,
                paymentMethod: formPaymentMethod,
                date: formDate as any
            };

            await updateTransactionApi(editingTx.id, payload);
            await loadData();
            setEditingTx(null);
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Erro ao atualizar transação");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTransaction = async () => {
        if (!editingTx || !editingTx.id) return;

        const confirmed = confirm(`Tem certeza que deseja excluir o lançamento "${editingTx.description}"? Os valores em conta/fatura serão atualizados.`);
        if (!confirmed) return;

        setSaving(true);
        try {
            await deleteTransactionApi(editingTx.id);
            await loadData();
            setEditingTx(null);
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Erro ao excluir transação");
        } finally {
            setSaving(false);
        }
    };

    const currentMonthName = MONTH_NAMES[selectedMonth - 1];

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);
    };

    const formatDate = (dateInput: Date | string) => {
        let d: Date;
        if (typeof dateInput === 'string') {
            const dateStr = dateInput.split('T')[0];
            const parts = dateStr.split('-').map(Number);
            if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
                d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
            } else {
                d = new Date(dateInput);
            }
        } else if (dateInput instanceof Date) {
            d = new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 12, 0, 0);
        } else {
            d = new Date(dateInput);
        }
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
        });
    };

    const totalInvoiceExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const totalInvoiceIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

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
                            <h1 className="text-3xl font-bold text-gray-900">Extrato & Fatura do Mês</h1>
                            <p className="text-gray-500 font-medium">
                                Visualização de lançamentos em <span className="text-purple-700 font-bold">{currentMonthName} de {selectedYear}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => exportTransactionsToCSV(transactions, `extrato-${currentMonthName}-${selectedYear}.csv`)}
                            className="flex items-center gap-2 px-3.5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-bold shadow-sm"
                            title="Exportar para planilha CSV"
                        >
                            <Download className="w-4 h-4 text-green-600" />
                            CSV
                        </button>

                        <button
                            onClick={() => {
                                const inc = transactions.filter((t: Transaction) => t.type === 'income').reduce((a: number, t: Transaction) => a + t.amount, 0);
                                const exp = transactions.filter((t: Transaction) => t.type === 'expense').reduce((a: number, t: Transaction) => a + t.amount, 0);
                                exportReportToPDF('Extrato Mensal', `${currentMonthName} ${selectedYear}`, transactions, { income: inc, expense: exp, balance: inc - exp });
                            }}
                            className="flex items-center gap-2 px-3.5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-bold shadow-sm"
                            title="Imprimir ou baixar relatório PDF"
                        >
                            <Printer className="w-4 h-4 text-purple-600" />
                            PDF
                        </button>

                        <Link href='/transactions/new'
                            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium shadow-md shadow-purple-200">
                            <Plus className="w-4 h-4" />
                            Nova Transação
                        </Link>
                    </div>
                </div>

                {/* Seletor de Mês, Modo e Filtro por Conta */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                    
                    {/* Navegação de Mês */}
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 shadow-inner justify-between lg:justify-start">
                        <button 
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-white rounded-lg text-gray-700 transition-colors shadow-sm"
                            title="Mês Anterior"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="px-4 font-extrabold text-sm text-gray-900 min-w-[150px] text-center">
                            {currentMonthName} {selectedYear}
                        </span>
                        <button 
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-white rounded-lg text-gray-700 transition-colors shadow-sm"
                            title="Próximo Mês"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Alternador de Modo de Visualização */}
                    <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl gap-1 justify-center">
                        <button
                            onClick={() => setViewMode('billing_cycle')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                viewMode === 'billing_cycle'
                                    ? 'bg-white dark:bg-zinc-700 text-purple-700 dark:text-purple-300 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                            title="Filtrar pelo ciclo de fechamento da fatura do cartão"
                        >
                            <Receipt className="w-3.5 h-3.5" />
                            Ciclo da Fatura (Fechamento Dia {closingDay})
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                viewMode === 'calendar'
                                    ? 'bg-white dark:bg-zinc-700 text-purple-700 dark:text-purple-300 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                            title="Filtrar pelas compras ocorridas de 01 a 31 do mês"
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            Gastos no Mês (01-31)
                        </button>
                    </div>

                    {/* Filtro por Conta */}
                    <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-900 font-semibold text-sm rounded-xl p-2.5 focus:ring-purple-500 focus:border-purple-500 block w-full lg:w-auto"
                        >
                            <option value="all">Todas as Contas / Cartões</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.nome} ({acc.tipo.replace('_', ' ')})
                                </option>
                            ))}
                        </select>
                    </div>

                </div>

                {/* Card do Resumo da Fatura / Gastos */}
                <div className="bg-gradient-to-r from-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-purple-200">
                            {viewMode === 'billing_cycle' ? (
                                <>
                                    <Receipt className="w-3.5 h-3.5" /> Fatura de {currentMonthName} (Ciclo do Fechamento)
                                </>
                            ) : (
                                <>
                                    <Calendar className="w-3.5 h-3.5" /> Gastos de {currentMonthName} (Mês Civil)
                                </>
                            )}
                        </div>
                        <h2 className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-purple-300" />
                            {viewMode === 'billing_cycle'
                                ? `Período da fatura: ${billingCycleInfo.label} (Fechamento dia ${closingDay})`
                                : `Período civil: ${calendarMonthInfo.label}`}
                            {activeAccountObj ? ` • ${activeAccountObj.nome}` : ''}
                        </h2>
                        <p className="text-4xl font-extrabold text-white">
                            {formatMoney(totalInvoiceExpenses)}
                        </p>
                    </div>

                    <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
                        <div>
                            <span className="text-xs text-slate-400 font-medium block">Total de Entradas</span>
                            <span className="text-xl font-bold text-green-400">+{formatMoney(totalInvoiceIncome)}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 font-medium block">Lançamentos</span>
                            <span className="text-xl font-bold text-white">{transactions.length} itens</span>
                        </div>
                    </div>
                </div>

                {/* Extrato / Fatura Detalhada */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Nenhum lançamento na fatura de {currentMonthName}.</h3>
                            <p className="text-gray-500 text-sm mt-1">Altere o mês ou adicione uma nova transação.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {/* Cabeçalho da Tabela */}
                            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 font-bold text-xs text-gray-400 uppercase tracking-wider">
                                <div className="col-span-5">Lançamento / Categoria</div>
                                <div className="col-span-3">Data</div>
                                <div className="col-span-2 text-right">Valor</div>
                                <div className="col-span-2 text-center">Ações</div>
                            </div>

                            {transactions.map((t) => {
                                const accName = accounts.find(a => a.id === t.accountId)?.nome || 'Conta';
                                return (
                                    <div key={t.id} className="p-4 hover:bg-gray-50/80 transition-colors group">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

                                            {/* Descrição e Tags */}
                                            <div className="col-span-12 md:col-span-5 flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl ${t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                    {t.type === 'income' ? <Plus className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-gray-900">{t.description}</p>
                                                        {t.installmentTotal && t.installmentTotal > 1 && (
                                                            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-md">
                                                                <Layers className="w-3 h-3" />
                                                                {t.installmentCurrent}/{t.installmentTotal}
                                                            </span>
                                                        )}
                                                        {t.isRecurring && (
                                                            <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-md" title="Assinatura / Despesa Recorrente">
                                                                <Repeat className="w-3 h-3" />
                                                                Recorrente
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                                                        <span className="bg-gray-100 font-semibold px-2 py-0.5 rounded text-gray-700">{t.category}</span>
                                                        <span>•</span>
                                                        <span className="capitalize">{t.paymentMethod.replace('_', ' ')}</span>
                                                        <span>•</span>
                                                        <span className="font-medium text-purple-600">{accName}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Data */}
                                            <div className="col-span-6 md:col-span-3 flex md:justify-start items-center text-sm font-medium text-gray-500">
                                                <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                                                {formatDate(t.date)}
                                            </div>

                                            {/* Valor */}
                                            <div className={`col-span-6 md:col-span-2 flex justify-end font-extrabold text-lg ${t.type === 'income' ? 'text-green-600' : 'text-slate-900'}`}>
                                                {t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}
                                            </div>

                                            {/* Ações (Editar) */}
                                            <div className="col-span-12 md:col-span-2 flex justify-end md:justify-center items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                                                <button
                                                    onClick={() => handleOpenEditModal(t)}
                                                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
                                                    title="Editar Transação"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                    <span>Editar</span>
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* Modal de Edição de Transação */}
            {editingTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-gray-100">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Editar Transação</h2>
                                <p className="text-xs text-gray-500">Altere o valor, conta, categoria ou data do lançamento</p>
                            </div>
                            <button 
                                onClick={() => setEditingTx(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTransaction} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-semibold"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Valor (R$)</label>
                                    <input
                                        type="text"
                                        value={formAmount}
                                        onChange={(e) => setFormAmount(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-extrabold text-lg"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Tipo</label>
                                    <select
                                        value={formType}
                                        onChange={(e) => setFormType(e.target.value as any)}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-bold bg-white"
                                    >
                                        <option value="expense">Despesa (-)</option>
                                        <option value="income">Receita (+)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Categoria</label>
                                <select
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-semibold bg-white"
                                    required
                                >
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
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Conta Bancária / Cartão</label>
                                <select
                                    value={formAccountId}
                                    onChange={(e) => setFormAccountId(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-semibold bg-white"
                                    required
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.nome} ({acc.tipo.replace('_', ' ')})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Data do Lançamento</label>
                                    <input
                                        type="date"
                                        value={formDate}
                                        onChange={(e) => setFormDate(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-semibold"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Forma de Pagamento</label>
                                    <select
                                        value={formPaymentMethod}
                                        onChange={(e) => setFormPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-semibold bg-white"
                                        required
                                    >
                                        <option value="pix">PIX</option>
                                        <option value="debit">Débito à Vista</option>
                                        <option value="credit">Crédito à Vista</option>
                                        <option value="credit_parcelado">Crédito Parcelado</option>
                                        <option value="cash">Dinheiro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleDeleteTransaction}
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


