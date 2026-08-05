"use client";

import { useAuth } from "@/core/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardClient({ 
  children 
}: { 
  children: (userId: string) => React.ReactNode 
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        setUserId(user.uid);
      }
    }
  }, [user, loading, router]);

  if (loading || !userId) {
    return (
      <div style={{ minHeight: "calc(100vh - 58px)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-base)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2.5px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children(userId)}</>;
}
