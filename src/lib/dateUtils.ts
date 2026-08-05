/**
 * Utilitários para Cálculo de Período de Fatura (Ciclo de Fechamento) e Mês Calendário
 */

export function getBillingCycleDates(month: number, year: number, closingDay: number = 27): { startDate: Date; endDate: Date; label: string } {
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
  const startDay = Math.min(closingDay + 1, daysInPrevMonth);

  const daysInCurrentMonth = new Date(year, month, 0).getDate();
  const endDay = Math.min(closingDay, daysInCurrentMonth);

  const startDate = new Date(prevYear, prevMonth - 1, startDay, 0, 0, 0, 0);
  const endDate = new Date(year, month - 1, endDay, 23, 59, 59, 999);

  const formatShort = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  const label = `${formatShort(startDate)} a ${formatShort(endDate)}`;

  return { startDate, endDate, label };
}

export function getCalendarMonthDates(month: number, year: number): { startDate: Date; endDate: Date; label: string } {
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month - 1, daysInMonth, 23, 59, 59, 999);
  const label = `01/${String(month).padStart(2, "0")} a ${String(daysInMonth).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
  return { startDate, endDate, label };
}
