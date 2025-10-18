"use client";

import { wagmiConfig } from "@/lib/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { CivicAuthProvider } from "@civic/auth/react";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const civicClientId = process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID;

  if (!civicClientId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold text-lg mb-2">⚠️ Configuration Error</h2>
          <p className="text-red-700 text-sm mb-4">
            Missing <code className="bg-red-100 px-1 py-0.5 rounded">NEXT_PUBLIC_CIVIC_CLIENT_ID</code>
          </p>
          <p className="text-red-600 text-xs">
            Get your client ID from{" "}
            <a
              href="https://auth.civic.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Civic Dashboard
            </a>
            {" "}and add it to <code className="bg-red-100 px-1 py-0.5 rounded">.env.local</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <CivicAuthProvider clientId={civicClientId}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </CivicAuthProvider>
  );
}

