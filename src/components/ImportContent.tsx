"use client";

import { useEffect, useRef, useState } from "react";
import { fetchAccounts } from "@/core/services/apiService";
import { Account } from "@/core/models";
import { auth } from "@/lib/firebase/client";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  Tag,
  RefreshCw,
  ArrowLeft,
  Info,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedRow {
  id: string;
  date: string;        // YYYY-MM-DD
  description: string; // nome limpo (sem "- Parcela X/Y")
  rawTitle: string;    // título original do CSV
  amountCents: number; // valor em centavos
  amountDisplay: string; // ex: "R$ 197,58"
  category: string;
  isInstallment: boolean;
  installmentCurrent?: number;
  installmentTotal?: number;
  selected: boolean;
  isDuplicate: boolean;
  fileName: string;
}

type ImportStep = "upload" | "preview" | "done";

// ─── Category Detection ───────────────────────────────────────────────────────

const CATEGORY_RULES: { keywords: string[]; category: string }[] = [
  { keywords: ["spotify", "deezer", "apple music"], category: "Assinaturas" },
  { keywords: ["youtube", "google", "dl*google"], category: "Assinaturas" },
  { keywords: ["amazon prime", "amazonprimebr", "prime video"], category: "Assinaturas" },
  { keywords: ["netflix", "hbo", "disney", "paramount", "globoplay", "mubi"], category: "Assinaturas" },
  { keywords: ["playstation", "xbox", "steam", "nintendo"], category: "Assinaturas" },
  { keywords: ["ifood club", "iFood Club"], category: "Assinaturas" },
  { keywords: ["vivo", "claro", "tim", "oi ", "phone"], category: "Telefone" },
  { keywords: ["ifood", "iFood - NuPay", "rappi", "uber eats", "burger", "mcdonalds", "kfc"], category: "Alimentação" },
  { keywords: ["mercado", "carrefour", "extra", "pao de acucar", "atacadao", "walmart"], category: "Mercado" },
  { keywords: ["posto", "combustivel", "gasolina", "shell", "ipiranga", "br distribuidora"], category: "Combustível" },
  { keywords: ["fisio", "farmacia", "drogaria", "medico", "clinica", "hospital", "saude", "thorfisio", "aura"], category: "Saúde" },
  { keywords: ["amazon", "shopee", "mercadolivre", "aliexpress", "americanas", "magalu", "alipay"], category: "Compras Online" },
  { keywords: ["uber", "99", "cabify", "taxi"], category: "Transporte" },
  { keywords: ["curso", "udemy", "alura", "cursoemvideo", "escola", "faculdade"], category: "Educação" },
  { keywords: ["hotel", "airbnb", "booking", "passagem", "aerea", "viagem"], category: "Viagem" },
  { keywords: ["cinema", "teatro", "show", "ingresso"], category: "Lazer" },
  { keywords: ["iof"], category: "Taxas" },
];

function detectCategory(title: string): string {
  const lower = title.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return rule.category;
    }
  }
  return "Outros";
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

const SKIP_PATTERNS = [
  /^pagamento recebido$/i,
  /^iof de volta de/i,
  /^estorno de/i,
];

function shouldSkip(title: string): boolean {
  const clean = title.trim();
  return SKIP_PATTERNS.some((p) => p.test(clean));
}

