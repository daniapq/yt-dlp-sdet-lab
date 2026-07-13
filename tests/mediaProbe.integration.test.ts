import { describe, expect, test } from "vitest";
import { probeMedia } from "../src/ffprobeRunner.js";

const mediaTestFile = process.env.MEDIA_TEST_FILE;

describe.skipIf(!mediaTestFile)(
  "media inspection (requires MEDIA_TEST_FILE)",
  () => {
    test("validates the expected video and audio streams", async () => {
      const result = await probeMedia(mediaTestFile!);

      expect(result.execution.exitCode).toBe(0);
      expect(result.execution.failed).toBe(false);
      expect(result.media).toBeDefined();

      const videoStream = result.media?.streams.find(
        stream => stream.codec_type === "video"
      );

      const audioStream = result.media?.streams.find(
        stream => stream.codec_type === "audio"
      );

      expect(videoStream).toMatchObject({
        codec_name: "h264",
        width: 1920,
        height: 1080
      });

      expect(audioStream).toMatchObject({
        codec_name: "aac"
      });

      expect(result.media?.format.format_name).toContain("mp4");

      expect(
        Number(result.media?.format.duration)
      ).toBeGreaterThan(0);

      expect(
        Number(result.media?.format.size)
      ).toBeGreaterThan(0);
    });
  }
);