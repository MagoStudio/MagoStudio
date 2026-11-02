"use client";

import { AuthPageWrapper } from "@components/AuthPageWrapper";
import { SignIn } from "@platform/identity";

export default function SignInPage() {
  return (
    <AuthPageWrapper>
      <SignIn signUpUrl="/sign-up" />
    </AuthPageWrapper>
  );
}
