import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { app } from "./app";

describe("app", () => {
  afterEach(() => {
    delete process.env.PORTFOLIO_READ_ONLY;
    delete process.env.OWNER_WRITE_TOKEN;
  });

  it("returns API health status", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toEqual({
      status: "ok",
      service: "memorabilia-api",
    });
  });

  it("blocks writes when portfolio read-only mode is enabled", async () => {
    process.env.PORTFOLIO_READ_ONLY = "true";

    const response = await request(app).post("/cards").send({}).expect(403);

    expect(response.body).toEqual({
      error:
        "Portfolio demo is read-only. Explore the dashboard, but edits are disabled on the public deployment.",
    });
  });

  it("allows owner-token writes when portfolio read-only mode is enabled", async () => {
    process.env.PORTFOLIO_READ_ONLY = "true";
    process.env.OWNER_WRITE_TOKEN = "test-owner-token";

    await request(app)
      .post("/cards")
      .set("x-owner-write-token", "test-owner-token")
      .send({})
      .expect(400);
  });
});
