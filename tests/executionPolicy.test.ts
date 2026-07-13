import { describe, expect, test } from "vitest";
import {
  classifyExecution,
  type ExecutionStatus,
  type ExecutionSummary
} from "../src/policies/executionPolicy.js";

interface Scenario {
  name: string;
  summary: ExecutionSummary;
  expected: ExecutionStatus;
}

const scenarios: Scenario[] = [
  {
    name: "complete success",
    summary: {
      exitCode: 0,
      completedItems: 1,
      failedItems: 0,
      skippedFragments: 0
    },
    expected: "SUCCESS"
  },
  {
    name: "success with a skipped fragment",
    summary: {
      exitCode: 0,
      completedItems: 1,
      failedItems: 0,
      skippedFragments: 1
    },
    expected: "SUCCESS_WITH_DEGRADATION"
  },
  {
    name: "partial success in a batch",
    summary: {
      exitCode: 1,
      completedItems: 1,
      failedItems: 1,
      skippedFragments: 0
    },
    expected: "PARTIAL_SUCCESS"
  },
  {
    name: "total functional failure",
    summary: {
      exitCode: 1,
      completedItems: 0,
      failedItems: 1,
      skippedFragments: 0
    },
    expected: "FAILED"
  },
  {
    name: "process did not produce an exit code",
    summary: {
      exitCode: undefined,
      completedItems: 0,
      failedItems: 0,
      skippedFragments: 0
    },
    expected: "INFRASTRUCTURE_ERROR"
  },
  {
    name: "partial success takes priority over degradation",
    summary: {
      exitCode: 1,
      completedItems: 1,
      failedItems: 1,
      skippedFragments: 1
    },
    expected: "PARTIAL_SUCCESS"
  }
];

describe("classifyExecution", () => {
  test.each(scenarios)(
    "$name",
    ({ summary, expected }) => {
      expect(classifyExecution(summary)).toBe(expected);
    }
  );
});