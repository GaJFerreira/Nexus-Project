"use client";

import DashboardClient from "@/components/DashboardClient";
import ImportContent from "@/components/ImportContent";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <DashboardClient>
      {() => <ImportContent />}
    </DashboardClient>
  );
}
