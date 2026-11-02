import type Konva from "konva";
import type {
  BufferTarget,
  AudioBufferSource,
  AudioSampleSink
} from "mediabunny";

import { getKonva, getMediabunny } from "./lazyLoad";
import { InfoRichVideoOptions } from "./types";

const PROGRESS_START = 20;
const PROGRESS_RANGE = 70;
const PROGRESS_MAX = 90;
const PROGRESS_UPDATE_INTERVAL = 10;

const INFO_PANEL_WIDTH_RATIO = 0.35;
const INFO_PANEL_MIN_WIDTH = 300;
const REFERENCE_WIDTH = 1080;
const VIDEO_AREA_MIN_RATIO = 0.5;

const INFO_PANEL_BG_COLOR = "rgba(0,0,0,0.85)";
const REF_INFO_PANEL_PADDING_X = 48;
const REF_INFO_PANEL_PADDING_Y = 36;

const FONT_FAMILY = "Lato, sans-serif";
const TEXT_COLOR = "#FFFFFF";
const TEXT_COLOR_SECONDARY = "rgba(255,255,255,0.6)";
const REF_TITLE_FONT_SIZE = 36;
const REF_LABEL_FONT_SIZE = 26;
const REF_PROMPT_FONT_SIZE = 22;
const REF_TIMECODE_FONT_SIZE = 28;
const REF_LINE_SPACING = 10;
const REF_SECTION_SPACING = 20;

const TIMECODE_BG_COLOR = "rgba(0,0,0,0.6)";
const REF_TIMECODE_PAD_H = 12;
const REF_TIMECODE_PAD_V = 6;
const REF_TIMECODE_MARGIN = 16;
const REF_TIMECODE_BORDER_RADIUS = 6;

const REF_IMAGE_REF_WIDTH = 200;
const REF_IMAGE_REF_HEIGHT = 200;
const REF_IMAGE_REF_BORDER_RADIUS = 8;
const REF_IMAGE_REF_LABEL_FONT_SIZE = 18;
const IMAGE_REF_LABEL_MAX_CHARS = 30;

const SECONDS_PER_MINUTE = 60;
const CENTISECONDS = 100;
const TC_PAD_LENGTH = 2;

const MAX_NAME_CHARS = 50;

function createKonvaStage(
  KonvaLib: typeof Konva,
  width: number,
  height: number
): { stage: Konva.Stage; layer: Konva.Layer } {
  const container = document.createElement("div");
  const stage = new KonvaLib.Stage({ container, width, height });
  const layer = new KonvaLib.Layer();
  stage.add(layer);
  return { stage, layer };
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  srcWidth: number,
  srcHeight: number,
  destWidth: number,
  destHeight: number
) {
  if (
    !srcWidth ||
    !srcHeight ||
    !destWidth ||
    !destHeight ||
    !Number.isFinite(srcWidth) ||
    !Number.isFinite(srcHeight) ||
    !Number.isFinite(destWidth) ||
    !Number.isFinite(destHeight)
  ) {
    return;
  }

  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) {
    (
      ctx as CanvasRenderingContext2D & { imageSmoothingQuality: string }
    ).imageSmoothingQuality = "high";
  }

  const scale = Math.min(destWidth / srcWidth, destHeight / srcHeight);
  const drawWidth = srcWidth * scale;
  const drawHeight = srcHeight * scale;
  const dx = (destWidth - drawWidth) / 2;
  const dy = (destHeight - drawHeight) / 2;

  ctx.drawImage(
    image,
    0,
    0,
    srcWidth,
    srcHeight,
    dx,
    dy,
    drawWidth,
    drawHeight
  );
}

