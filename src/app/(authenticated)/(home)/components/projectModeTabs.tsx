import { Icon } from "@components/Icon";
import type { TFunction } from "i18next";

import { isLocalApp } from "@/platform/localDesktop";

type ProjectModeTabsOptions = {
  t: TFunction;
  isEditFrameAvailable?: boolean;
  isTeamMember?: boolean;
  /**
   * Whether the plan feature has a backend behind it here.
   *
   * Every call in `src/domains/plan/api` goes straight to `/agent/plans` on the
   * cloud backend, and nothing in the desktop bridge implements it -- so in the
   * desktop app the tab opens a page that cannot load, and a plan's renders
   * would not reach the desktop's own cloud render path either. Hidden there
   * until it is actually wired, rather than shown and broken.
   */
  isPlanAvailable?: boolean;
};

export const GLOBAL_TIMELINE_TAB_ID = "global-timeline";
export const PLAN_TAB_ID = "plan";

export const getProjectModeTabs = ({
  t,
  isEditFrameAvailable,
  isTeamMember = false,
  isPlanAvailable = !isLocalApp
}: ProjectModeTabsOptions) => [
  {
    id: "render-video",
    name: t("titles.render_video.label"),
    icon: <Icon iconSet="24" iconName="render-video" />
  },
  {
    id: "edit-frame",
    name: t("titles.modify_frame.label"),
    icon: <Icon iconSet="24" iconName="edit-frame" />,
    ...(isEditFrameAvailable === false ? { isDisabled: true } : {})
  },
  {
    id: "upscale",
    name: t("titles.upscale.label"),
    icon: <Icon iconSet="24" iconName="upscale" />,
    ...(isEditFrameAvailable === false ? { isDisabled: true } : {})
  },
  {
    id: GLOBAL_TIMELINE_TAB_ID,
    name: t("titles.global_timeline.label"),
    icon: <Icon iconSet="24" iconName="global-timeline" />
  },
  ...(isTeamMember && isPlanAvailable
    ? [
        {
          id: PLAN_TAB_ID,
          name: t("titles.plan_tab.label"),
          icon: <Icon iconSet="24" iconName="bulb" />
        }
      ]
    : [])
];
