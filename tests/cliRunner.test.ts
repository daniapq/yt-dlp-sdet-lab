import { describe, expect, test } from "vitest";
import { runCli } from "../src/cliRunner.js";

describe("runCli", () => {
  test("captures stdout from a successful process", async () => {
    const result = await runCli(process.execPath, [
      "-e",
      'console.log("hello from CLI")'
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.stdout).toBe("hello from CLI");
    expect(result.stderr).toBe("");
  });

  test("captures stderr and exit code from a failed process", async () => {
    const result = await runCli(process.execPath, [
      "-e",
      'console.error("controlled failure"); process.exit(7)'
    ]);

    expect(result.exitCode).toBe(7);
    expect(result.failed).toBe(true);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("controlled failure");
  });
});