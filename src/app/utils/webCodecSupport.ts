export const checkWebCodecSupport = async (): Promise<boolean> => {
  if (typeof window === "undefined") {
    return false;
  }

  const hasVideoCodecs = "VideoEncoder" in window && "VideoDecoder" in window;
  const hasAudioCodecs = "AudioEncoder" in window && "AudioDecoder" in window;

  if (!hasVideoCodecs || !hasAudioCodecs) {
    return false;
  }

  try {
    const h264Config = {
      codec: "avc1.42E01E",
      width: 640,
      height: 480,
      bitrate: 1000000,
      framerate: 30
    };

    const h264Support = await (window as any).VideoEncoder.isConfigSupported(
      h264Config
    );

    if (!h264Support.supported) {
      return false;
    }

    const aacConfig = {
      codec: "mp4a.40.2",
      numberOfChannels: 2,
      sampleRate: 44100,
      bitrate: 128000
    };

    const aacSupport = await (window as any).AudioEncoder.isConfigSupported(
      aacConfig
    );

    if (!aacSupport.supported) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};
