import type Konva from "konva";
import type {
  BufferTarget,
  AudioBufferSource,
  AudioSampleSink
} from "mediabunny";

import { getKonva, getMediabunny } from "./lazyLoad";
import { SbsVideoOptions } from "./types";

const SBS_PROGRESS_START = 20;
const SBS_PROGRESS_RANGE = 70;
const SBS_PROGRESS_MAX = 90;
const SBS_PROGRESS_UPDATE_INTERVAL = 10;

const BORDER_RADIUS = 40;
const LOGO_WIDTH = 292;
const LOGO_HEIGHT = 81;
const LOGO_MARGIN_FROM_VIDEO_LEFT = 90;
const LOGO_MARGIN_FROM_VIDEO_TOP = 60;
const TEXT_PILL_PADDING_HORIZONTAL = 40;
const TEXT_PILL_PADDING_VERTICAL = 33;
const TEXT_PILL_BG_COLOR = "#242428";
const TEXT_PILL_BORDER_RADIUS = 60;
const TEXT_FONT_SIZE = 40;
const TEXT_FONT_FAMILY = "Lato, sans-serif";
const TEXT_COLOR = "#FFFFFF";
const TEXT_PILL_MARGIN_FROM_VIDEO_TOP = 48;
const TEXT_PILL_MARGIN_FROM_CANVAS_RIGHT = 90;

const HORIZONTAL_VIDEO_WIDTH = 981;
const HORIZONTAL_VIDEO_HEIGHT = 599;
const HORIZONTAL_TOP_X = 12;
const HORIZONTAL_TOP_Y = 448;
const HORIZONTAL_BOTTOM_X = 87;
const HORIZONTAL_BOTTOM_Y = 1059;

const VERTICAL_VIDEO_WIDTH = 522;
const VERTICAL_VIDEO_HEIGHT = 959;
const VERTICAL_LEFT_X = 12;
const VERTICAL_LEFT_Y = 501;
const VERTICAL_RIGHT_X = 546;
const VERTICAL_RIGHT_Y = 709;

type DrawCoverParams = {
  ctx: CanvasRenderingContext2D;
  image: CanvasImageSource;
  srcWidth: number;
  srcHeight: number;
  destWidth: number;
  destHeight: number;
};

function drawImageCover({
  ctx,
  image,
  srcWidth,
  srcHeight,
  destWidth,
  destHeight
}: DrawCoverParams) {
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

  const scale = Math.max(destWidth / srcWidth, destHeight / srcHeight);
  const cropWidth = destWidth / scale;
  const cropHeight = destHeight / scale;
  const sx = (srcWidth - cropWidth) / 2;
  const sy = (srcHeight - cropHeight) / 2;

  ctx.drawImage(
    image,
    sx,
    sy,
    cropWidth,
    cropHeight,
    0,
    0,
    destWidth,
    destHeight
  );
}

function createKonvaStage(
  KonvaLib: typeof Konva,
  width: number,
  height: number
): { stage: Konva.Stage; layer: Konva.Layer } {
  const container = document.createElement("div");

  const stage = new KonvaLib.Stage({
    container,
    width,
    height
  });

  const layer = new KonvaLib.Layer();
  stage.add(layer);

  return { stage, layer };
}

