import { cn } from "@utils";

export const CloudIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={cn("size-5 shrink-0", className)}
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M7 18.5h10a4.5 4.5 0 0 0 .6-8.96A6 6 0 0 0 6.1 8.7 5 5 0 0 0 7 18.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
