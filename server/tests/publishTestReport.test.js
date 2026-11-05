const { retryDelayMs, sendReportWithRetry } = require("../scripts/publishTestReport");

describe("CI report publishing under throttling", () => {
  const endpoint = new URL("https://example.test/api/reports/test-run");
  const init = { method: "POST", body: "{\"suite\":\"test\"}" };

  test("honors a numeric Retry-After header without changing the payload", async () => {
    const waits = [];
    const responses = [
      { ok: false, status: 429, headers: { get: () => "3" } },
      { ok: true, status: 201, headers: { get: () => null } }
    ];
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({ url: String(url), body: options.body });
      return responses.shift();
    };
    await sendReportWithRetry(endpoint, init, { fetchImpl,
      sleep: async ms => { waits.push(ms); } });
    expect(waits).toEqual([3000]);
    expect(calls).toHaveLength(2);
    expect(calls[0].body).toBe(calls[1].body);
  });

  test("treats a nonretryable 400 as failure with one request", async () => {
    const fetchImpl = jest.fn(async () => ({ ok: false, status: 400 }));
    await expect(sendReportWithRetry(endpoint, init, { fetchImpl,
      sleep: async () => {} })).rejects.toThrow("HTTP 400");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test("raises an error if throttling continues after bounded retries", async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: false, status: 429, headers: { get: () => null }
    }));
    const waits = [];
    await expect(sendReportWithRetry(endpoint, init, { fetchImpl,
      sleep: async ms => { waits.push(ms); } })).rejects.toThrow("HTTP 429");
    expect(fetchImpl).toHaveBeenCalledTimes(5);
    expect(waits).toEqual([15000, 30000, 60000, 90000]);
  });

  test("bounds HTTP date and numeric Retry-After values", () => {
    expect(retryDelayMs("999999", 0)).toBe(90000);
    expect(retryDelayMs(null, 0)).toBe(15000);
    expect(retryDelayMs("Thu, 01 Jan 1970 00:00:05 GMT", 0, 0)).toBe(5000);
  });
});
