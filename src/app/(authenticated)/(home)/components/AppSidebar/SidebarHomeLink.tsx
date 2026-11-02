import { SidebarLink } from "@components/SidebarLink";
import { ROUTES } from "@config/constants";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

export const SidebarHomeLink: React.FC = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isHomePageCurrent = pathname === ROUTES.HOME;

  return (
    <ul className="flex flex-col gap-1 px-3">
      <li>
        <SidebarLink href={ROUTES.HOME} isCurrentPage={isHomePageCurrent}>
          {t("app_sidebar.home.label")}
        </SidebarLink>
      </li>
    </ul>
  );
};
