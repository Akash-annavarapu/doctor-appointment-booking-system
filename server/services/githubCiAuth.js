const crypto = require("node:crypto");

const TRUST = Object.freeze({
  issuer: "https://token.actions.githubusercontent.com",
  audience: "testpilot-reporting:Akash-annavarapu/doctor-appointment-booking-system",
  repository: "Akash-annavarapu/doctor-appointment-booking-system",
  repositoryId: "1415924819",
  ref: "refs/heads/main",
  workflowRef: "Akash-annavarapu/doctor-appointment-booking-system/.github/workflows/testpilot-ci.yml@refs/heads/main",
  reviewedWorkflowRef: "Akash-annavarapu/doctor-appointment-booking-system/.github/workflows/reviewed-playwright.yml@refs/heads/main",
  jwksUrl: "https://token.actions.githubusercontent.com/.well-known/jwks",
});
let keyCache = { keys: [], expires: 0 };

class CIAuthError extends Error {
  constructor(message = "Invalid GitHub Actions identity.", status = 401) {
    super(message);
    this.status = status;
  }
}

function decodeSegment(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new CIAuthError();
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

async function getSigningKeys(fetchImpl) {
  if (Date.now() < keyCache.expires && keyCache.keys.length) return keyCache.keys;
  let response;
  try {
    response = await fetchImpl(TRUST.jwksUrl, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error("JWKS not available");
    const body = await response.json();
    if (!Array.isArray(body.keys) || body.keys.length < 1 || body.keys.length > 40) {
      throw new Error("Invalid key set");
    }
    keyCache = { keys: body.keys, expires: Date.now() + 5 * 60 * 1000 };
    return keyCache.keys;
  } catch {
    throw new CIAuthError("GitHub Actions signing keys unavailable.", 503);
  }
}

async function verifyGitHubCI(token, runId, fetchImpl = fetch) {
  if (typeof token !== "string" || token.length > 16000) throw new CIAuthError();
  const parts = token.split(".");
  if (parts.length !== 3) throw new CIAuthError();
  let header, claims;
  try {
    header = decodeSegment(parts[0]);
    claims = decodeSegment(parts[1]);
  } catch {
    throw new CIAuthError();
  }

  if (header.alg !== "RS256" || typeof header.kid !== "string" ||
      !/^[a-zA-Z0-9._-]{1,200}$/.test(header.kid)) {
    throw new CIAuthError();
  }
  const keys = await getSigningKeys(fetchImpl);
  const jwk = keys.find(k => k.kid === header.kid && k.kty === "RSA" &&
    (!k.use || k.use === "sig") && (!k.alg || k.alg === "RS256"));
  if (!jwk) {
    // One refresh is allowed for key rotation; a missing key still fails closed.
    keyCache.expires = 0;
    const refreshed = await getSigningKeys(fetchImpl);
    const rotated = refreshed.find(k => k.kid === header.kid && k.kty === "RSA" &&
      (!k.use || k.use === "sig"));
    if (!rotated) throw new CIAuthError();
    return checkSignature(rotated, parts, claims, runId);
  }
  return checkSignature(jwk, parts, claims, runId);
}

function checkSignature(jwk, parts, claims, runId) {
  let valid = false;
  try {
    valid = crypto.verify("RSA-SHA256",
      Buffer.from(parts[0] + "." + parts[1]),
      crypto.createPublicKey({ key: jwk, format: "jwk" }),
      Buffer.from(parts[2], "base64url"));
  } catch {
    throw new CIAuthError();
  }
  if (!valid) throw new CIAuthError();

  const now = Math.floor(Date.now() / 1000);
  // Fixed trust allowlist: original push regression or the manually dispatched,
  // prewritten approved-story Playwright workflow. No forks, PRs or other actions.
  const trustedWorkflow =
    (claims.workflow_ref === TRUST.workflowRef && claims.event_name === "push") ||
    (claims.workflow_ref === TRUST.reviewedWorkflowRef && claims.event_name === "workflow_dispatch");
  if (claims.iss !== TRUST.issuer || claims.aud !== TRUST.audience ||
      claims.repository !== TRUST.repository ||
      String(claims.repository_id) !== TRUST.repositoryId ||
      claims.ref !== TRUST.ref ||
      !trustedWorkflow ||
      !Number.isSafeInteger(claims.exp) || claims.exp <= now ||
      !Number.isSafeInteger(claims.iat) || claims.iat > now + 60 ||
      claims.exp - claims.iat > 3600 ||
      (claims.nbf !== undefined && claims.nbf > now) ||
      !/^[1-9]\d{4,20}$/.test(String(claims.run_id)) ||
      !/^[1-9]\d{0,5}$/.test(String(claims.run_attempt || "")) ||
      typeof runId !== "string" ||
      !runId.startsWith(claims.run_id + ":" + claims.run_attempt + ":")) {
    throw new CIAuthError();
  }
  return { runId: claims.run_id, repository: claims.repository, workflow: claims.workflow_ref };
}

module.exports = { verifyGitHubCI, CIAuthError, TRUST };
