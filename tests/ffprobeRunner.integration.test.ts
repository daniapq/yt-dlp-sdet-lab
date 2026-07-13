import { describe, expect, test } from "vitest";
import {
  probeMedia,
  runFfprobe
} from "../src/ffprobeRunner.js";

describe("ffprobe CLI contract", () => {
  test("returns version information", async () => {
    const result = await runFfprobe(["-version"]);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.stdout).toContain("ffprobe version");
    expect(result.stderr).toBe("");
  });

  test("fails for a nonexistent media file", async () => {
    const result = await runFfprobe([
      "-v",
      "error",
      "file-that-does-not-exist.mp4"
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.failed).toBe(true);
    expect(result.stderr).not.toBe("");
  });

  test("returns no media metadata when probing fails", async () => {
    const result = await probeMedia(
      "file-that-does-not-exist.mp4"
    );

    expect(result.execution.exitCode).not.toBe(0);
    expect(result.execution.failed).toBe(true);
    expect(result.media).toBeUndefined();
  });
});