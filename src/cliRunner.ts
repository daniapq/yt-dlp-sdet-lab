import { execa } from "execa";

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number | undefined;
  failed: boolean;
}

export async function runCli(
  executable: string,
  args: readonly string[]
): Promise<CliResult> {
  const result = await execa(executable, args, {
    reject: false,
    shell: false
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    failed: result.failed
  };
}