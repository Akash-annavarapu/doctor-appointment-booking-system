const request = require("supertest");

const app = require("../app");
const User = require("../models/User");


// ======================================
// Authentication Integration Tests
// ======================================
describe(
  "Authentication API",
  () => {
    beforeEach(async () => {
      await User.deleteMany({});
    });


    // ==================================
    // Registration
    // ==================================
    describe(
      "POST /api/v1/auth/register",
      () => {
        test(
          "TP-001: registers a valid user",
          async () => {
            const response =
              await request(app)
                .post(
                  "/api/v1/auth/register"
                )
                .send({
                  name:
                    "Test User",
                  email:
                    "test@example.com",
                  password:
                    "password123",
                  phone:
                    "9876543210",
                });

            expect(
              response.status
            ).toBe(201);

            expect(
              response.body.success
            ).toBe(true);

            expect(
              response.body.token
            ).toEqual(
              expect.any(String)
            );

            expect(
              response.body.user
            ).toMatchObject({
              name:
                "Test User",
              email:
                "test@example.com",
              phone:
                "9876543210",
              isAdmin: false,
              isDoctor: false,
            });

            expect(
              response.body.user.password
            ).toBeUndefined();

            const savedUser =
              await User.findOne({
                email:
                  "test@example.com",
              }).select(
                "+password"
              );

            expect(
              savedUser
            ).not.toBeNull();

            expect(
              savedUser.password
            ).not.toBe(
              "password123"
            );
          }
        );


        test(
          "rejects duplicate email registration",
          async () => {
            const userData = {
              name:
                "Test User",
              email:
                "duplicate@example.com",
              password:
                "password123",
              phone:
                "9876543210",
            };

            const firstResponse =
              await request(app)
                .post(
                  "/api/v1/auth/register"
                )
                .send(userData);

            expect(
              firstResponse.status
            ).toBe(201);

            const secondResponse =
              await request(app)
                .post(
                  "/api/v1/auth/register"
                )
                .send(userData);

            expect(
              secondResponse.status
            ).toBe(409);

            expect(
              secondResponse.body.success
            ).toBe(false);
          }
        );


        test(
          "rejects invalid registration input",
          async () => {
            const response =
              await request(app)
                .post(
                  "/api/v1/auth/register"
                )
                .send({
                  name: "A",
                  email: "bad-email",
                  password: "123",
                  phone: "12345",
                });

            expect(
              response.status
            ).toBe(400);

            expect(
              response.body.success
            ).toBe(false);
          }
        );
      }
    );


    // ==================================
    // Login
    // ==================================
    describe(
      "POST /api/v1/auth/login",
      () => {
        const userData = {
          name:
            "Login User",
          email:
            "login@example.com",
          password:
            "password123",
          phone:
            "9876543210",
        };


        beforeEach(async () => {
          await request(app)
            .post(
              "/api/v1/auth/register"
            )
            .send(userData);
        });


        test(
          "TP-007: logs in with valid credentials",
          async () => {
            const response =
              await request(app)
                .post(
                  "/api/v1/auth/login"
                )
                .send({
                  email:
                    userData.email,
                  password:
                    userData.password,
                });

            expect(
              response.status
            ).toBe(200);

            expect(
              response.body.success
            ).toBe(true);

            expect(
              response.body.token
            ).toEqual(
              expect.any(String)
            );

            expect(
              response.body.user.email
            ).toBe(
              userData.email
            );

            expect(
              response.body.user.password
            ).toBeUndefined();
          }
        );


        test(
          "TP-008: rejects an incorrect password",
          async () => {
            const response =
              await request(app)
                .post(
                  "/api/v1/auth/login"
                )
                .send({
                  email:
                    userData.email,
                  password:
                    "wrongpassword",
                });

            expect(
              response.status
            ).toBe(401);

            expect(
              response.body
            ).toEqual({
              success: false,
              message:
                "Invalid email or password.",
            });
          }
        );


        test(
          "does not reveal whether an email exists",
          async () => {
            const response =
              await request(app)
                .post(
                  "/api/v1/auth/login"
                )
                .send({
                  email:
                    "missing@example.com",
                  password:
                    "password123",
                });

            expect(
              response.status
            ).toBe(401);

            expect(
              response.body.message
            ).toBe(
              "Invalid email or password."
            );
          }
        );
      }
    );


    // ==================================
    // Current User
    // ==================================
    describe(
      "GET /api/v1/auth/me",
      () => {
        const userData = {
          name:
            "Current User",
          email:
            "current@example.com",
          password:
            "password123",
          phone:
            "9876543210",
        };


        const registerAndGetToken =
          async () => {
            const response =
              await request(app)
                .post(
                  "/api/v1/auth/register"
                )
                .send(userData);

            return response.body.token;
          };


        test(
          "returns the current authenticated user",
          async () => {
            const token =
              await registerAndGetToken();

            const response =
              await request(app)
                .get(
                  "/api/v1/auth/me"
                )
                .set(
                  "Authorization",
                  `Bearer ${token}`
                );

            expect(
              response.status
            ).toBe(200);

            expect(
              response.body.success
            ).toBe(true);

            expect(
              response.body.user
            ).toMatchObject({
              name:
                userData.name,
              email:
                userData.email,
              phone:
                userData.phone,
              isAdmin: false,
              isDoctor: false,
            });

            expect(
              response.body.user.id
            ).toBeDefined();

            expect(
              response.body.user.password
            ).toBeUndefined();
          }
        );


        test(
          "rejects a request without a token",
          async () => {
            const response =
              await request(app)
                .get(
                  "/api/v1/auth/me"
                );

            expect(
              response.status
            ).toBe(401);

            expect(
              response.body.success
            ).toBe(false);
          }
        );


        test(
          "rejects an invalid token",
          async () => {
            const response =
              await request(app)
                .get(
                  "/api/v1/auth/me"
                )
                .set(
                  "Authorization",
                  "Bearer invalid-token"
                );

            expect(
              response.status
            ).toBe(401);

            expect(
              response.body.success
            ).toBe(false);
          }
        );


        test(
          "rejects a valid token when its user no longer exists",
          async () => {
            const token =
              await registerAndGetToken();

            await User.deleteOne({
              email:
                userData.email,
            });

            const response =
              await request(app)
                .get(
                  "/api/v1/auth/me"
                )
                .set(
                  "Authorization",
                  `Bearer ${token}`
                );

            expect(
              response.status
            ).toBe(401);

            expect(
              response.body
            ).toMatchObject({
              success: false,
              message:
                "User not found",
            });
          }
        );
      }
    );
  }
);