async function ensureLatoFont(): Promise<void> {
  try {
    if (typeof FontFace !== "undefined" && document.fonts) {
      const latoRegular = new FontFace(
        "Lato",
        "url(https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXiWtFCc.woff2)",
        { weight: "400", style: "normal" }
      );
      const latoBold = new FontFace(
        "Lato",
        "url(https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPGQ3q5d0.woff2)",
        { weight: "700", style: "normal" }
      );

      const [regular, bold] = await Promise.all([
        latoRegular.load(),
        latoBold.load()
      ]);
      document.fonts.add(regular);
      document.fonts.add(bold);

      await document.fonts.ready;
    }
  } catch (error) {
    console.warn(
      "Could not load Lato font, falling back to system font:",
      error
    );
  }
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

function formatTimecode(seconds: number, frameNumber?: number): string {
  const mins = Math.floor(seconds / SECONDS_PER_MINUTE);
  const secs = Math.floor(seconds % SECONDS_PER_MINUTE);
  const cs = Math.floor((seconds % 1) * CENTISECONDS);
  const tc = `${String(mins).padStart(TC_PAD_LENGTH, "0")}:${String(secs).padStart(TC_PAD_LENGTH, "0")}:${String(cs).padStart(TC_PAD_LENGTH, "0")}`;
  if (frameNumber !== undefined) {
    return `${tc}  F${frameNumber}`;
  }
  return tc;
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const ELLIPSIS_LENGTH = 3;
  return text.slice(0, maxChars - ELLIPSIS_LENGTH) + "...";
}

function addInfoPanelContent(
  KonvaLib: typeof Konva,
  layer: Konva.Layer,
  panelX: number,
  panelY: number,
  panelWidth: number,
  panelHeight: number,
  scaleFactor: number,
  textScaleFactor: number,
  videoContentStartY: number,
  options: {
    projectName: string;
    trackName: string;
    engineDisplayName: string;
    controlType?: string;
    prompt?: string;
    imageRefImg: HTMLImageElement | null;
    imageRefName?: string;
  }
) {
  const {
    projectName,
    trackName,
    engineDisplayName,
    controlType,
    prompt,
    imageRefImg,
    imageRefName
  } = options;

  const paddingX = Math.round(REF_INFO_PANEL_PADDING_X * scaleFactor);
  const paddingY = Math.round(REF_INFO_PANEL_PADDING_Y * scaleFactor);
  const titleFontSize = Math.round(REF_TITLE_FONT_SIZE * textScaleFactor);
  const labelFontSize = Math.round(REF_LABEL_FONT_SIZE * textScaleFactor);
  const promptFontSize = Math.round(REF_PROMPT_FONT_SIZE * textScaleFactor);
  const lineSpacing = Math.round(REF_LINE_SPACING * scaleFactor);
  const sectionSpacing = Math.round(REF_SECTION_SPACING * scaleFactor);
  const imageRefWidth = Math.round(REF_IMAGE_REF_WIDTH * scaleFactor);
  const imageRefHeight = Math.round(REF_IMAGE_REF_HEIGHT * scaleFactor);
  const imageRefBorderRadius = Math.round(
    REF_IMAGE_REF_BORDER_RADIUS * scaleFactor
  );
  const imageRefLabelFontSize = Math.round(
    REF_IMAGE_REF_LABEL_FONT_SIZE * textScaleFactor
  );

  let textY = panelY + Math.max(paddingY, videoContentStartY);
  const leftX = panelX + paddingX;
  const maxTextWidth = panelWidth - paddingX * 2;

  const titleNode = new KonvaLib.Text({
    x: leftX,
    y: textY,
    text: truncateText(projectName, MAX_NAME_CHARS),
    fontSize: titleFontSize,
    fontFamily: FONT_FAMILY,
    fontStyle: "bold",
    fill: TEXT_COLOR,
    width: maxTextWidth
  });
  layer.add(titleNode);
  textY += titleNode.height() + lineSpacing;

  const trackNode = new KonvaLib.Text({
    x: leftX,
    y: textY,
    text: truncateText(trackName, MAX_NAME_CHARS),
    fontSize: labelFontSize,
    fontFamily: FONT_FAMILY,
    fill: TEXT_COLOR,
    width: maxTextWidth
  });
  layer.add(trackNode);
  textY += trackNode.height() + lineSpacing;

  const engineNode = new KonvaLib.Text({
    x: leftX,
    y: textY,
    text: engineDisplayName,
    fontSize: labelFontSize,
    fontFamily: FONT_FAMILY,
    fill: TEXT_COLOR_SECONDARY,
    width: maxTextWidth
  });
  layer.add(engineNode);
  textY += engineNode.height() + lineSpacing;

  if (controlType) {
    const controlNode = new KonvaLib.Text({
      x: leftX,
      y: textY,
      text: `ControlNet: ${controlType}`,
      fontSize: labelFontSize,
      fontFamily: FONT_FAMILY,
      fill: TEXT_COLOR_SECONDARY,
      width: maxTextWidth
    });
    layer.add(controlNode);
    textY += controlNode.height() + lineSpacing;
  }

  if (prompt) {
    textY += sectionSpacing;
    const promptText = new KonvaLib.Text({
      x: leftX,
      y: textY,
      text: `"${prompt}"`,
      fontSize: promptFontSize,
      fontFamily: FONT_FAMILY,
      fontStyle: "italic",
      fill: TEXT_COLOR_SECONDARY,
      width: maxTextWidth,
      lineHeight: 1.3
    });
    layer.add(promptText);
    textY += promptText.height() + sectionSpacing;
  }

  if (imageRefImg) {
    const labelSpace = imageRefName ? imageRefLabelFontSize + lineSpacing : 0;
    const availableHeight = Math.max(
      0,
      panelHeight - (textY - panelY) - paddingY - labelSpace
    );
    if (availableHeight === 0) return;
    const thumbWidth = maxTextWidth;
    const thumbHeight = Math.max(
      imageRefHeight,
      Math.min(availableHeight, thumbWidth)
    );
    const imgX = panelX + (panelWidth - thumbWidth) / 2;
    const imgY = textY;

    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = thumbWidth;
    thumbCanvas.height = thumbHeight;
    const thumbCtx = thumbCanvas.getContext("2d");
    if (thumbCtx) {
      thumbCtx.clearRect(0, 0, thumbWidth, thumbHeight);
      drawImageContain(
        thumbCtx,
        imageRefImg,
        imageRefImg.naturalWidth,
        imageRefImg.naturalHeight,
        thumbWidth,
        thumbHeight
      );
    }

    layer.add(
      new KonvaLib.Image({
        x: imgX,
        y: imgY,
        width: thumbWidth,
        height: thumbHeight,
        image: thumbCanvas,
        cornerRadius: imageRefBorderRadius
      })
    );

    if (imageRefName) {
      layer.add(
        new KonvaLib.Text({
          x: imgX,
          y: imgY + thumbHeight + lineSpacing,
          text: truncateText(imageRefName, IMAGE_REF_LABEL_MAX_CHARS),
          fontSize: imageRefLabelFontSize,
          fontFamily: FONT_FAMILY,
          fill: TEXT_COLOR_SECONDARY,
          width: thumbWidth,
          align: "center"
        })
      );
    }
  }
}

export async function composeInfoRichVideo(
  options: InfoRichVideoOptions
): Promise<Blob> {
  const {
    renderVideoUrl,
    startFrame,
    endFrame,
    fps,
    projectName,
    trackName,
    engineDisplayName,
    controlType,
    prompt,
    imageRefName,
    imageRefUrl,
    onProgress
  } = options;

  let stage: Konva.Stage | null = null;
  let infoPanelStage: Konva.Stage | null = null;

  try {
    onProgress?.({ percentage: 0, stage: "loading" });

    const [
      {
        Input,
        Output,
        UrlSource,
        Mp4OutputFormat,
        BufferTarget,
        ALL_FORMATS,
        VideoSampleSink,
        CanvasSource,
        AudioSampleSink,
        AudioBufferSource
      },
      { default: KonvaLib }
    ] = await Promise.all([getMediabunny(), getKonva()]);

    const renderVideo = new Input({
      source: new UrlSource(renderVideoUrl),
      formats: ALL_FORMATS
    });

    const renderTrack = await renderVideo.getPrimaryVideoTrack();
    if (!renderTrack) {
      throw new Error("Could not load video track");
    }

    onProgress?.({ percentage: 10, stage: "processing" });

    const startTime = startFrame / fps;
    const endTime = endFrame / fps;
    const duration = endTime - startTime;
    const totalFrames = Math.ceil(duration * fps);

    const videoWidth = renderTrack.displayWidth;
    const videoHeight = renderTrack.displayHeight;
    const squareSize = Math.max(videoWidth, videoHeight);
    const infoPanelWidth = Math.max(
      Math.round(squareSize * INFO_PANEL_WIDTH_RATIO),
      INFO_PANEL_MIN_WIDTH
    );
    const videoAreaWidth = Math.max(
      squareSize - infoPanelWidth,
      Math.round(squareSize * VIDEO_AREA_MIN_RATIO)
    );
    const canvasWidth = videoAreaWidth + infoPanelWidth;
    const canvasHeight = squareSize;
    const scaleFactor = squareSize / REFERENCE_WIDTH;
    const textScaleFactor = Math.min(scaleFactor, 1.0);
    const videoScale = Math.min(
      videoAreaWidth / videoWidth,
      canvasHeight / videoHeight
    );
    const videoDrawHeight = videoHeight * videoScale;
    const videoContentStartY = Math.round((canvasHeight - videoDrawHeight) / 2);

    await ensureLatoFont();

    let imageRefImg: HTMLImageElement | null = null;
    if (imageRefUrl) {
      try {
        imageRefImg = await loadImage(imageRefUrl);
      } catch (error) {
        console.warn("Could not load image ref thumbnail:", error);
      }
    }

    const stageResult = createKonvaStage(KonvaLib, canvasWidth, canvasHeight);
    stage = stageResult.stage;
    const layer = stageResult.layer;
    const canvas = stage.toCanvas() as HTMLCanvasElement;

    const renderSink = new VideoSampleSink(renderTrack);

    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: "in-memory" }),
      target: new BufferTarget()
    });

    const audioTrack = await renderVideo.getPrimaryAudioTrack();
    let audioSource: AudioBufferSource | null = null;
    let audioSink: AudioSampleSink | null = null;

    if (audioTrack) {
      audioSink = new AudioSampleSink(audioTrack);
      audioSource = new AudioBufferSource({
        codec: "aac",
        bitrate: 128000
      });
    }

    onProgress?.({ percentage: 20, stage: "encoding" });

    const canvasSource = new CanvasSource(canvas, {
      codec: "avc",
      bitrate: 5000000
    });

    output.addVideoTrack(canvasSource);

    if (audioSource) {
      output.addAudioTrack(audioSource);
    }

    await output.start();

    if (audioSink && audioSource) {
      for await (const sample of audioSink.samples(0, duration)) {
        const audioBuffer = sample.toAudioBuffer();
        await audioSource.add(audioBuffer);
        if (typeof sample.close === "function") {
          sample.close();
        }
      }
    }

    const videoCanvas = document.createElement("canvas");
    videoCanvas.width = videoAreaWidth;
    videoCanvas.height = canvasHeight;
    const videoCtx = videoCanvas.getContext("2d");

    const infoPanelStageResult = createKonvaStage(
      KonvaLib,
      infoPanelWidth,
      canvasHeight
    );
    infoPanelStage = infoPanelStageResult.stage;
    const infoPanelLayer = infoPanelStageResult.layer;
    infoPanelLayer.add(
      new KonvaLib.Rect({
        x: 0,
        y: 0,
        width: infoPanelWidth,
        height: canvasHeight,
        fill: INFO_PANEL_BG_COLOR
      })
    );
    addInfoPanelContent(
      KonvaLib,
      infoPanelLayer,
      0,
      0,
      infoPanelWidth,
      canvasHeight,
      scaleFactor,
      textScaleFactor,
      videoContentStartY,
      {
        projectName,
        trackName,
        engineDisplayName,
        controlType,
        prompt,
        imageRefImg,
        imageRefName
      }
    );
    infoPanelLayer.draw();
    const infoPanelCanvas = infoPanelStage.toCanvas() as HTMLCanvasElement;

    const timecodeFontSize = Math.round(
      REF_TIMECODE_FONT_SIZE * textScaleFactor
    );
    const timecodePadH = Math.round(REF_TIMECODE_PAD_H * scaleFactor);
    const timecodePadV = Math.round(REF_TIMECODE_PAD_V * scaleFactor);
    const timecodeMargin = Math.round(REF_TIMECODE_MARGIN * scaleFactor);
    const timecodeBorderRadius = Math.round(
      REF_TIMECODE_BORDER_RADIUS * scaleFactor
    );

    let framesProcessed = 0;
    const updateProgress = () => {
      const encProgress = Math.min(
        PROGRESS_START + (framesProcessed / totalFrames) * PROGRESS_RANGE,
        PROGRESS_MAX
      );
      onProgress?.({ percentage: Math.round(encProgress), stage: "encoding" });
    };

    for (let i = 0; i < totalFrames; i++) {
      const renderTimestamp = i / fps;
      const currentTimeSeconds = startTime + i / fps;

      const renderSample = await renderSink.getSample(renderTimestamp);
      if (!renderSample) {
        console.warn(`Missing frame at timestamp ${renderTimestamp}`);
        continue;
      }

      let renderFrame = null;
      try {
        renderFrame = renderSample.toVideoFrame();

        layer.destroyChildren();

        layer.add(
          new KonvaLib.Rect({
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
            fill: "#000000"
          })
        );

        if (videoCtx) {
          videoCtx.clearRect(0, 0, videoAreaWidth, canvasHeight);
          drawImageContain(
            videoCtx,
            renderFrame,
            videoWidth,
            videoHeight,
            videoAreaWidth,
            canvasHeight
          );
        }

        layer.add(
          new KonvaLib.Image({
            x: 0,
            y: 0,
            width: videoAreaWidth,
            height: canvasHeight,
            image: videoCanvas
          })
        );

        layer.add(
          new KonvaLib.Image({
            x: videoAreaWidth,
            y: 0,
            width: infoPanelWidth,
            height: canvasHeight,
            image: infoPanelCanvas
          })
        );

        const timecodeText = formatTimecode(currentTimeSeconds, startFrame + i);
        const tempTimecodeText = new KonvaLib.Text({
          text: timecodeText,
          fontSize: timecodeFontSize,
          fontFamily: FONT_FAMILY
        });
        const tcWidth = tempTimecodeText.width();

        layer.add(
          new KonvaLib.Rect({
            x: timecodeMargin,
            y: timecodeMargin,
            width: tcWidth + timecodePadH * 2,
            height: timecodeFontSize + timecodePadV * 2,
            fill: TIMECODE_BG_COLOR,
            cornerRadius: timecodeBorderRadius
          })
        );

        layer.add(
          new KonvaLib.Text({
            x: timecodeMargin + timecodePadH,
            y: timecodeMargin + timecodePadV,
            text: timecodeText,
            fontSize: timecodeFontSize,
            fontFamily: FONT_FAMILY,
            fill: TEXT_COLOR
          })
        );

        layer.draw();

        const ctx = canvas.getContext("2d");
        if (ctx) {
          const konvaCanvas = stage.toCanvas();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(konvaCanvas, 0, 0);
        }

        const frameDuration = 1 / fps;
        await canvasSource.add(renderTimestamp, frameDuration);

        framesProcessed++;
        if (framesProcessed % PROGRESS_UPDATE_INTERVAL === 0) {
          updateProgress();
        }
      } finally {
        if (renderFrame) {
          renderFrame.close();
        }
        if (renderSample && typeof renderSample.close === "function") {
          renderSample.close();
        }
      }
    }

    onProgress?.({ percentage: 95, stage: "finalizing" });

    await output.finalize();

    const resultBuffer = (output.target as BufferTarget).buffer;
    if (!resultBuffer) {
      throw new Error("Failed to generate output buffer");
    }

    onProgress?.({ percentage: 100, stage: "finalizing" });

    return new Blob([resultBuffer], { type: "video/mp4" });
  } catch (error) {
    console.error("Error composing info-rich video:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to compose info-rich video");
  } finally {
    if (infoPanelStage) {
      infoPanelStage.destroy();
    }
    if (stage) {
      stage.destroy();
    }
  }
}
