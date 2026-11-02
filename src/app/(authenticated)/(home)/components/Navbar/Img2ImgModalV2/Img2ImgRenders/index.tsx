import React from "react";

import { Img2ImgClipGrid } from "../Img2ImgClipGrid";

import { Img2ImgRender } from "./Img2ImgRender";

type Img2ImgRendersProps = {
  maxColumns?: number;
};

export const Img2ImgRenders: React.FC<Img2ImgRendersProps> = ({
  maxColumns
}) => {
  return (
    <Img2ImgClipGrid
      successClipComponent={Img2ImgRender}
      maxColumns={maxColumns}
    />
  );
};
