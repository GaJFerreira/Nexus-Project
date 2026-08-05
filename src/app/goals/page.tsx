"use client";

import GoalsContent from "@/components/GoalsContent";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default function GoalsPage() {
  return (
    <DashboardClient>
      {(userId) => <GoalsContent userId={userId} />}
    </DashboardClient>
  );
}
