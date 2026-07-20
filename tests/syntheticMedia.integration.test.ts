import {
  mkdtemp,
  rm,
  access,
  stat,
  truncate
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { runFfmpeg } from "../src/ffmpegRunner.js";
import { probeMedia } from "../src/ffprobeRunner.js";
import {
  generateSyntheticMedia
} from "./support/syntheticMediaFactory.js";

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
        "sine=frequency=1000:sample_rate=48000:duration=1",
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
        codec_name: "aac",
        sample_rate: "48000"
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

  test(
    "stops the output when the shortest stream ends",
    async () => {
      const shortestOutputFile = join(
        temporaryDirectory,
        "shortest.mp4"
      );

      const generation = await runFfmpeg([
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=red:s=320x240:r=25:d=3",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=1000:sample_rate=48000:duration=1",
        "-c:v",
        "mpeg4",
        "-c:a",
        "aac",
        "-shortest",
        shortestOutputFile
      ]);

      expect(generation.exitCode).toBe(0);

      const probe = await probeMedia(shortestOutputFile);

      expect(probe.execution.exitCode).toBe(0);
      expect(probe.media).toBeDefined();

      const videoStream = probe.media?.streams.find(
        stream => stream.codec_type === "video"
      );

      const audioStream = probe.media?.streams.find(
        stream => stream.codec_type === "audio"
      );

      const videoDuration = Number(videoStream?.duration);
      const audioDuration = Number(audioStream?.duration);
      const formatDuration = Number(
        probe.media?.format.duration
      );

      expect(videoDuration).toBeGreaterThanOrEqual(0.9);
      expect(videoDuration).toBeLessThanOrEqual(1.1);

      expect(audioDuration).toBeGreaterThanOrEqual(0.9);
      expect(audioDuration).toBeLessThanOrEqual(1.1);

      expect(formatDuration).toBeGreaterThanOrEqual(0.9);
      expect(formatDuration).toBeLessThanOrEqual(1.1);
    },
    30_000
  );

  test(
    "generates a video-only fixture",
    async () => {
      const videoOnlyOutputFile = join(
        temporaryDirectory,
        "video-only.mp4"
      );

      const generation = await generateSyntheticMedia({
        outputPath: videoOnlyOutputFile,
        video: {
          source: "testsrc2",
          width: 640,
          height: 360,
          frameRate: 30,
          duration: 2,
          codec: "mpeg4"
        }
      });

      expect(generation.exitCode).toBe(0);
      expect(generation.failed).toBe(false);

      const probe = await probeMedia(
        videoOnlyOutputFile,
        { countFrames: true }
      );

      expect(probe.execution.exitCode).toBe(0);
      expect(probe.media).toBeDefined();
      expect(probe.media?.streams).toHaveLength(1);

      const videoStream = probe.media?.streams.find(
        stream => stream.codec_type === "video"
      );

      const audioStream = probe.media?.streams.find(
        stream => stream.codec_type === "audio"
      );

      expect(videoStream).toMatchObject({
        codec_name: "mpeg4",
        codec_type: "video",
        width: 640,
        height: 360
      });
      expect(videoStream?.nb_read_frames).toBe("60");

      expect(audioStream).toBeUndefined();

      const videoDuration = Number(videoStream?.duration);
      const formatDuration = Number(
        probe.media?.format.duration
      );

      expect(videoDuration).toBeGreaterThanOrEqual(1.9);
      expect(videoDuration).toBeLessThanOrEqual(2.1);

      expect(formatDuration).toBeGreaterThanOrEqual(1.9);
      expect(formatDuration).toBeLessThanOrEqual(2.1);

      expect(
        probe.media?.format.format_name
      ).toContain("mp4");
    },
    30_000
  );

  test(
    "generates an audio-only fixture",
    async () => {
      const audioOnlyOutputFile = join(
        temporaryDirectory,
        "audio-only.m4a"
      );

      const generation = await generateSyntheticMedia({
        outputPath: audioOnlyOutputFile,
        audio: {
          frequency: 440,
          sampleRate: 48000,
          duration: 2,
          codec: "aac"
        }
      });

      expect(generation.exitCode).toBe(0);
      expect(generation.failed).toBe(false);

      const probe = await probeMedia(audioOnlyOutputFile);

      expect(probe.execution.exitCode).toBe(0);
      expect(probe.media).toBeDefined();
      expect(probe.media?.streams).toHaveLength(1);

      const videoStream = probe.media?.streams.find(
        stream => stream.codec_type === "video"
      );

      const audioStream = probe.media?.streams.find(
        stream => stream.codec_type === "audio"
      );

      expect(audioStream).toMatchObject({
        codec_name: "aac",
        codec_type: "audio",
        sample_rate: "48000"
      });

      expect(videoStream).toBeUndefined();

      const audioDuration = Number(audioStream?.duration);
      const formatDuration = Number(
        probe.media?.format.duration
      );

      expect(audioDuration).toBeGreaterThanOrEqual(1.9);
      expect(audioDuration).toBeLessThanOrEqual(2.1);

      expect(formatDuration).toBeGreaterThanOrEqual(1.9);
      expect(formatDuration).toBeLessThanOrEqual(2.1);

      expect(
        probe.media?.format.format_name
      ).toContain("m4a");
    },
    30_000
  );

  test(
    "generates a WebM fixture with VP9 and Opus",
    async () => {
      const formatOutputFile = join(
        temporaryDirectory,
        "synthetic.webm"
      );

      const generation = await generateSyntheticMedia({
        outputPath: formatOutputFile,
        shortest: true,
        video: {
          source: "testsrc2",
          width: 320,
          height: 240,
          frameRate: 25,
          duration: 1,
          codec: "libvpx-vp9"
        },
        audio: {
          frequency: 440,
          sampleRate: 48000,
          duration: 1,
          codec: "libopus"
        }
      });
      expect(generation.exitCode).toBe(0);
      expect(generation.failed).toBe(false);

      const probe = await probeMedia(formatOutputFile);

      expect(probe.execution.exitCode).toBe(0);
      expect(probe.media).toBeDefined();
      expect(probe.media?.streams).toHaveLength(2);

      const videoStream = probe.media?.streams.find(
        stream => stream.codec_type === "video"
      );

      const audioStream = probe.media?.streams.find(
        stream => stream.codec_type === "audio"
      );

      expect(audioStream).toMatchObject({
        codec_name: "opus",
        codec_type: "audio",
        sample_rate: "48000"
      });

      expect(videoStream).toMatchObject({
        codec_name: "vp9",
        codec_type: "video",
        width: 320,
        height: 240
      });

      expect(
        probe.media?.format.format_name
      ).toContain("webm");

      const duration = Number(
        probe.media?.format.duration
      );

      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThanOrEqual(1.1);
    },
    30_000
  );
});