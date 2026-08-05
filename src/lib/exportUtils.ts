import { Transaction } from "@/core/models";

const formatMoney = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);
};

const formatDate = (dateInput: any) => {
  if (!dateInput) return '';
  let d: Date;
  if (dateInput instanceof Date) {
    d = dateInput;
  } else if (typeof dateInput === 'string') {
    const parts = dateInput.split('T')[0].split('-').map(Number);
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

export function exportTransactionsToCSV(transactions: Transaction[], filename: string = 'extrato-nexus.csv') {
  const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Forma de Pagamento', 'Valor (R$)'];

  const rows = transactions.map(t => [
    formatDate(t.date),
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    t.type === 'income' ? 'Entrada' : 'Saída',
    `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
    (t.amount / 100).toFixed(2).replace('.', ',')
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportReportToPDF(title: string, monthYear: string, transactions: Transaction[], summary: { income: number; expense: number; balance: number }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Por favor, permita popups no navegador para visualizar o PDF.");
    return;
  }

  const rowsHtml = transactions.map(t => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 8px; font-size: 12px; color: #374151;">${formatDate(t.date)}</td>
      <td style="padding: 8px; font-size: 12px; font-weight: 600; color: #111827;">${t.description}</td>
      <td style="padding: 8px; font-size: 12px; color: #4b5563;">${t.category}</td>
      <td style="padding: 8px; font-size: 12px; color: #6b7280; text-transform: uppercase;">${t.paymentMethod}</td>
      <td style="padding: 8px; font-size: 12px; font-weight: 700; text-align: right; color: ${t.type === 'income' ? '#059669' : '#dc2626'};">
        ${t.type === 'income' ? '+' : '-'}${formatMoney(t.amount)}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${title} - ${monthYear}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #111827; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: 900; color: #7c3aed; }
        .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
        .kpi-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 15px; }
        .kpi-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #6b7280; margin-bottom: 5px; }
        .kpi-value { font-size: 20px; font-weight: 800; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f3f4f6; text-align: left; padding: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4b5563; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">Nexus Finance</div>
          <div style="font-size: 13px; color: #6b7280;">Relatório Oficial de Lançamentos</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 16px; font-weight: 800; color: #111827;">${monthYear}</div>
          <div style="font-size: 11px; color: #9ca3af;">Emitido em ${new Date().toLocaleDateString('pt-BR')}</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">Total de Entradas</div>
          <div class="kpi-value" style="color: #059669;">${formatMoney(summary.income)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Total de Saídas</div>
          <div class="kpi-value" style="color: #dc2626;">${formatMoney(summary.expense)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Balanço Líquido</div>
          <div class="kpi-value" style="color: ${summary.balance >= 0 ? '#059669' : '#dc2626'};">
            ${summary.balance >= 0 ? '+' : ''}${formatMoney(summary.balance)}
          </div>
        </div>
      </div>

      <h3 style="font-size: 14px; font-weight: 800; margin-bottom: 10px;">Detalhamento de Transações</h3>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Pagamento</th>
            <th style="text-align: right;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
