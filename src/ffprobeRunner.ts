import { runCli, type CliResult } from "./cliRunner.js";
import { parseMediaProbe, type MediaProbe } from "./mediaProbe.js";

function getFfprobeExecutable(): string {
  const executable = process.env.FFPROBE_PATH;

  if (!executable) {
    throw new Error(
      "FFPROBE_PATH is not configured. Set it to the ffprobe executable path."
    );
  }

  return executable;
}

export interface ProbeResult {
  execution: CliResult;
  media?: MediaProbe;
}

export interface ProbeMediaOptions {
  countFrames?: boolean;
}

export async function runFfprobe(
  args: readonly string[]
): Promise<CliResult> {
  return runCli(getFfprobeExecutable(), args);
}

export async function probeMedia(
  filePath: string,
  options: ProbeMediaOptions = {}
): Promise<ProbeResult> {
  const args: string[] = [
    "-v",
    "error"
  ];

  if (options.countFrames) {
    args.push("-count_frames");
  }

  args.push(
    "-show_entries",
    "format=format_name,duration,size",
    "-show_entries",
    "stream=index,codec_type,codec_name,width,height,sample_rate,duration,nb_read_frames",
    "-of",
    "json",
    filePath
  );

  const execution = await runFfprobe(args);

  if (execution.exitCode !== 0) {
    return { execution };
  }

  return {
    execution,
    media: parseMediaProbe(execution.stdout)
  };
}