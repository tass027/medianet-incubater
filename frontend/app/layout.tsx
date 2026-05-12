'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles/globals.css";
import ReduxProvider from "./store/Provider";
import { useEffect } from "react";
import { useStore } from "react-redux";
import { setupInterceptors, refreshTokens } from "./store/slices/authSlice";

const inter = Inter({ subsets: ["latin"] });

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const store = useStore();

  useEffect(() => {
    // 1. Activer l'intercepteur Axios (auto-refresh sur 401)
    setupInterceptors(store);

    // 2. Refresh silencieux au rechargement de page
    store.dispatch(refreshTokens());
  }, []);

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          <AuthInitializer>
            {children}
          </AuthInitializer>
        </ReduxProvider>
      </body>
    </html>
  );
}