"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarketplaceRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/agent-registry");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">Redirecting to AI Marketplace...</p>
      </div>
    </div>
  );
}
