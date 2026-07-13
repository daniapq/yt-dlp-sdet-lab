import { runCli, type CliResult } from "./cliRunner.js";

function getYtDlpExecutable(): string {
  const executable = process.env.YT_DLP_PATH;

  if (!executable) {
    throw new Error(
      "YT_DLP_PATH is not configured. Set it to the yt-dlp executable path."
    );
  }

  return executable;
}

export async function runYtDlp(
  args: readonly string[]
): Promise<CliResult> {
  return runCli(getYtDlpExecutable(), args);
}