const MAGO_LOGO_SVG = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="292" height="81" viewBox="0 0 292 81" fill="none">
<path d="M1.58432 0L42.6222 28.6393H42.6275L39.864 1.9497L41.8796 1.4976L55.1831 32.9265L70.6772 17.5784L72.2314 18.5372L64.052 38.9077L80.928 34.3374L81.7342 36.0288L68.4308 47.7081L81.5618 54.3104L81.1587 56.2279L63.0734 56.454L72.6929 69.9963L71.4835 71.2382L51.0934 62.0975L42.3385 81L40.4368 80.6622L39.803 58.8262L12.7903 66.3872L11.9257 64.5243L35.4242 49.8543L0.00139321 39.3598L0.404529 37.554L33.4642 37.8372L0 1.57573L1.58432 0Z" fill="white"/>
<path d="M112.519 60.7565V39.1213C112.519 32.003 115.293 27.9051 120.841 27.9051C126.389 27.9051 129.163 31.8903 129.163 39.1213V60.7014H136.354V39.1213C136.354 31.6622 139.128 27.9051 144.676 27.9051C150.224 27.9051 152.943 31.5495 152.943 39.1213V60.7014H160.134V40.1464C160.134 27.1081 154.867 20.9023 145.865 20.9023C140.09 20.9023 135.108 23.7496 132.787 28.8175C130.748 23.6945 127.239 20.9023 121.576 20.9023C117.613 20.9023 114.102 22.8372 112.516 25.5717V21.8697H105.326V60.7565H112.519ZM195.407 43.6177C193.368 50.8486 186.122 55.4604 180.063 55.4604C174.969 55.4604 172.192 52.2723 172.192 49.3673C172.192 46.1792 174.513 43.6177 180.118 43.6177H195.407ZM170.836 34.9631C173.272 31.3764 178.254 27.7898 183.406 27.7898C189.068 27.7898 194.22 30.6371 195.352 37.5272H180.066C171.347 37.5272 165.515 42.2517 165.515 49.3123C165.515 56.3728 170.667 61.8393 180.066 61.8393C185.955 61.8393 191.389 59.5059 195.579 55.2349V60.7014H202.373V40.5449C202.373 26.7673 193.313 21.015 183.406 21.015C176.272 21.015 169.024 25.5691 165.288 31.4341L170.836 34.9631ZM227.454 54.8364C220.375 54.8364 214.601 48.8587 214.601 41.2843C214.601 33.7098 220.375 27.7321 227.454 27.7321C234.532 27.7321 240.307 33.7098 240.307 41.2843C240.307 48.8587 234.532 54.8364 227.454 54.8364ZM216.47 63.1476L210.526 66.9046C214.035 72.4262 220.49 75.5593 227.342 75.5593C237.364 75.5593 247.214 69.1253 247.214 56.0294V21.8671H240.42V27.1055C237.476 23.3484 233.002 20.8996 227.454 20.8996C216.527 20.8996 207.806 30.0655 207.806 41.2816C207.806 52.4978 216.525 61.6636 227.454 61.6636C232.436 61.6636 237.137 59.2149 240.42 55.4578C240.193 64.0547 234.134 68.7242 227.342 68.7242C222.133 68.7242 218.566 65.9923 216.47 63.145V63.1476ZM272.352 61.6663C283.279 61.6663 292 52.5004 292 41.2843C292 30.0681 283.282 20.9023 272.352 20.9023C261.423 20.9023 252.705 30.0681 252.705 41.2843C252.705 52.5004 261.423 61.6663 272.352 61.6663ZM272.352 54.8364C265.274 54.8364 259.499 48.8587 259.499 41.2843C259.499 33.7098 265.274 27.7321 272.352 27.7321C279.431 27.7321 285.206 33.7098 285.206 41.2843C285.206 48.8587 279.431 54.8364 272.352 54.8364Z" fill="white"/>
</svg>`)}`;

async function loadMagoLogo(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load logo"));
    img.src = MAGO_LOGO_SVG;
  });
}

async function ensureLatoFont(): Promise<void> {
  try {
    if (typeof FontFace !== "undefined" && document.fonts) {
      const latoFont = new FontFace(
        "Lato",
        "url(https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXiWtFCc.woff2)",
        { weight: "400", style: "normal" }
      );

      await latoFont.load();
      document.fonts.add(latoFont);

      await document.fonts.load(`${TEXT_FONT_SIZE}px "Lato"`);

      await document.fonts.ready;
    }
  } catch (error) {
    console.warn(
      "Could not load Lato font, falling back to system font:",
      error
    );
  }
}

