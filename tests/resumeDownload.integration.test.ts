import { createHash } from "node:crypto";
import {
  access,
  mkdtemp,
  readFile,
  rm,
  writeFile
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
import { runYtDlp } from "../src/ytDlpRunner.js";
import {
  startRangeServer,
  type RangeServer
} from "./support/rangeServer.js";

let temporaryDirectory: string;
let sourceFile: string;
let outputFile: string;
let partialFile: string;
let sourceContents: Buffer;
let partialSize: number;
let server: RangeServer;

describe("resumable HTTP download", () => {
  beforeAll(async () => {
    temporaryDirectory = await mkdtemp(
      join(tmpdir(), "yt-dlp-resume-")
    );

    sourceFile = join(
      temporaryDirectory,
      "source.mp4"
    );

    outputFile = join(
      temporaryDirectory,
      "downloaded.mp4"
    );

    partialFile = `${outputFile}.part`;

    const generation = await runFfmpeg([
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=blue:s=640x360:r=25:d=5",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=1000:duration=5",
      "-c:v",
      "mpeg4",
      "-c:a",
      "aac",
      "-shortest",
      sourceFile
    ]);

    if (generation.exitCode !== 0) {
      throw new Error(
        `Unable to generate source media: ${generation.stderr}`
      );
    }

    sourceContents = await readFile(sourceFile);
    partialSize = Math.floor(sourceContents.length / 2);

    await writeFile(
      partialFile,
      sourceContents.subarray(0, partialSize)
    );

    server = await startRangeServer(sourceFile);
  });

  afterAll(async () => {
    await server?.close();

    await rm(temporaryDirectory, {
      recursive: true,
      force: true
    });
  });

  test(
    "requests only the remaining bytes and reconstructs the file",
    async () => {
      const result = await runYtDlp([
        "--ignore-config",
        "--continue",
        "--part",
        "--output",
        outputFile,
        server.url
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.failed).toBe(false);

      await expect(
        access(outputFile)
      ).resolves.toBeUndefined();

      await expect(
        access(partialFile)
      ).rejects.toThrow();

      expect(server.rangeRequests).toContain(
        `bytes=${partialSize}-`
      );

      const downloadedContents =
        await readFile(outputFile);

      expect(hash(downloadedContents)).toBe(
        hash(sourceContents)
      );
    },
    60_000
  );
});

function hash(contents: Buffer): string {
  return createHash("sha256")
    .update(contents)
    .digest("hex");
}