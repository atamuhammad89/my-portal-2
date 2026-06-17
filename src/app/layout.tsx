import { AuthSessionProvider } from "@/components/shared/providers/auth-session-provider";
import { TimezoneProvider } from "@/components/shared/providers/timezone-provider";
import { ThemeProvider } from "@/components/shared/providers/theme-provider";
import type { Metadata } from "next";
import { QueryProvider } from "@/components/shared/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Calling Dashboard",
  description: "Multi-tenant customer dashboard for AI calling operations."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
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
