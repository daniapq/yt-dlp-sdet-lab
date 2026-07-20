export interface MediaStream {
  index: number;
  codec_name?: string;
  codec_type?: string;
  width?: number;
  height?: number;
  sample_rate?: string;
  duration?: string;
  nb_read_frames?: string;
}

export interface MediaFormat {
  format_name?: string;
  duration?: string;
  size?: string;
}

export interface MediaProbe {
  streams: MediaStream[];
  format: MediaFormat;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function parseMediaProbe(json: string): MediaProbe {
  const parsed: unknown = JSON.parse(json);

  if (!isRecord(parsed)) {
    throw new Error("ffprobe output must be a JSON object.");
  }

  if (!Array.isArray(parsed.streams)) {
    throw new Error(
      "ffprobe output must contain a streams array."
    );
  }

  if (!isRecord(parsed.format)) {
    throw new Error(
      "ffprobe output must contain a format object."
    );
  }

  return parsed as unknown as MediaProbe;
}