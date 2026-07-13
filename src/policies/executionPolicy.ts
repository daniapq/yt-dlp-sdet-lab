export type ExecutionStatus =
  | "SUCCESS"
  | "SUCCESS_WITH_DEGRADATION"
  | "PARTIAL_SUCCESS"
  | "FAILED"
  | "INFRASTRUCTURE_ERROR";

export interface ExecutionSummary {
  exitCode: number | undefined;
  completedItems: number;
  failedItems: number;
  skippedFragments: number;
}

export function classifyExecution(
  summary: ExecutionSummary
): ExecutionStatus {
  if (summary.exitCode === undefined) {
    return "INFRASTRUCTURE_ERROR";
  }

  if (
    summary.completedItems > 0 &&
    summary.failedItems > 0
  ) {
    return "PARTIAL_SUCCESS";
  }

  if (
    summary.exitCode === 0 &&
    summary.skippedFragments > 0
  ) {
    return "SUCCESS_WITH_DEGRADATION";
  }

  if (
    summary.exitCode === 0 &&
    summary.failedItems === 0
  ) {
    return "SUCCESS";
  }

  return "FAILED";
}