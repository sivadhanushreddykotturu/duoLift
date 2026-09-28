import { SignIn } from "@clerk/nextjs";
import { AuthLayout, clerkAuthAppearance } from "@/components/auth/AuthLayout";

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignIn appearance={clerkAuthAppearance} />
    </AuthLayout>
  );
}
