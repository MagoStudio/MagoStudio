"use client";

import { resolveProjectTypeFromSearchParam } from "@domains/project/utils/resolveProjectTypeFromSearchParam";
import { ProjectsOfTypeCardGrid } from "@home/projects/components/ProjectsOfTypeCardGrid";
import { ProjectsOfTypeFolderTree } from "@home/projects/components/ProjectsOfTypeFolderTree";
import { useSearchParams } from "next/navigation";

export default function ProjectsByTypePage() {
  const searchParams = useSearchParams();
  const projectType = resolveProjectTypeFromSearchParam(
    searchParams.get("type")
  );
  const listsProjectsAsFolderTree = projectType === "timeline";

  return (
    <div className="flex flex-col gap-6 py-8 px-6 w-full h-full items-center overflow-y-auto scrollbar-custom">
      <div className="max-w-home-page w-full flex flex-col gap-8">
        {listsProjectsAsFolderTree ? (
          <ProjectsOfTypeFolderTree projectType={projectType} />
        ) : (
          <ProjectsOfTypeCardGrid projectType={projectType} />
        )}
      </div>
    </div>
  );
}
