import {
  mkdtemp,
  readFile,
  readdir,
  rm
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test
} from "vitest";
import { runFfmpeg } from "../src/ffmpegRunner.js";

let temporaryDirectory: string;
let manifestPath: string;

describe("synthetic HLS fixture", () => {
  beforeAll(async () => {
    temporaryDirectory = await mkdtemp(
      join(tmpdir(), "yt-dlp-hls-")
    );

    manifestPath = join(
      temporaryDirectory,
      "manifest.m3u8"
    );
  });

  afterAll(async () => {
    await rm(temporaryDirectory, {
      recursive: true,
      force: true
    });
  });

  test(
    "generates a VOD manifest with multiple segments",
    async () => {
      const segmentTemplate = join(
        temporaryDirectory,
        "segment%03d.ts"
      );

      const generation = await runFfmpeg([
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=blue:s=320x240:r=25:d=4",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=1000:duration=4",
        "-c:v",
        "mpeg2video",
        "-g",
        "25",
        "-c:a",
        "aac",
        "-shortest",
        "-f",
        "hls",
        "-hls_time",
        "1",
        "-hls_playlist_type",
        "vod",
        "-hls_segment_filename",
        segmentTemplate,
        manifestPath
      ]);

      expect(generation.exitCode).toBe(0);
      expect(generation.failed).toBe(false);

      const files = await readdir(
        temporaryDirectory
      );

      const segments = files.filter(
        file => file.endsWith(".ts")
      );

      expect(files).toContain("manifest.m3u8");
      expect(segments.length).toBeGreaterThanOrEqual(3);

      const manifest = await readFile(
        manifestPath,
        "utf8"
      );

      expect(manifest).toContain("#EXTM3U");
      expect(manifest).toContain("#EXT-X-ENDLIST");

      for (const segment of segments) {
        expect(manifest).toContain(segment);
      }
    },
    30_000
  );
});