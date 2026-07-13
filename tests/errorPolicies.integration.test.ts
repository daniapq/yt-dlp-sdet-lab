import { describe, expect, test } from "vitest";
import { runYtDlp } from "../src/ytDlpRunner.js";

const testUrl = process.env.YT_DLP_TEST_URL;
const invalidUrl =
  "https://www.youtube.com/watch?v=invalid1234";

describe("error policies", () => {
  test(
    "reports a total failure for an unavailable video",
    async () => {
      const result = await runYtDlp([
        "--ignore-config",
        "--js-runtime",
        "node",
        "--simulate",
        invalidUrl
      ]);

      expect(result.exitCode).not.toBe(0);
      expect(result.failed).toBe(true);
      expect(result.stderr).toContain("ERROR");
    },
    60_000
  );

  describe.skipIf(!testUrl)(
    "partial success (requires YT_DLP_TEST_URL)",
    () => {
      test(
        "continues after one entry fails but preserves the global failure",
        async () => {
          const result = await runYtDlp([
            "--ignore-config",
            "--js-runtime",
            "node",
            "--ignore-errors",
            "--simulate",
            "--print",
            "PROCESSED:%(id)s",
            invalidUrl,
            testUrl!
          ]);

          expect(result.stdout).toContain("PROCESSED:");
          expect(result.stderr).toContain("ERROR");
          expect(result.exitCode).toBe(1);
          expect(result.failed).toBe(true);
        },
        90_000
      );
    }
  );
});