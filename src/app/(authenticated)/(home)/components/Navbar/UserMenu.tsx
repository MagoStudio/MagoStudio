import { useClerk, useUser } from "@clerk/react";
import { CircularProgress } from "@components/CircularProgress";
import { Menu } from "@components/Menu";
import { MenuItem } from "@components/MenuItem";
import { MenuItemButton } from "@components/MenuItemButton";
import { MenuList } from "@components/MenuList";
import { Text } from "@components/Text";
import { ROUTES } from "@config/constants";
import { cacheClear } from "@domains/asset/utils/cacheStorage";
import { usePortalSession } from "@hooks/payment/usePortalSession";
import { useDebugInfoModal } from "@hooks/useDebugInfoModal";
import { useIsRawTeamMember } from "@hooks/userLocalStorage/useIsRawTeamMember";
import { cn } from "@utils";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export function UserMenu() {
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const { t } = useTranslation();
  const { open: openDebugInfo } = useDebugInfoModal();
  const isTeamMember = useIsRawTeamMember();

  const { mutate: openPortalSession, isPending: isLoadingPortal } =
    usePortalSession();

  return (
    <Menu
      button={
        <div
          aria-label="Open User menu"
          className="flex w-full min-w-0 items-center gap-2 h-10 px-3 rounded-lg cursor-pointer hover:bg-element-primary-active"
        >
          <img
            alt="Account"
            src={user?.imageUrl || "/logo.svg"}
            className="size-6 shrink-0 rounded-full object-cover"
          />
          <Text
            component="span"
            variant="sm"
            color="glyph-secondary"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {t("titles.my_account.label")}
          </Text>
        </div>
      }
      disableGutters
      placement="right-end"
      className="w-full z-10"
      panelClassName="mt-0 ml-5"
    >
      <MenuList className="bg-surface-secondary w-56 !py-2">
        <MenuItem>
          <MenuItemButton onClick={() => openUserProfile()}>
            <Text variant="sm">{t("titles.account_info.label")}</Text>
          </MenuItemButton>
        </MenuItem>
        <MenuItem>
          <MenuItemButton>
            <Link href={ROUTES.PAYMENT_MAIN_PAGE}>
              <Text variant="sm">
                {t("titles.subscriptions_and_credits.label")}
              </Text>
            </Link>
          </MenuItemButton>
        </MenuItem>
        <MenuItem>
          <MenuItemButton
            onClick={() => {
              const tab = window.open("about:blank", "_blank");
              openPortalSession(undefined, {
                onSuccess: (url) => {
                  if (tab) {
                    tab.location.href = url;
                  } else {
                    window.open(url, "_blank");
                  }
                },
                onError: () => {
                  tab?.close();
                }
              });
            }}
            className={cn(
              "flex !items-center",
              isLoadingPortal && "!justify-center"
            )}
          >
            {isLoadingPortal ? (
              <div>
                <CircularProgress size="xs" color="glyph-secondary" />
              </div>
            ) : (
              <Text variant="sm" color="glyph-primary">
                {t("titles.billing_info.label")}
              </Text>
            )}
          </MenuItemButton>
        </MenuItem>
        <MenuItem>
          <MenuItemButton
            onClick={() => {
              void cacheClear("image");
              void signOut({ redirectUrl: "/" });
            }}
          >
            <Text variant="sm" color="glyph-error">
              {t("titles.sign_out.label")}
            </Text>
          </MenuItemButton>
        </MenuItem>
        {isTeamMember && (
          <MenuItem>
            <MenuItemButton onClick={openDebugInfo}>
              <Text variant="sm">{t("titles.debug_info.label")}</Text>
            </MenuItemButton>
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  );
}
