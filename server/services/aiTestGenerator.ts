/**
 * Typed entry point for the TestPilot AI generator.
 * The backend is CommonJS; runtime implementation lives in aiTestGenerator.js.
 */
export type TestFramework = "jest" | "vitest";
export type SuiteType = "unit" | "integration" | "e2e";
export interface GenerationMetadata {
  framework: TestFramework;
  suiteType: SuiteType;
  target: { method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "UI"; path: string };
  useCase?: unknown;
  uiSchema?: unknown;
  apiContract?: unknown;
  edgeCases?: string[];
}
export interface AssertionRecord {
  id: string;
  title: string;
  category: "Edge Case" | "Happy Path" | "Security";
  expected: string;
  actual: "Not executed";
}
export interface GeneratedSuite {
  framework: TestFramework;
  suiteType: SuiteType;
  filename: string;
  code: string;
  assertionMap: AssertionRecord[];
  reviewed: false;
  executionStatus: "NOT_RUN";
  warning: string;
}
const implementation = require("./aiTestGenerator.js") as {
  generateTests: (input: GenerationMetadata) => Promise<GeneratedSuite>;
};
export const generateTests = implementation.generateTests;
