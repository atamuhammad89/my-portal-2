import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your CallAutomate Account - 30-Day Free Trial",
  description: "Sign up for CallAutomate to start your 30-Day Free Trial. Automate customer calls, schedule appointments, and deploy 24/7 intelligent voice agents.",
  openGraph: {
    title: "Create Your CallAutomate Account - 30-Day Free Trial",
    description: "Sign up for CallAutomate to start your 30-Day Free Trial. Automate customer calls, schedule appointments, and deploy 24/7 intelligent voice agents.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Your CallAutomate Account - 30-Day Free Trial",
    description: "Sign up for CallAutomate to start your 30-Day Free Trial. Automate customer calls, schedule appointments, and deploy 24/7 intelligent voice agents.",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      {children}
    </>
  );
}
