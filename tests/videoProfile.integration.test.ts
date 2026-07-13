import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { runYtDlp } from "../src/ytDlpRunner.js";

const testUrl = process.env.YT_DLP_TEST_URL;
const videoConfig = resolve("configs/video.conf");

describe.skipIf(!testUrl)("video profile (requires YT_DLP_TEST_URL)", () => {
  test("selects H.264 video and AAC audio for the controlled video", async () => {
      const result = await runYtDlp([
        "--ignore-config",
        "--config-locations",
        videoConfig,
        "--print",
        "%(format_id)s",
        testUrl!
      ]);

      const selectedFormat = result.stdout
        .trim()
        .split(/\r?\n/)
        .at(-1);

      expect(result.exitCode).toBe(0);
      expect(result.failed).toBe(false);
      expect(selectedFormat).toBe("137+140");
    },
    60_000
  );
});