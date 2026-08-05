import { getTransactions } from './transactionsservice';

export interface MonthSummary {
  month: number; // 1..12
  monthName: string;
  income: number;
  expense: number;
  netBalance: number;
}

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export async function getAnnualSummary(userId: string, year: number) {
  const monthsData: MonthSummary[] = [];

  for (let m = 1; m <= 12; m++) {
    const transactions = await getTransactions(userId, { month: m, year });

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    monthsData.push({
      month: m,
      monthName: MONTH_NAMES[m - 1],
      income,
      expense,
      netBalance: income - expense
    });
  }

  const totalAnnualIncome = monthsData.reduce((acc, m) => acc + m.income, 0);
  const totalAnnualExpense = monthsData.reduce((acc, m) => acc + m.expense, 0);
  const totalAnnualNet = totalAnnualIncome - totalAnnualExpense;

  let bestMonth = monthsData[0];
  let worstMonth = monthsData[0];

  monthsData.forEach(m => {
    if (m.netBalance > bestMonth.netBalance) bestMonth = m;
    if (m.expense > worstMonth.expense) worstMonth = m;
  });

  return {
    year,
    monthsData,
    totalAnnualIncome,
    totalAnnualExpense,
    totalAnnualNet,
    bestMonth,
    worstMonth
  };
}
