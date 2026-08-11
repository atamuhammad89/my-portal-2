import { AuthSessionProvider } from "@/components/shared/providers/auth-session-provider";
import { TimezoneProvider } from "@/components/shared/providers/timezone-provider";
import { ThemeProvider } from "@/components/shared/providers/theme-provider";
import type { Metadata } from "next";
import { QueryProvider } from "@/components/shared/providers/query-provider";
import { headers } from "next/headers";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CallAutomate - AI Voice Automation Platform",
  description: "Enterprise multi-tenant customer dashboard and AI calling operations platform.",
  icons: {
    icon: "/icon.svg",
  },
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") || "";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', t);
                  if (t === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <TimezoneProvider>
            <QueryProvider>
              <AuthSessionProvider>{children}</AuthSessionProvider>
            </QueryProvider>
          </TimezoneProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
