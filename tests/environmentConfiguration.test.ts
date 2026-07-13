import {
  afterEach,
  describe,
  expect,
  test,
  vi
} from "vitest";
import { runFfmpeg } from "../src/ffmpegRunner.js";
import { runFfprobe } from "../src/ffprobeRunner.js";
import { runYtDlp } from "../src/ytDlpRunner.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("executable path configuration", () => {
  test("rejects yt-dlp execution when YT_DLP_PATH is missing", async () => {
    vi.stubEnv("YT_DLP_PATH", "");

    await expect(
      runYtDlp(["--version"])
    ).rejects.toThrow(
      "YT_DLP_PATH is not configured"
    );
  });

  test("rejects FFmpeg execution when FFMPEG_PATH is missing", async () => {
    vi.stubEnv("FFMPEG_PATH", "");

    await expect(
      runFfmpeg(["-version"])
    ).rejects.toThrow(
      "FFMPEG_PATH is not configured"
    );
  });

  test("rejects ffprobe execution when FFPROBE_PATH is missing", async () => {
    vi.stubEnv("FFPROBE_PATH", "");

    await expect(
      runFfprobe(["-version"])
    ).rejects.toThrow(
      "FFPROBE_PATH is not configured"
    );
  });
});