export async function composeSbsVideo(options: SbsVideoOptions): Promise<Blob> {
  const {
    inputVideoUrl,
    renderVideoUrl,
    startFrame,
    endFrame,
    fps,
    onProgress
  } = options;

  let stage: Konva.Stage | null = null;

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

    const inputVideo = new Input({
      source: new UrlSource(inputVideoUrl),
      formats: ALL_FORMATS
    });

    const renderVideo = new Input({
      source: new UrlSource(renderVideoUrl),
      formats: ALL_FORMATS
    });

    const [inputTrack, renderTrack] = await Promise.all([
      inputVideo.getPrimaryVideoTrack(),
      renderVideo.getPrimaryVideoTrack()
    ]);

    if (!inputTrack || !renderTrack) {
      throw new Error("Could not load video tracks");
    }

    onProgress?.({ percentage: 10, stage: "processing" });

    const startTime = startFrame / fps;
    const endTime = endFrame / fps;
    const duration = endTime - startTime;
    const totalFrames = Math.ceil(duration * fps);

    const targetWidth = 1080;
    const targetHeight = 1920;

    const isHorizontalVideo =
      inputTrack.displayWidth >= inputTrack.displayHeight;

    let videoWidth: number;
    let videoHeight: number;
    let topVideoX: number;
    let topVideoY: number;
    let bottomVideoX: number;
    let bottomVideoY: number;

    if (isHorizontalVideo) {
      videoWidth = HORIZONTAL_VIDEO_WIDTH;
      videoHeight = HORIZONTAL_VIDEO_HEIGHT;
      topVideoX = HORIZONTAL_TOP_X;
      topVideoY = HORIZONTAL_TOP_Y;
      bottomVideoX = HORIZONTAL_BOTTOM_X;
      bottomVideoY = HORIZONTAL_BOTTOM_Y;
    } else {
      videoWidth = VERTICAL_VIDEO_WIDTH;
      videoHeight = VERTICAL_VIDEO_HEIGHT;
      topVideoX = VERTICAL_LEFT_X;
      topVideoY = VERTICAL_LEFT_Y;
      bottomVideoX = VERTICAL_RIGHT_X;
      bottomVideoY = VERTICAL_RIGHT_Y;
    }

    const stageResult = createKonvaStage(KonvaLib, targetWidth, targetHeight);
    stage = stageResult.stage;
    const layer = stageResult.layer;

    await ensureLatoFont();

    const canvas = stage.toCanvas() as HTMLCanvasElement;

    const inputSink = new VideoSampleSink(inputTrack);
    const renderSink = new VideoSampleSink(renderTrack);

    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: "in-memory" }),
      target: new BufferTarget()
    });

    const audioTrack = await inputVideo.getPrimaryAudioTrack();
    let audioSource: AudioBufferSource | null = null;
    let audioSink: AudioSampleSink | null = null;

    if (audioTrack) {
      audioSink = new AudioSampleSink(audioTrack);
      audioSource = new AudioBufferSource({
        codec: "aac",
        bitrate: 128000
      });
    }

    let logoImage: HTMLImageElement | null = null;
    try {
      logoImage = await loadMagoLogo();
    } catch (error) {
      console.warn("Could not load logo:", error);
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
      for await (const sample of audioSink.samples(startTime, endTime)) {
        const audioBuffer = sample.toAudioBuffer();
        await audioSource.add(audioBuffer);
        if (typeof sample.close === "function") {
          sample.close();
        }
      }
    }

    let framesProcessed = 0;
    const updateProgress = () => {
      const encProgress = Math.min(
        SBS_PROGRESS_START +
          (framesProcessed / totalFrames) * SBS_PROGRESS_RANGE,
        SBS_PROGRESS_MAX
      );
      onProgress?.({
        percentage: Math.round(encProgress),
        stage: "encoding"
      });
    };

    for (let i = 0; i < totalFrames; i++) {
      const inputTimestamp = startTime + i / fps;
      const renderTimestamp = i / fps;

      const [inputSample, renderSample] = await Promise.all([
        inputSink.getSample(inputTimestamp),
        renderSink.getSample(renderTimestamp)
      ]);

      if (!inputSample || !renderSample) {
        console.warn(`Missing frame at input timestamp ${inputTimestamp}`);
        continue;
      }

      let inputFrame = null;
      let renderFrame = null;

      try {
        inputFrame = inputSample.toVideoFrame();
        renderFrame = renderSample.toVideoFrame();

        layer.destroyChildren();

        const background = new KonvaLib.Rect({
          x: 0,
          y: 0,
          width: targetWidth,
          height: targetHeight,
          fill: "#000000"
        });
        layer.add(background);

        const topVideoCanvas = document.createElement("canvas");
        topVideoCanvas.width = videoWidth;
        topVideoCanvas.height = videoHeight;
        const topCtx = topVideoCanvas.getContext("2d");
        if (topCtx) {
          topCtx.clearRect(0, 0, videoWidth, videoHeight);
          drawImageCover({
            ctx: topCtx,
            image: renderFrame,
            srcWidth: renderTrack.displayWidth,
            srcHeight: renderTrack.displayHeight,
            destWidth: videoWidth,
            destHeight: videoHeight
          });
        }

        const topVideo = new KonvaLib.Image({
          x: topVideoX,
          y: topVideoY,
          width: videoWidth,
          height: videoHeight,
          image: topVideoCanvas,
          cornerRadius: BORDER_RADIUS
        });
        layer.add(topVideo);

        const bottomVideoCanvas = document.createElement("canvas");
        bottomVideoCanvas.width = videoWidth;
        bottomVideoCanvas.height = videoHeight;
        const bottomCtx = bottomVideoCanvas.getContext("2d");
        if (bottomCtx) {
          bottomCtx.clearRect(0, 0, videoWidth, videoHeight);
          drawImageCover({
            ctx: bottomCtx,
            image: inputFrame,
            srcWidth: inputTrack.displayWidth,
            srcHeight: inputTrack.displayHeight,
            destWidth: videoWidth,
            destHeight: videoHeight
          });
        }

        const bottomVideo = new KonvaLib.Image({
          x: bottomVideoX,
          y: bottomVideoY,
          width: videoWidth,
          height: videoHeight,
          image: bottomVideoCanvas,
          cornerRadius: BORDER_RADIUS
        });
        layer.add(bottomVideo);

        if (logoImage) {
          const logoX = topVideoX + LOGO_MARGIN_FROM_VIDEO_LEFT;
          const logoY = topVideoY - LOGO_MARGIN_FROM_VIDEO_TOP - LOGO_HEIGHT;
          const logo = new KonvaLib.Image({
            x: logoX,
            y: logoY,
            width: LOGO_WIDTH,
            height: LOGO_HEIGHT,
            image: logoImage
          });
          layer.add(logo);
        }

        const text = "mago.studio";

        const tempText = new KonvaLib.Text({
          text,
          fontSize: TEXT_FONT_SIZE,
          fontFamily: TEXT_FONT_FAMILY,
          fontStyle: "normal"
        });
        const textWidth = tempText.width();

        const pillWidth = textWidth + TEXT_PILL_PADDING_HORIZONTAL * 2;
        const pillHeight = TEXT_FONT_SIZE + TEXT_PILL_PADDING_VERTICAL * 2;

        const pillX =
          targetWidth - TEXT_PILL_MARGIN_FROM_CANVAS_RIGHT - pillWidth;
        const pillY = topVideoY - TEXT_PILL_MARGIN_FROM_VIDEO_TOP - pillHeight;

        const pill = new KonvaLib.Rect({
          x: pillX,
          y: pillY,
          width: pillWidth,
          height: pillHeight,
          fill: TEXT_PILL_BG_COLOR,
          cornerRadius: TEXT_PILL_BORDER_RADIUS
        });
        layer.add(pill);

        const magoText = new KonvaLib.Text({
          x: pillX + TEXT_PILL_PADDING_HORIZONTAL,
          y: pillY + TEXT_PILL_PADDING_VERTICAL,
          text,
          fontSize: TEXT_FONT_SIZE,
          fontFamily: TEXT_FONT_FAMILY,
          fontStyle: "normal",
          fill: TEXT_COLOR,
          align: "center"
        });
        layer.add(magoText);

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
        if (framesProcessed % SBS_PROGRESS_UPDATE_INTERVAL === 0) {
          updateProgress();
        }
      } finally {
        if (inputFrame) {
          inputFrame.close();
        }
        if (renderFrame) {
          renderFrame.close();
        }

        if (inputSample && typeof inputSample.close === "function") {
          inputSample.close();
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
    console.error("Error composing SBS video:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to compose side-by-side video");
  } finally {
    if (stage) {
      stage.destroy();
    }
  }
}
