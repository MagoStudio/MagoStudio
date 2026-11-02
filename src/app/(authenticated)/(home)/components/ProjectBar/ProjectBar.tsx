import { NavbarProjectActions } from "@home/components/Navbar/NavbarProjectActions";
import { NavbarProjectTitle } from "@home/components/Navbar/NavbarProjectTitle";
import { NavigationBreadcrumb } from "@home/components/Navbar/NavigationBreadcrumb";
import { usePathname } from "next/navigation";

import { isProjectBarRoute } from "./utils/isProjectBarRoute";

export const ProjectBar: React.FC = () => {
  const pathname = usePathname();

  if (!isProjectBarRoute(pathname ?? "")) return null;

  return (
    <header className="relative z-10 w-full bg-surface-primary">
      <nav className="relative flex items-center h-toolbar text-glyph-secondary border-b border-glyph-invert-main">
        <div className="flex justify-start items-center min-w-0 h-full">
          <NavigationBreadcrumb />
          <NavbarProjectActions />
        </div>
        <NavbarProjectTitle />
      </nav>
    </header>
  );
};
