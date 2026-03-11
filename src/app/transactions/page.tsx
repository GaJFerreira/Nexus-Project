"use client";

import DashboardClient from "@/components/DashboardClient";
import TransactionsContent from "@/components/TransactionsContent";

export const dynamic = "force-dynamic";

export default function TransactionsPage() {
  return (
    <DashboardClient>
      {(userId) => <TransactionsContent userId={userId} />}
    </DashboardClient>
  );
}
