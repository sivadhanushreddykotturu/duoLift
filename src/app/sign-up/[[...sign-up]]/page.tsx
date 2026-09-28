import { SignUp } from "@clerk/nextjs";
import { AuthLayout, clerkAuthAppearance } from "@/components/auth/AuthLayout";

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp appearance={clerkAuthAppearance} />
    </AuthLayout>
  );
}
