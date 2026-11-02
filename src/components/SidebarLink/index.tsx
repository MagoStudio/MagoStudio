import { cn } from "@utils";
import { getSidebarEntryClassName } from "@utils/getSidebarEntryClassName";
import Link from "next/link";

interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  href: string;
  isCurrentPage: boolean;
}

export const SidebarLink: React.FC<Props> = ({
  children,
  href,
  isCurrentPage,
  className,
  ...props
}) => (
  <Link
    href={href}
    aria-current={isCurrentPage ? "page" : undefined}
    className={cn(
      getSidebarEntryClassName({ isEntryActive: isCurrentPage }),
      className
    )}
    {...props}
  >
    {children}
  </Link>
);
