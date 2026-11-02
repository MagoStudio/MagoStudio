import { LONG_FORM_RUN_ACCESS_KEY } from "@domains/longFormRun/constants";

export function generateStaticParams() {
  return [{ accessKey: LONG_FORM_RUN_ACCESS_KEY }];
}

export default function LongFormAccessKeyLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
