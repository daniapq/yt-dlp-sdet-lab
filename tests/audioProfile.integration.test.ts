import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { runYtDlp } from "../src/ytDlpRunner.js";

const testUrl = process.env.YT_DLP_TEST_URL;
const audioConfig = resolve("configs/audio.conf");

describe.skipIf(!testUrl)(
  "audio profile (requires YT_DLP_TEST_URL)",
  () => {
    test(
      "selects an M4A source with an MP4A audio codec",
      async () => {
        const result = await runYtDlp([
          "--ignore-config",
          "--config-locations",
          audioConfig,
          "--print",
          "%(format_id)s|%(ext)s|%(acodec)s",
          testUrl!
        ]);

        const selection = result.stdout
          .trim()
          .split(/\r?\n/)
          .at(-1);

        const [formatId, extension, audioCodec] =
          selection?.split("|") ?? [];

        expect(result.exitCode).toBe(0);
        expect(result.failed).toBe(false);
        expect(formatId).toBe("140");
        expect(extension).toBe("m4a");
        expect(audioCodec).toMatch(/^mp4a/);
      },
      60_000
    );
  }
);