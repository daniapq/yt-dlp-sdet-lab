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
    "rejects an unavailable video codec without producing an artifact",
    async () => {
      const invalidOutputFile = join(
        temporaryDirectory,
        "invalid-codec.mp4"
      );

      const generation = await runFfmpeg([
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=blue:s=320x240:d=1",
        "-c:v codec_that_does_not_exist",
        invalidOutputFile
      ]);

      expect(generation.exitCode).not.toBe(0);
      expect(generation.failed).toBe(true);
      expect(generation.stderr).not.toBe("");
      await expect(
        access(invalidOutputFile)
      ).rejects.toMatchObject({
        code: "ENOENT"
      });
    },
    30_000
  );

  test(
    "rejects a truncated MP4 without returning media metadata",
    async () => {
      const corruptedOutputFile = join(
        temporaryDirectory,
        "corrupted.mp4"
      );

      const generation = await generateSyntheticMedia({
        outputPath: corruptedOutputFile,
        video: {
          source: "testsrc2",
          width: 320,
          height: 240,
          frameRate: 25,
          duration: 2,
          codec: "mpeg4"
        }
      });
      expect(generation.exitCode).toBe(0);
      expect(generation.failed).toBe(false);

      await truncate(corruptedOutputFile, 256);

      const corruptedFile = await stat(
        corruptedOutputFile
      );

      expect(corruptedFile.size).toBe(256);

      const probe = await probeMedia(
        corruptedOutputFile
      );

      expect(probe.execution.exitCode).not.toBe(0);
      expect(probe.execution.failed).toBe(true);
      expect(probe.media).toBeUndefined();
    },
    30_000
  );

  test(
    "rejects an incompatible WebM codec combination",
    async () => {
      const incompatibleOutputFile = join(
        temporaryDirectory,
        "synthetic.webm"
      );

      const generation = await generateSyntheticMedia({
        outputPath: incompatibleOutputFile,
        shortest: true,
        video: {
          source: "testsrc2",
          width: 320,
          height: 240,
          frameRate: 25,
          duration: 1,
          codec: "mpeg4"
        },
        audio: {
          frequency: 440,
          sampleRate: 48000,
          duration: 1,
          codec: "aac"
        }
      });
      expect(generation.exitCode).not.toBe(0);
      expect(generation.failed).toBe(true);
      expect(generation.stderr).not.toBe("");

      const probe = await probeMedia(incompatibleOutputFile);

      expect(probe.execution.exitCode).not.toBe(0);
      expect(probe.execution.failed).toBe(true);
      expect(probe.media).toBeUndefined();
    },
    30_000
  );
});