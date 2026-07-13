import { describe, expect, test } from "vitest";
import { runYtDlp } from "../src/ytDlpRunner.js";

describe("yt-dlp CLI contract", () => {
  test("returns its version through stdout", async () => {
    const result = await runYtDlp(["--version"]);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.stdout).toMatch(/\d{4}\.\d{2}\.\d{2}/);
    expect(result.stderr).toBe("");
  });

  test("rejects an unknown command-line option", async () => {
    const result = await runYtDlp([
      "--this-option-does-not-exist"
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.failed).toBe(true);
    expect(result.stderr).toContain(
      "no such option"
    );
  });
});