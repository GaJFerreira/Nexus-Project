"use client";

import DashboardClient from "@/components/DashboardClient";
import DashboardContent from "@/components/DashboardContent";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <DashboardClient>
      {(userId) => <DashboardContent userId={userId} />}
    </DashboardClient>
  );
}