function parseBrazilianAmount(raw: string): number {
  // "- 1.828,54" → -182854  |  "197,58" → 19758
  const negative = raw.trim().startsWith("-");
  const cleaned = raw.replace(/[^0-9,]/g, "").replace(",", ".");
  const value = parseFloat(cleaned);
  if (isNaN(value)) return 0;
  return Math.round((negative ? -value : value) * 100);
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function parseInstallment(title: string): {
  base: string;
  isInstallment: boolean;
  current?: number;
  total?: number;
} {
  const match = title.match(/^(.+?)\s*-\s*Parcela\s+(\d+)\/(\d+)$/i);
  if (match) {
    return {
      base: match[1].trim(),
      isInstallment: true,
      current: parseInt(match[2]),
      total: parseInt(match[3]),
    };
  }
  return { base: title, isInstallment: false };
}

function parseCSV(content: string, fileName: string): ParsedRow[] {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // skip header
  const rows: ParsedRow[] = [];
  let id = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Parse CSV respeitando aspas
    const fields = parseCSVLine(line);
    if (fields.length < 3) continue;

    const [dateRaw, titleRaw, amountRaw] = fields;
    const date = dateRaw.trim();
    const title = titleRaw.trim().replace(/""/g, '"');
    const amountCents = parseBrazilianAmount(amountRaw);

    if (!date || !title || amountCents === 0) continue;
    if (shouldSkip(title)) continue;
    // Skip negative amounts (IOF de volta, estornos já filtrados acima)
    if (amountCents < 0) continue;

    const { base, isInstallment, current, total } = parseInstallment(title);

    rows.push({
      id: `row_${id++}`,
      date,
      description: base,
      rawTitle: title,
      amountCents,
      amountDisplay: formatMoney(amountCents),
      category: detectCategory(base),
      isInstallment,
      installmentCurrent: current,
      installmentTotal: total,
      selected: true,
      isDuplicate: false,
      fileName,
    });
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Categories List ─────────────────────────────────────────────────────────

const ALL_CATEGORIES = [
  "Alimentação", "Assinaturas", "Combustível", "Compras Online",
  "Educação", "Lazer", "Mercado", "Outros", "Saúde",
  "Taxas", "Telefone", "Transporte", "Viagem",
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ImportContent() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [projectFuture, setProjectFuture] = useState(true);
  const [result, setResult] = useState<{ created: number; duplicates: number; projectedCount?: number } | null>(null);
  const [error, setError] = useState("");
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [showSkipped, setShowSkipped] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAccounts()
      .then((accs) => {
        setAccounts(accs);
        const creditCard = accs.find((a) => a.tipo === "credit_card");
        if (creditCard?.id) setSelectedAccountId(creditCard.id);
      })
      .catch(console.error);
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const allRows: ParsedRow[] = [];
    const names: string[] = [];
    let processed = 0;

    Array.from(files).forEach((file) => {
      names.push(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const parsed = parseCSV(content, file.name);
        allRows.push(...parsed);
        processed++;
        if (processed === files.length) {
          // Sort by date desc
          allRows.sort((a, b) => b.date.localeCompare(a.date));
          setRows(allRows);
          setFileNames(names);
          setStep("preview");
        }
      };
      reader.readAsText(file, "UTF-8");
    });
  };

  const toggleRow = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const setRowCategory = (id: string, cat: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, category: cat } : r))
    );
  };

  const selectAll = () => setRows((p) => p.map((r) => ({ ...r, selected: true })));
  const deselectAll = () => setRows((p) => p.map((r) => ({ ...r, selected: false })));

  const visibleRows = rows.filter((r) => {
    if (!showSkipped && !r.selected) return false;
    if (filterCategory !== "Todas" && r.category !== filterCategory) return false;
    return true;
  });

  const selectedCount = rows.filter((r) => r.selected).length;
  const totalValue = rows.filter((r) => r.selected).reduce((s, r) => s + r.amountCents, 0);

  const handleImport = async () => {
    if (!selectedAccountId) {
      setError("Selecione uma conta de crédito.");
      return;
    }
    setImporting(true);
    setError("");

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Não autenticado");

      const payload = rows
        .filter((r) => r.selected)
        .map((r) => ({
          description: r.description,
          amount: r.amountCents,
          date: r.date,
          category: r.category,
          accountId: selectedAccountId,
          paymentMethod: "credit_card",
          isInstallment: r.isInstallment,
          installmentCurrent: r.installmentCurrent,
          installmentTotal: r.installmentTotal,
        }));

      const res = await fetch("/api/transactions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          transactions: payload,
          projectFutureInstallments: projectFuture,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao importar");
      setResult(data);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
    } finally {
      setImporting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (step === "done" && result) {
    return (
      <div style={{ minHeight: "calc(100vh - 58px)", backgroundColor: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
        <div className="card" style={{ maxWidth: 480, width: "100%", padding: "2.5rem", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--success-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <CheckCircle2 size={32} style={{ color: "var(--success)" }} />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 0.5rem" }}>
            Importação concluída!
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 2rem", fontSize: "0.9375rem" }}>
            Seus dados foram importados com sucesso.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: result.projectedCount ? "1fr 1fr 1fr" : "1fr 1fr", gap: "0.75rem", marginBottom: "2rem" }}>
            <div style={{ padding: "1rem", borderRadius: 12, background: "var(--success-bg)", border: "1px solid var(--success-muted)" }}>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--success)", margin: 0 }}>{result.created}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--success)", margin: 0, fontWeight: 600 }}>Criadas</p>
            </div>
            {Boolean(result.projectedCount) && (
              <div style={{ padding: "1rem", borderRadius: 12, background: "var(--accent-subtle)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent)", margin: 0 }}>{result.projectedCount}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--accent)", margin: 0, fontWeight: 600 }}>Parcelas projetadas</p>
              </div>
            )}
            <div style={{ padding: "1rem", borderRadius: 12, background: "var(--warning-bg)", border: "1px solid var(--warning-muted)" }}>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--warning)", margin: 0 }}>{result.duplicates}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--warning)", margin: 0, fontWeight: 600 }}>Duplicatas ignoradas</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => { setStep("upload"); setRows([]); setResult(null); setFileNames([]); }}
              className="btn-secondary"
              style={{ flex: 1, justifyContent: "center", padding: "0.75rem" }}
            >
              Nova importação
            </button>
            <Link href="/transactions" className="btn-primary" style={{ flex: 1, justifyContent: "center", padding: "0.75rem", textDecoration: "none" }}>
              Ver transações
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div style={{ minHeight: "calc(100vh - 58px)", backgroundColor: "var(--bg-base)", padding: "2rem 1.25rem 4rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.75rem" }}>
            <div>
              <button
                onClick={() => { setStep("upload"); setRows([]); setFileNames([]); }}
                style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8125rem", marginBottom: "0.5rem", padding: 0 }}
              >
                <ArrowLeft size={14} /> Voltar
              </button>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 0.25rem" }}>
                Revisar Importação
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: 0 }}>
                {fileNames.join(", ")} — {rows.length} lançamentos encontrados
              </p>
            </div>

            {/* Resumo + Conta */}
            <div className="card" style={{ padding: "1rem 1.25rem", display: "flex", flexWrap: "wrap", gap: "1.25rem", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.2rem" }}>
                  Selecionadas
                </p>
                <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  {selectedCount} <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>de {rows.length}</span>
                </p>
              </div>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.2rem" }}>
                  Total
                </p>
                <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--danger)", margin: 0 }}>
                  {formatMoney(totalValue)}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Conta de Crédito
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="input-field"
                  style={{ fontSize: "0.875rem", minWidth: 180 }}
                >
                  <option value="">Selecionar conta...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Info de conta não selecionada */}
          {!selectedAccountId && (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", padding: "0.75rem 1rem", borderRadius: 10, background: "var(--warning-bg)", border: "1px solid var(--warning-muted)", marginBottom: "1rem" }}>
              <Info size={15} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--warning)" }}>
                Selecione uma conta de crédito para continuar.{" "}
                {accounts.filter((a) => a.tipo === "credit_card").length === 0 && (
                  <Link href="/accounts/new" style={{ color: "var(--warning)", fontWeight: 700 }}>Criar conta de crédito →</Link>
                )}
              </p>
            </div>
          )}

          {/* Filtros e Opção de Projetar Parcelas */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", alignItems: "center", marginBottom: "1rem" }}>
            <button onClick={selectAll} className="btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.4rem 0.875rem" }}>
              Selecionar todas
            </button>
            <button onClick={deselectAll} className="btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.4rem 0.875rem" }}>
              Desmarcar todas
            </button>
            <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 0.25rem" }} />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field"
              style={{ fontSize: "0.8125rem", width: "auto", padding: "0.35rem 0.75rem" }}
            >
              <option value="Todas">Todas as categorias</option>
              {ALL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--text-secondary)", cursor: "pointer" }}>
              <input type="checkbox" checked={showSkipped} onChange={(e) => setShowSkipped(e.target.checked)} />
              Mostrar desmarcadas
            </label>

            <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 0.25rem" }} />

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8125rem",
                color: "var(--accent)",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: "var(--accent-subtle)",
                padding: "0.35rem 0.75rem",
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            >
              <input
                type="checkbox"
                checked={projectFuture}
                onChange={(e) => setProjectFuture(e.target.checked)}
                style={{ accentColor: "var(--accent)", width: 15, height: 15, cursor: "pointer" }}
              />
              <span>🔄 Projetar parcelas futuras automaticamente</span>
            </label>

            <span style={{ marginLeft: "auto", fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
              {visibleRows.length} exibidas
            </span>
          </div>

          {/* Tabela */}
          <div className="card" style={{ overflow: "hidden", marginBottom: "1.5rem" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["", "Data", "Descrição", "Categoria", "Valor", ""].map((h, i) => (
                      <th key={i} style={{ padding: "0.75rem 1rem", textAlign: i >= 3 ? "right" : "left", fontWeight: 600, color: "var(--text-tertiary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        opacity: row.selected ? 1 : 0.45,
                        backgroundColor: row.isDuplicate ? "var(--warning-bg)" : "transparent",
                        transition: "opacity 150ms",
                      }}
                    >
                      <td style={{ padding: "0.625rem 0.75rem 0.625rem 1rem", width: 40 }}>
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => toggleRow(row.id)}
                          style={{ cursor: "pointer", accentColor: "var(--accent)", width: 15, height: 15 }}
                        />
                      </td>
                      <td style={{ padding: "0.625rem 1rem", whiteSpace: "nowrap", color: "var(--text-secondary)" }}>
                        {row.date.split("-").reverse().join("/")}
                      </td>
                      <td style={{ padding: "0.625rem 1rem", maxWidth: 280 }}>
                        <p style={{ margin: 0, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.description}
                        </p>
                        {row.isInstallment && (
                          <span style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 600 }}>
                            🔄 Parcela {row.installmentCurrent}/{row.installmentTotal}
                          </span>
                        )}
                        <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-tertiary)" }}>{row.fileName}</p>
                      </td>
                      <td style={{ padding: "0.625rem 1rem" }}>
                        <CategorySelect
                          value={row.category}
                          onChange={(cat) => setRowCategory(row.id, cat)}
                        />
                      </td>
                      <td style={{ padding: "0.625rem 1rem", textAlign: "right", fontWeight: 700, color: "var(--danger)", whiteSpace: "nowrap" }}>
                        {row.amountDisplay}
                      </td>
                      <td style={{ padding: "0.625rem 1rem 0.625rem 0.75rem", textAlign: "right" }}>
                        <button
                          onClick={() => toggleRow(row.id)}
                          title={row.selected ? "Remover da importação" : "Incluir na importação"}
                          style={{ border: "none", background: "transparent", cursor: "pointer", color: row.selected ? "var(--danger)" : "var(--success)", display: "flex", alignItems: "center" }}
                        >
                          {row.selected ? <X size={14} /> : <CheckCircle2 size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", padding: "0.75rem 1rem", borderRadius: 10, background: "var(--danger-bg)", border: "1px solid var(--danger-muted)", marginBottom: "1rem" }}>
              <AlertCircle size={15} style={{ color: "var(--danger)", flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--danger)" }}>{error}</p>
            </div>
          )}

          {/* Botão importar */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleImport}
              disabled={importing || selectedCount === 0 || !selectedAccountId}
              className="btn-primary"
              style={{
                padding: "0.8rem 2rem",
                fontSize: "0.9375rem",
                opacity: (importing || selectedCount === 0 || !selectedAccountId) ? 0.6 : 1,
                cursor: (importing || selectedCount === 0 || !selectedAccountId) ? "not-allowed" : "pointer",
              }}
            >
              {importing ? (
                <><Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> Importando...</>
              ) : (
                <>Importar {selectedCount} transações</>
              )}
            </button>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Upload step
  return (
    <div style={{ minHeight: "calc(100vh - 58px)", backgroundColor: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
      <div style={{ maxWidth: 600, width: "100%" }}>
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 0.5rem" }}>
            Importar Fatura Nubank
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", margin: 0 }}>
            Selecione um ou mais arquivos CSV exportados pelo Nubank para importar seus lançamentos automaticamente.
          </p>
        </div>

        {/* Drop zone */}
        <div
          className="card"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          style={{
            padding: "3rem 2rem",
            textAlign: "center",
            cursor: "pointer",
            border: "2px dashed var(--border-strong)",
            transition: "border-color 150ms, background 150ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLElement).style.background = "var(--accent-subtle)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
            (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
          }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <Upload size={24} style={{ color: "var(--accent)" }} />
          </div>
          <p style={{ fontWeight: 700, fontSize: "1rem", margin: "0 0 0.375rem", color: "var(--text-primary)" }}>
            Clique para selecionar ou arraste o CSV aqui
          </p>
          <p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem", margin: 0 }}>
            Suporte para múltiplos arquivos ao mesmo tempo
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            multiple
            style={{ display: "none" }}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Instructions */}
        <div className="card" style={{ marginTop: "1.25rem", padding: "1.25rem" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Info size={14} style={{ color: "var(--accent)" }} /> Como exportar o CSV do Nubank
          </p>
          <ol style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {[
              'Abra o app Nubank e vá em "Cartão de Crédito"',
              'Toque na fatura desejada e role até o final',
              'Toque em "Exportar fatura" → "Exportar como CSV"',
              "Repita para cada mês desejado e importe todos de uma vez aqui",
            ].map((step, i) => (
              <li key={i} style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* O que é processado */}
        <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div style={{ padding: "1rem", borderRadius: 12, background: "var(--success-bg)", border: "1px solid var(--success-muted)" }}>
            <p style={{ margin: "0 0 0.5rem", fontWeight: 700, fontSize: "0.8125rem", color: "var(--success)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <CheckCircle2 size={14} /> Incluído
            </p>
            <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.8rem", color: "var(--success)", lineHeight: 1.8 }}>
              <li>Compras e lançamentos</li>
              <li>IOF (taxas internacionais)</li>
              <li>Parcelas individuais</li>
            </ul>
          </div>
          <div style={{ padding: "1rem", borderRadius: 12, background: "var(--danger-bg)", border: "1px solid var(--danger-muted)" }}>
            <p style={{ margin: "0 0 0.5rem", fontWeight: 700, fontSize: "0.8125rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <XCircle size={14} /> Ignorado
            </p>
            <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.8rem", color: "var(--danger)", lineHeight: 1.8 }}>
              <li>Pagamentos da fatura</li>
              <li>IOF de volta (estorno)</li>
              <li>Valores negativos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CategorySelect (inline dropdown) ────────────────────────────────────────

function CategorySelect({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          display: "flex", alignItems: "center", gap: "0.375rem",
          padding: "0.25rem 0.5rem", borderRadius: 6,
          border: "1px solid var(--border)", background: "var(--accent-subtle)",
          color: "var(--accent)", fontSize: "0.75rem", fontWeight: 600,
          cursor: "pointer", whiteSpace: "nowrap",
        }}
      >
        <Tag size={11} />
        {value}
        <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 30 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 40,
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: 10, boxShadow: "var(--shadow-lg)", padding: "0.375rem",
            minWidth: 160, maxHeight: 220, overflowY: "auto",
          }}>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { onChange(cat); setOpen(false); }}
                style={{
                  width: "100%", textAlign: "left", padding: "0.4rem 0.625rem",
                  borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.8125rem",
                  fontWeight: cat === value ? 700 : 400,
                  background: cat === value ? "var(--accent-subtle)" : "transparent",
                  color: cat === value ? "var(--accent)" : "var(--text-primary)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
