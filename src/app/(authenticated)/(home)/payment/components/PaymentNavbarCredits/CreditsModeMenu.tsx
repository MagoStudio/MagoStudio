import { Icon } from "@components/Icon";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { ROUTES } from "@config/constants";
import { useBalance } from "@domains/payment/useBalance";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { RelaxedModeType } from "@schemas/balance";
import { cn } from "@utils";
import { getMenuItemClassName } from "@utils/getMenuItemClassName";
import { getSidebarEntryClassName } from "@utils/getSidebarEntryClassName";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button as AriaButton } from "react-aria-components/Button";
import {
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger
} from "react-aria-components/Menu";
import { Popover } from "react-aria-components/Popover";
import { Separator } from "react-aria-components/Separator";
import { useTranslation } from "react-i18next";

type CreditsModeKey = "credits" | "relaxed";

const MENU_ITEM_CLASS_NAME = cn(
  getMenuItemClassName({ isItemDisabled: false }),
  "items-center gap-2 cursor-pointer data-[focused]:bg-element-primary-active"
);

type Props = {
  isModeChoiceApplicable: boolean;
  children: React.ReactNode;
};

export const CreditsModeMenu: React.FC<Props> = ({
  isModeChoiceApplicable,
  children
}) => {
  const { t } = useTranslation();
  const [isCreditsMenuOpen, setIsCreditsMenuOpen] = useState(false);
  const router = useRouter();
  const { data: balanceData } = useBalance();
  const { isModeToggleAvailable, relaxedModeType } = useCurrentSubscription();
  const { isUnlimitedModeActive, setIsUnlimitedModeActive } =
    useIsUnlimitedModeActive();

  const userCreditsCount = balanceData?.amount || 0;
  const selectedModeKey: CreditsModeKey = isUnlimitedModeActive
    ? "relaxed"
    : "credits";
  const relaxedModeItemLabel =
    relaxedModeType === RelaxedModeType.UNLIMITED
      ? t("credits_menu.unlimited_mode.label")
      : t("credits_menu.relaxed_mode.label");

  const switchToMode = (modeKey: CreditsModeKey) => {
    if (modeKey === "relaxed" && !isModeToggleAvailable) {
      trackingUtils.paymentActions.navbarBalanceClick(userCreditsCount);
      router.push(ROUTES.PAYMENT_SUBSCRIPTIONS);
      return;
    }
    const isRelaxedModeChosen = modeKey === "relaxed";
    trackingUtils.paymentActions.getUnlimitedClicked(
      isRelaxedModeChosen ? "activated" : "deactivated",
      isRelaxedModeChosen
    );
    setIsUnlimitedModeActive(isRelaxedModeChosen);
  };

  const addCredits = () => {
    trackingUtils.paymentActions.navbarBalanceClick(userCreditsCount);
    router.push(ROUTES.PAYMENT_CREDITS);
  };

  return (
    <MenuTrigger isOpen={isCreditsMenuOpen} onOpenChange={setIsCreditsMenuOpen}>
      <AriaButton
        data-testid="credit-balance-link"
        aria-label={t("credits_menu.open.label")}
        className={cn(
          getSidebarEntryClassName({ isEntryActive: isCreditsMenuOpen }),
          "min-w-0 cursor-pointer outline-hidden"
        )}
      >
        {children}
      </AriaButton>
      <Popover
        placement="right bottom"
        offset={20}
        className="z-menu w-56 rounded bg-surface-secondary py-2 shadow-lg outline-hidden"
      >
        {isModeChoiceApplicable && (
          <>
            <Menu className="flex flex-col gap-0.5 px-2 outline-hidden">
              <MenuSection
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={[selectedModeKey]}
                onSelectionChange={(keys) => {
                  if (keys === "all") return;
                  const [chosenModeKey] = [...keys];
                  if (
                    chosenModeKey === "credits" ||
                    chosenModeKey === "relaxed"
                  ) {
                    switchToMode(chosenModeKey);
                  }
                }}
                className="flex flex-col gap-0.5"
              >
                <MenuItem
                  id="credits"
                  textValue={t("credits_menu.credits_mode.label")}
                  className={MENU_ITEM_CLASS_NAME}
                >
                  {({ isSelected }) => (
                    <>
                      <Text component="span" variant="sm" color="inherit">
                        {t("credits_menu.credits_mode.label")}
                      </Text>
                      {isSelected && (
                        <Icon
                          iconSet="16"
                          iconName="checkmark"
                          className="ml-auto"
                        />
                      )}
                    </>
                  )}
                </MenuItem>
                <MenuItem
                  id="relaxed"
                  textValue={relaxedModeItemLabel}
                  className={cn(
                    MENU_ITEM_CLASS_NAME,
                    !isModeToggleAvailable && "text-glyph-disabled"
                  )}
                >
                  {({ isSelected }) => (
                    <>
                      <Text component="span" variant="sm" color="inherit">
                        {relaxedModeItemLabel}
                      </Text>
                      {isModeToggleAvailable ? (
                        isSelected && (
                          <Icon
                            iconSet="16"
                            iconName="checkmark"
                            className="ml-auto"
                          />
                        )
                      ) : (
                        <Text
                          component="span"
                          variant="xs"
                          color="glyph-action-main"
                          className="ml-auto"
                        >
                          {t("credits_menu.upgrade.label")}
                        </Text>
                      )}
                    </>
                  )}
                </MenuItem>
              </MenuSection>
            </Menu>
            <Separator className="mx-2 my-1 h-px border-0 bg-glyph-invert-main" />
          </>
        )}
        <div className="px-2">
          <MainButton
            size="sm"
            fullWidth
            data-testid="top-up-credits-button"
            onPress={() => {
              setIsCreditsMenuOpen(false);
              addCredits();
            }}
          >
            {t("actions.top_up_credits.label")}
          </MainButton>
        </div>
      </Popover>
    </MenuTrigger>
  );
};
