"use client";

import PlanningContent from "@/components/PlanningContent";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default function PlanningPage() {
  return (
    <DashboardClient>
      {(userId) => <PlanningContent userId={userId} />}
    </DashboardClient>
  );
}
