"use client";

import { AuthPageWrapper } from "@components/AuthPageWrapper";
import { SignUp } from "@platform/identity";

export default function SignUpPage() {
  return (
    <AuthPageWrapper>
      <SignUp signInUrl="/sign-in" />
    </AuthPageWrapper>
  );
}
