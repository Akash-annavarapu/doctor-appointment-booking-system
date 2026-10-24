const crypto = require("node:crypto");
const { verifyGitHubCI, TRUST } = require("../services/githubCiAuth");

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "testpilot-unit-key", use: "sig", alg: "RS256" };

function makeJwt(overrides = {}, key = privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: TRUST.issuer,
    aud: TRUST.audience,
    repository: TRUST.repository,
    repository_id: TRUST.repositoryId,
    ref: TRUST.ref,
    workflow_ref: TRUST.workflowRef,
    event_name: "push",
    run_id: "38610160353",
    run_attempt: "1",
    iat: now,
    exp: now + 600,
    ...overrides
  };
  const head = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: jwk.kid })).toString("base64url");
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = crypto.sign("RSA-SHA256", Buffer.from(head + "." + body), key).toString("base64url");
  return head + "." + body + "." + signature;
}
const jwksFetch = jest.fn(async () => ({ ok: true, json: async () => ({ keys: [jwk] }) }));
const runId = "38610160353:1:backend-jest";

describe("GitHub Actions report identity validation", () => {
  test("accepts cryptographically signed identity for exactly this main CI workflow", async () => {
    await expect(verifyGitHubCI(makeJwt(), runId, jwksFetch)).resolves
      .toMatchObject({ repository: TRUST.repository, runId: "38610160353" });
  });

  test("accepts only the reviewed browser workflow on main with workflow_dispatch", async () => {
    const reviewed = makeJwt({
      workflow_ref: TRUST.reviewedWorkflowRef,
      event_name: "workflow_dispatch"
    });
    await expect(verifyGitHubCI(reviewed, "38610160353:1:playwright-reviewed-story", jwksFetch))
      .resolves.toMatchObject({ repository: TRUST.repository, workflow: TRUST.reviewedWorkflowRef });
    await expect(verifyGitHubCI(makeJwt({
      workflow_ref: TRUST.reviewedWorkflowRef, event_name: "push"
    }), runId, jwksFetch)).rejects.toThrow("Invalid GitHub Actions identity");
    await expect(verifyGitHubCI(makeJwt({
      workflow_ref: TRUST.workflowRef, event_name: "workflow_dispatch"
    }), runId, jwksFetch)).rejects.toThrow("Invalid GitHub Actions identity");
    await expect(verifyGitHubCI(makeJwt({
      workflow_ref: TRUST.reviewedWorkflowRef,
      event_name: "workflow_dispatch",
      ref: "refs/heads/attacker-branch"
    }), runId, jwksFetch)).rejects.toThrow("Invalid GitHub Actions identity");
  });

  test("rejects tokens for other repositories, workflows, refs and run IDs", async () => {
    const mutations = [
      { repository: "attacker/fork" },
      { repository_id: "9999" },
      { workflow_ref: "attacker/workflow.yml@refs/heads/main" },
      { ref: "refs/heads/untrusted" },
      { aud: "wrong-audience" },
      { event_name: "pull_request" },
      { exp: Math.floor(Date.now() / 1000) - 1 },
    ];
    for (const mutation of mutations) {
      await expect(verifyGitHubCI(makeJwt(mutation), runId, jwksFetch))
        .rejects.toThrow("Invalid GitHub Actions identity");
    }
    await expect(verifyGitHubCI(makeJwt(), "someone-elses-run:1:backend-jest", jwksFetch))
      .rejects.toThrow("Invalid GitHub Actions identity");
  });

  test("rejects tampered signatures and malformed identity headers", async () => {
    const original = makeJwt();
    const other = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
    await expect(verifyGitHubCI(makeJwt({}, other.privateKey), runId, jwksFetch))
      .rejects.toThrow("Invalid GitHub Actions identity");
    await expect(verifyGitHubCI(original + "X", runId, jwksFetch))
      .rejects.toThrow("Invalid GitHub Actions identity");
    await expect(verifyGitHubCI("a.b.c", runId, jwksFetch))
      .rejects.toThrow("Invalid GitHub Actions identity");
  });
});
