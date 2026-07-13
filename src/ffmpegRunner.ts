import { runCli, type CliResult } from "./cliRunner.js";

function getFfmpegExecutable(): string {
  const executable = process.env.FFMPEG_PATH;

  if (!executable) {
    throw new Error(
      "FFMPEG_PATH is not configured. Set it to the ffmpeg executable path."
    );
  }

  return executable;
}

export async function runFfmpeg(
  args: readonly string[]
): Promise<CliResult> {
  return runCli(getFfmpegExecutable(), args);
}