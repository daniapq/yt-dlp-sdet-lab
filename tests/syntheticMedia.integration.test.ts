import {
  mkdtemp,
  rm
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { runFfmpeg } from "../src/ffmpegRunner.js";
import { probeMedia } from "../src/ffprobeRunner.js";

let temporaryDirectory: string;
let outputFile: string;

describe("synthetic media pipeline", () => {
  beforeAll(async () => {
    temporaryDirectory = await mkdtemp(
      join(tmpdir(), "yt-dlp-sdet-")
    );

    outputFile = join(
      temporaryDirectory,
      "synthetic.mp4"
    );
  });

  afterAll(async () => {
    await rm(temporaryDirectory, {
      recursive: true,
      force: true
    });
  });

  test(
    "generates and validates synthetic video and audio",
    async () => {
      const generation = await runFfmpeg([
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=blue:s=320x240:d=1",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=1000:duration=1",
        "-c:v",
        "mpeg4",
        "-c:a",
        "aac",
        "-shortest",
        outputFile
      ]);

      expect(generation.exitCode).toBe(0);
      expect(generation.failed).toBe(false);

      const probe = await probeMedia(outputFile);

      expect(probe.execution.exitCode).toBe(0);
      expect(probe.media).toBeDefined();

      const videoStream = probe.media?.streams.find(
        stream => stream.codec_type === "video"
      );

      const audioStream = probe.media?.streams.find(
        stream => stream.codec_type === "audio"
      );

      expect(videoStream).toMatchObject({
        codec_name: "mpeg4",
        width: 320,
        height: 240
      });

      expect(audioStream).toMatchObject({
        codec_name: "aac"
      });

      expect(probe.media?.format.format_name).toContain(
        "mp4"
      );

      const duration = Number(
        probe.media?.format.duration
      );

      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThanOrEqual(1.1);
    },
    30_000
  );
});