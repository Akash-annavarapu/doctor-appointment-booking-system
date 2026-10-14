const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const generationRequest = {
  framework: "jest",
  suiteType: "integration",
  target: { method: "POST", path: "/api/v1/appointment/book" },
  useCase: { id: "UC-09", expected: 401 }
};

describe("Admin-only AI test generation API", () => {
  test("rejects anonymous callers before contacting any provider", async () => {
    const response = await request(app).post("/api/ai/generate-tests").send(generationRequest);
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("forbids signed-in patients from spending LLM credits", async () => {
    const patient = await User.create({
      name: "Generation Test Patient",
      email: "ai-test-patient@example.test",
      phone: "9876543210",
      password: "synthetic_password_hash",
    });
    const response = await request(app).post("/api/ai/generate-tests")
      .set("Authorization", "Bearer " + generateToken(patient._id))
      .send(generationRequest);
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    await User.deleteOne({ _id: patient._id });
  });
});
