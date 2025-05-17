"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Providers } from "./config/wagmi";

const queryClient = new QueryClient();

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Providers>{children}</Providers>
    </QueryClientProvider>
  );
}