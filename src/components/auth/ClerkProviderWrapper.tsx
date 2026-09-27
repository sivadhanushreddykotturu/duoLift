import React from "react";
import { ClerkProvider } from "@clerk/nextjs";

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkPubKey) {
    // When no key is set yet, render gracefully so the app can be developed and previewed immediately
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={{
        variables: {
          colorPrimary: "#CCFF00",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
