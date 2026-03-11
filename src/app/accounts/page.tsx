"use client";

import DashboardClient from "@/components/DashboardClient";
import AccountsContent from "@/components/AccountsContent";

export const dynamic = "force-dynamic";

export default function AccountsPage() {
  return (
    <DashboardClient>
      {(userId) => <AccountsContent userId={userId} />}
    </DashboardClient>
  );
}
