import { useShallowRouter } from "@hooks/useShallowRouter";
import { isPlayingAtom } from "@store/atoms";
import { useSetAtom } from "jotai";
import { usePathname, useSearchParams } from "next/navigation";

import { parseTool, type Tool } from "./parseTool";

export type { Tool } from "./parseTool";

export const TOOL_URL_PARAM = "tool";

export const useTool = (): { tool: Tool; setTool: (next: Tool) => void } => {
  const { replace } = useShallowRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setIsPlaying = useSetAtom(isPlayingAtom);

  const tool = parseTool(searchParams.get(TOOL_URL_PARAM));

  const setTool = (next: Tool) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(TOOL_URL_PARAM) === next) return;
    setIsPlaying(false);
    params.set(TOOL_URL_PARAM, next);
    replace(`${pathname}?${params.toString()}`);
  };

  return { tool, setTool };
};
