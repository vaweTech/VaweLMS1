"use client";

import { usePathname } from "next/navigation";
import TopNav from "../components/Navbar";
import Footer from "../components/Footer";
import { useEffect } from "react";


export default function ClientLayout({ children }) {
  const pathname = usePathname();

  // Removed lite-mode redirect

  // Unregister any existing service workers on client (no SSR markup changes)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        })
        .catch(() => {});
    }
  }, []);

  // Hide chrome on unauth pages (login/register/forgot/reset)
  const hiddenPrefixes = ["/", "/auth", "/forgot-password", "/reset-password"];
  const hideChrome = hiddenPrefixes.some((prefix) => {
    if (prefix === "/") return pathname === "/"; // home only
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });

  return (
    <>
      {!hideChrome && <TopNav />}
      <main className={`flex-grow ${!hideChrome ? 'pb-32' : ''}`}>
        {children}
      </main>
      {!hideChrome && <Footer />}
    </>
  );
}
