import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CallAutomate Login - Access Your AI Voice Automation Account",
  description: "Sign in to CallAutomate to automate customer calls, manage 24/7 intelligent appointment scheduling, and deliver automated phone support seamlessly.",
  openGraph: {
    title: "CallAutomate Login - Access Your AI Voice Automation Account",
    description: "Sign in to CallAutomate to automate customer calls, manage 24/7 intelligent appointment scheduling, and deliver automated phone support seamlessly.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CallAutomate Login - Access Your AI Voice Automation Account",
    description: "Sign in to CallAutomate to automate customer calls, manage 24/7 intelligent appointment scheduling, and deliver automated phone support seamlessly.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
