"use client";

import { useAuth } from "@/core/contexts/AuthContext";
import {
  Layers,
  CheckCircle,
  PieChart,
  Shield,
  ArrowRight,
  Wallet,
  Plus,
  CreditCard,
  ArrowUpRight,
  LayoutDashboard,
  ArrowDownCircle,
  TrendingUp,
  Target,
  Repeat,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAccounts, fetchTransactions } from "@/core/services/apiService";
import { Account, Transaction } from "@/core/models";

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const FEATURES = [
  {
    icon: CheckCircle,
    title: "Controle de Gastos",
    description: "Registre despesas e receitas em segundos. Saiba exatamente para onde seu dinheiro vai.",
  },
  {
    icon: PieChart,
    title: "Relatórios Visuais",
    description: "Gráficos intuitivos e relatórios mensais detalhados para visualizar sua saúde financeira.",
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Seus dados protegidos com criptografia e autenticação segura via Firebase.",
  },
  {
    icon: Repeat,
    title: "Recorrências",
    description: "Gerencie assinaturas e pagamentos recorrentes com visibilidade nas faturas futuras.",
  },
  {
    icon: Target,
    title: "Metas & Caixinhas",
    description: "Defina objetivos financeiros e acompanhe seu progresso de poupança.",
  },
  {
    icon: TrendingUp,
    title: "Planejamento",
    description: "Previsões de entradas e saídas para fechar o mês sempre no positivo.",
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentMonthName = MONTH_NAMES[currentMonth - 1];

  useEffect(() => {
    async function loadHomeData() {
      if (user) {
        try {
          const [accs, trans] = await Promise.all([
            fetchAccounts(),
            fetchTransactions({ month: currentMonth, year: currentYear }),
          ]);
          setAccounts(accs);
          setMonthTransactions(trans);
        } catch (err) {
          console.error("Erro ao carregar dados da home:", err);
        } finally {
          setDataLoading(false);
        }
      }
    }
    loadHomeData();
  }, [user, currentMonth, currentYear]);

  if (loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 58px)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-base)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2.5px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val / 100);

  // ─── Vista logada ────────────────────────────────────────────────────────────
  if (user) {
    const totalBalance = accounts.reduce((acc, curr) => acc + curr.saldo, 0);
    const monthIncome = monthTransactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
    const monthExpenses = monthTransactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);

    const summaryCards = [
      {
        label: "Saldo Total",
        value: formatMoney(totalBalance),
        icon: Wallet,
        color: "var(--accent)",
        colorBg: "var(--accent-subtle)",
        valueColor: totalBalance >= 0 ? "var(--text-primary)" : "var(--danger)",
      },
      {
        label: `Entradas — ${currentMonthName}`,
        value: formatMoney(monthIncome),
        icon: ArrowUpRight,
        color: "var(--success)",
        colorBg: "var(--success-bg)",
        valueColor: "var(--success)",
      },
      {
        label: `Gastos — ${currentMonthName}`,
        value: formatMoney(monthExpenses),
        icon: ArrowDownCircle,
        color: "var(--danger)",
        colorBg: "var(--danger-bg)",
        valueColor: "var(--danger)",
      },
    ];

    return (
      <div
        style={{
          minHeight: "calc(100vh - 58px)",
          backgroundColor: "var(--bg-base)",
          padding: "2rem 1.25rem 3rem",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.75rem" }}>

          {/* Banner de boas-vindas */}
          <div
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, #3730A3 100%)",
              borderRadius: 20,
              padding: "2rem 2.25rem",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1.25rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decoração */}
            <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ position: "absolute", bottom: -30, left: 200, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

            <div style={{ position: "relative" }}>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.375rem" }}>
                {currentMonthName} {currentYear}
              </p>
              <h1 style={{ color: "white", fontSize: "clamp(1.4rem, 3vw, 1.875rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
                Olá, {user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "Usuário"}! 👋
              </h1>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", margin: "0.375rem 0 0" }}>
                Acompanhe o resumo das suas finanças
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", position: "relative" }}>
              <Link
                href="/transactions/new"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.6rem 1.1rem",
                  borderRadius: 10,
                  background: "white",
                  color: "var(--accent)",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "opacity 150ms",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                <Plus size={15} /> Nova Transação
              </Link>
              <Link
                href="/dashboard"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.6rem 1.1rem",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <LayoutDashboard size={15} /> Dashboard
              </Link>
            </div>
          </div>

          {/* Cards de resumo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="card"
                  style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.5rem" }}>
                      {card.label}
                    </p>
                    <p style={{ fontSize: "1.625rem", fontWeight: 800, color: card.valueColor, margin: 0, letterSpacing: "-0.03em" }}>
                      {dataLoading ? (
                        <span style={{ display: "inline-block", width: 100, height: 28, borderRadius: 6, background: "var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />
                      ) : card.value}
                    </p>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: card.colorBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} style={{ color: card.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contas */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.2rem", letterSpacing: "-0.02em" }}>
                  Suas Contas
                </h2>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>
                  Saldos gerenciados
                </p>
              </div>
              <Link
                href="/accounts"
                style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}
              >
                Ver todas <ArrowRight size={14} />
              </Link>
            </div>

            {dataLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem 0" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
              </div>
            ) : accounts.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2.5rem 1rem",
                  borderRadius: 12,
                  border: "1px dashed var(--border-strong)",
                  background: "var(--bg-elevated)",
                }}
              >
                <Wallet size={32} style={{ color: "var(--text-tertiary)", margin: "0 auto 0.75rem" }} />
                <p style={{ color: "var(--text-secondary)", fontWeight: 500, margin: "0 0 0.5rem" }}>
                  Nenhuma conta cadastrada
                </p>
                <Link
                  href="/accounts/new"
                  style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none" }}
                >
                  Cadastrar primeira conta
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
                {accounts.map((acc) => (
                  <Link
                    key={acc.id}
                    href="/accounts"
                    style={{
                      display: "block",
                      padding: "1rem 1.125rem",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--bg-elevated)",
                      textDecoration: "none",
                      transition: "all 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px var(--accent-subtle)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", margin: "0 0 0.25rem" }}>
                          {acc.nome}
                        </p>
                        <span
                          className="badge badge-accent"
                          style={{ fontSize: "0.6875rem" }}
                        >
                          {acc.tipo.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CreditCard size={14} style={{ color: "var(--accent)" }} />
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", margin: "0 0 0.125rem", fontWeight: 500 }}>
                        {acc.tipo === "credit_card" ? "Limite" : "Saldo"}
                      </p>
                      <p style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
                        {formatMoney(acc.saldo)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
      </div>
    );
  }

  // ─── Landing (deslogado) ─────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: "var(--bg-base)" }}>

      {/* Hero */}
      <section style={{ padding: "5rem 1.25rem 4rem", position: "relative", overflow: "hidden" }}>
        {/* Blob decorativo */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, var(--accent-subtle) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto", gap: "4rem", alignItems: "center" }}>
          <div style={{ maxWidth: 580 }}>
            <div
              className="badge badge-accent"
              style={{ marginBottom: "1.25rem", display: "inline-flex" }}
            >
              ✦ Controle financeiro inteligente
            </div>
            <h1
              style={{
                fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.08,
                color: "var(--text-primary)",
                margin: "0 0 1.25rem",
              }}
            >
              Domine suas finanças com o{" "}
              <span style={{ color: "var(--accent)" }}>Nexus</span>
            </h1>
            <p
              style={{
                fontSize: "1.125rem",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                margin: "0 0 2.25rem",
                maxWidth: 480,
              }}
            >
              A maneira mais inteligente de gerenciar seu dinheiro. Acompanhe gastos, planeje metas e alcance a liberdade financeira.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <Link
                href="/register"
                className="btn-primary"
                style={{ padding: "0.875rem 1.75rem", fontSize: "0.9375rem", textDecoration: "none" }}
              >
                Começar gratuitamente <ArrowRight size={18} />
              </Link>
              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.875rem 1.75rem",
                  borderRadius: 10,
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 150ms ease",
                }}
              >
                Fazer login
              </Link>
            </div>
          </div>

          {/* Mock card — visível em desktop */}
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                width: 280,
                padding: "1.5rem",
                borderRadius: 20,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)" }} />
                <div>
                  <div style={{ width: 80, height: 10, borderRadius: 4, background: "var(--border-strong)", marginBottom: 5 }} />
                  <div style={{ width: 52, height: 8, borderRadius: 4, background: "var(--border)" }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.25rem" }}>
                {[
                  { label: "Saldo", amount: "R$ 4.820,00", color: "var(--text-primary)" },
                  { label: "Entradas", amount: "+ R$ 5.200,00", color: "var(--success)" },
                  { label: "Gastos", amount: "- R$ 1.380,00", color: "var(--danger)" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0.75rem", borderRadius: 8, background: "var(--bg-elevated)" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>{row.label}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: row.color }}>{row.amount}</span>
                  </div>
                ))}
              </div>
              {/* Barra gráfica mini */}
              <div style={{ display: "flex", gap: "0.25rem", alignItems: "flex-end", height: 56, background: "var(--bg-elevated)", borderRadius: 8, padding: "0.5rem" }}>
                {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 3, background: i === 5 ? "var(--accent)" : "var(--accent-muted)", opacity: i === 5 ? 1 : 0.5 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "4rem 1.25rem", backgroundColor: "var(--bg-surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 0.75rem" }}>
              Tudo que você precisa
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.0625rem", margin: 0, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
              Ferramentas poderosas para você ter controle total sobre cada centavo.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="card"
                style={{ padding: "1.5rem" }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  <Icon size={18} style={{ color: "var(--accent)" }} />
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>{title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.65 }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "4rem 1.25rem 5rem" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 1rem" }}>
            Pronto para começar?
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", margin: "0 0 2rem" }}>
            Crie sua conta gratuitamente e tenha controle total das suas finanças.
          </p>
          <Link
            href="/register"
            className="btn-primary"
            style={{ padding: "0.9rem 2rem", fontSize: "0.9375rem", textDecoration: "none", display: "inline-flex" }}
          >
            Criar conta grátis <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "1.5rem 1.25rem", backgroundColor: "var(--bg-surface)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={14} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Nexus</span>
          </div>
          <p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", margin: 0 }}>
            © {currentYear} Nexus Financial. Todos os direitos reservados.
          </p>
          <div style={{ display: "flex", gap: "1.25rem" }}>
            {["Termos", "Privacidade"].map((l) => (
              <span key={l} style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", cursor: "pointer", transition: "color 150ms" }}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
