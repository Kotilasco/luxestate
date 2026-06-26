"use client";

import { useEffect, useState } from "react";
import RegistryConsole from "../components/RegistryConsole";

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-5xl font-extrabold mb-2">ZAI-CTS</h1>
          <p className="text-lg opacity-80">Loading Zimbabwe Carbon Trading Platform…</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <ClientOnly>
        <RegistryConsole />
      </ClientOnly>
    </main>
  );
}
