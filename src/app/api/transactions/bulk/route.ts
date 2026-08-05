import { NextResponse } from "next/server";
import { initializeAdminApp } from "@/lib/firebase/admin";
import { auth as adminAuth } from "firebase-admin";
import admin from "firebase-admin";

async function getUserIdFromRequest(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const idToken = authHeader.split("Bearer ")[1];
  try {
    initializeAdminApp();
    const decoded = await adminAuth().verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}

interface BulkTransactionItem {
  description: string;
  amount: number; // em centavos
  date: string;   // YYYY-MM-DD
  category: string;
  accountId: string;
  paymentMethod: string;
  isInstallment?: boolean;
  installmentCurrent?: number;
  installmentTotal?: number;
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const items: BulkTransactionItem[] = body.transactions;
    const projectFutureInstallments = Boolean(body.projectFutureInstallments);

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "Nenhuma transação enviada" }, { status: 400 });
    }

    initializeAdminApp();
    const db = admin.firestore();

    // Buscar dados da conta para obter o dia de fechamento
    let closingDay = 27;
    if (items.length > 0 && items[0].accountId) {
      const accDoc = await db.collection("accounts").doc(items[0].accountId).get();
      if (accDoc.exists && accDoc.data()?.diaFechamento) {
        closingDay = accDoc.data()?.diaFechamento;
      }
    }

    // Buscar transações existentes para detecção de duplicatas
    const existingSnap = await db
      .collection("transactions")
      .where("userId", "==", userId)
      .get();

    // Índice de transações existentes: chave -> docRef
    const existingMap = new Map<string, admin.firestore.DocumentReference>();
    existingSnap.docs.forEach((doc) => {
      const d = doc.data();
      let dateStr = "";
      if (d.date?.toDate) {
        const dt = d.date.toDate();
        dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      }
      const key = makeKey(dateStr, d.description, d.amount, d.installmentCurrent);
      existingMap.set(key, doc.ref);
    });

    const batch = db.batch();
    let created = 0;
    let updated = 0;
    let duplicates = 0;
    let projectedCount = 0;
    const duplicateDescriptions: string[] = [];

    for (const item of items) {
      if (!item.description || !item.amount || !item.date || !item.accountId) continue;

      const key = makeKey(item.date, item.description, item.amount, item.installmentCurrent);
      const parts = item.date.split("-").map(Number);
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);

      // Se a transação já existir (ex: foi projetada anteriormente com data estimada)
      if (existingMap.has(key)) {
        const existingRef = existingMap.get(key)!;
        // Atualiza com a data e dados EXATOS vindos do CSV real da fatura
        batch.update(existingRef, {
          date: admin.firestore.Timestamp.fromDate(dateObj),
          projectedFromCSV: false,
          category: item.category || "Outros",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        updated++;
        duplicates++;
        continue;
      }

      const ref = db.collection("transactions").doc();
      const data: Record<string, unknown> = {
        userId,
        accountId: item.accountId,
        description: item.description,
        amount: item.amount,
        type: "expense",
        category: item.category || "Outros",
        paymentMethod: item.paymentMethod || "credit_card",
        date: admin.firestore.Timestamp.fromDate(dateObj),
        importedFromCSV: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (item.isInstallment) {
        data.isInstallment = true;
        data.installmentCurrent = item.installmentCurrent;
        data.installmentTotal = item.installmentTotal;
      }

      batch.set(ref, data);
      existingMap.set(key, ref);
      created++;

      // Projetar parcelas futuras automaticamente no dia de fechamento da fatura
      if (
        projectFutureInstallments &&
        item.isInstallment &&
        item.installmentCurrent &&
        item.installmentTotal &&
        item.installmentCurrent < item.installmentTotal
      ) {
        const startCurrent = item.installmentCurrent;
        const total = item.installmentTotal;

        for (let k = startCurrent + 1; k <= total; k++) {
          const monthsOffset = k - startCurrent;
          // Para faturas de cartão de crédito, compras parceladas entram no dia de fechamento da fatura seguinte
          const futureDate = safeAddMonthsClosing(parts[0], parts[1], closingDay, monthsOffset);
          const futureDateStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}-${String(futureDate.getDate()).padStart(2, "0")}`;
          const futureKey = makeKey(futureDateStr, item.description, item.amount, k);

          if (existingMap.has(futureKey)) continue;

          const futureRef = db.collection("transactions").doc();
          const futureData: Record<string, unknown> = {
            userId,
            accountId: item.accountId,
            description: item.description,
            amount: item.amount,
            type: "expense",
            category: item.category || "Outros",
            paymentMethod: item.paymentMethod || "credit_card",
            date: admin.firestore.Timestamp.fromDate(futureDate),
            isInstallment: true,
            installmentCurrent: k,
            installmentTotal: total,
            installmentParentId: ref.id,
            importedFromCSV: true,
            projectedFromCSV: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          batch.set(futureRef, futureData);
          existingMap.set(futureKey, futureRef);
          created++;
          projectedCount++;
        }
      }
    }

    await batch.commit();

    return NextResponse.json(
      { created, duplicates, projectedCount, duplicateDescriptions },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[BULK IMPORT ERROR]", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}

function normalizeDesc(desc: string): string {
  return (desc || "")
    .toLowerCase()
    .trim()
    .replace(/\s*-\s*parcela\s+\d+\/\d+/gi, "")
    .replace(/\s*\(\d+\/\d+\)/gi, "")
    .replace(/\s+/g, " ");
}

function makeKey(dateStr: string, desc: string, amount: number, installmentCurrent?: number): string {
  const norm = normalizeDesc(desc);
  if (installmentCurrent && installmentCurrent > 0) {
    return `${norm}|${amount}|p${installmentCurrent}`;
  }
  return `${dateStr}|${norm}|${amount}`;
}

function safeAddMonths(year: number, month: number, day: number, monthsToAdd: number): Date {
  let targetMonth = month + monthsToAdd;
  let targetYear = year + Math.floor((targetMonth - 1) / 12);
  targetMonth = ((targetMonth - 1) % 12) + 1;
  if (targetMonth <= 0) targetMonth += 12;

  const maxDays = new Date(targetYear, targetMonth, 0).getDate();
  const targetDay = Math.min(day, maxDays);

  return new Date(targetYear, targetMonth - 1, targetDay, 12, 0, 0);
}

function safeAddMonthsClosing(year: number, month: number, closingDay: number, monthsToAdd: number): Date {
  let targetMonth = month + monthsToAdd;
  let targetYear = year + Math.floor((targetMonth - 1) / 12);
  targetMonth = ((targetMonth - 1) % 12) + 1;
  if (targetMonth <= 0) targetMonth += 12;

  const maxDays = new Date(targetYear, targetMonth, 0).getDate();
  const targetDay = Math.min(closingDay, maxDays);

  return new Date(targetYear, targetMonth - 1, targetDay, 12, 0, 0);
}
