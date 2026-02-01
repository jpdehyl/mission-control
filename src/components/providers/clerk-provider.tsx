"use client";

import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

const clerkAppearance = {
  variables: {
    colorPrimary: "#3b82f6",
    colorBackground: "#0a0a0a",
    colorInputBackground: "#1f2937",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "#9ca3af",
  },
  elements: {
    formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
    card: "bg-gray-900 border border-gray-800",
    headerTitle: "text-white",
    headerSubtitle: "text-gray-400",
    socialButtonsBlockButton: "bg-gray-800 border-gray-700 hover:bg-gray-700",
    formFieldLabel: "text-gray-300",
    formFieldInput: "bg-gray-800 border-gray-700 text-white",
    footerActionLink: "text-blue-400 hover:text-blue-300",
    userButtonPopoverCard: "bg-gray-900 border border-gray-800",
    userButtonPopoverActionButton: "hover:bg-gray-800",
    userButtonPopoverActionButtonText: "text-gray-300",
    userButtonPopoverFooter: "hidden",
  },
};

interface ClerkProviderProps {
  children: ReactNode;
}

export function ClerkProviderWrapper({ children }: ClerkProviderProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // During build or when key is missing, render children without Clerk
  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <BaseClerkProvider
      publishableKey={publishableKey}
      appearance={clerkAppearance}
    >
      {children}
    </BaseClerkProvider>
  );
}
