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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return <>{children(userId)}</>;
}
