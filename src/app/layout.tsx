import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import { AuthSessionProvider } from "@/components/shared/providers/auth-session-provider";
import { TimezoneProvider } from "@/components/shared/providers/timezone-provider";
import { ThemeProvider } from "@/components/shared/providers/theme-provider";
import type { Metadata } from "next";
import { QueryProvider } from "@/components/shared/providers/query-provider";
import { headers } from "next/headers";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://app.callautomate.ai"),
  title: "CallAutomate - AI Voice Automation Platform",
  description: "Explore CallAutomate's AI voice automation platform to automate customer calls, schedule appointments, and provide 24/7 intelligent support seamlessly.",
  alternates: {
    canonical: "https://app.callautomate.ai/",
  },
  openGraph: {
    title: "CallAutomate - AI Voice Automation Platform",
    description: "Explore CallAutomate's AI voice automation platform to automate customer calls, schedule appointments, and provide 24/7 intelligent support seamlessly.",
    url: "https://app.callautomate.ai/",
    siteName: "CallAutomate",
    images: [
      {
        url: "https://app.callautomate.ai/icon.svg",
        width: 800,
        height: 600,
        alt: "CallAutomate Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CallAutomate - AI Voice Automation Platform",
    description: "Explore CallAutomate's AI voice automation platform to automate customer calls, schedule appointments, and provide 24/7 intelligent support seamlessly.",
    images: ["https://app.callautomate.ai/icon.svg"],
  },
  icons: {
    icon: "/icon.svg",
  },
};

const jsonLdSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://app.callautomate.ai/#website",
      "url": "https://app.callautomate.ai/",
      "name": "CallAutomate",
      "description": "Explore CallAutomate's AI voice automation platform to automate customer calls, schedule appointments, and provide 24/7 intelligent support seamlessly."
    },
    {
      "@type": "Organization",
      "@id": "https://app.callautomate.ai/#organization",
      "name": "CallAutomate",
      "url": "https://app.callautomate.ai/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://app.callautomate.ai/icon.svg"
      },
      "image": "https://app.callautomate.ai/icon.svg",
      "description": "Explore CallAutomate's AI voice automation platform to automate customer calls, schedule appointments, and provide 24/7 intelligent support seamlessly.",
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "support@callautomate.ai",
        "contactType": "customer support"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://app.callautomate.ai/#software",
      "name": "CallAutomate",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "AI Voice Automation Platform for enterprise customer dashboard and AI calling operations.",
      "url": "https://app.callautomate.ai/"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://app.callautomate.ai/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://app.callautomate.ai/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "AI Voice Automation",
          "item": "https://app.callautomate.ai/#features"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://app.callautomate.ai/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How secure is my data?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Security is foundational to CallAutomate. All call audio, transcripts, and customer data are encrypted in transit via TLS 1.3 and at rest using AES-256 encryption. We adhere to enterprise-grade compliance standards, strict multi-tenant data isolation, and robust access controls to ensure your sensitive business data is completely secure."
          }
        },
        {
          "@type": "Question",
          "name": "What industries benefit most from CallAutomate?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "CallAutomate is built for high-volume service and sales environments. Industries that benefit most include Healthcare & Clinics (patient scheduling), Real Estate & Property Management (inbound lead qualification), Salons & Spas (booking management), Logistics & Dispatch (delivery tracking), Restaurants (reservation calls), and Professional Services (after-hours phone support)."
          }
        }
      ]
    },
    {
      "@type": "Service",
      "@id": "https://app.callautomate.ai/#service",
      "name": "AI Voice Automation & Virtual Receptionist Service",
      "description": "Enterprise AI voice receptionist and automated calling service for appointment booking, customer support, outbound sales, and 24/7 call operations.",
      "provider": {
        "@type": "Organization",
        "@id": "https://app.callautomate.ai/#organization",
        "name": "CallAutomate",
        "url": "https://app.callautomate.ai/"
      },
      "serviceType": "AI Voice Automation",
      "areaServed": "Global"
    }
  ]
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") || "";

  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <script
          nonce={nonce}
          type="application/ld+json"
          async
          defer
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdSchema)
          }}
        />
        <script
          nonce={nonce}
          defer
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
