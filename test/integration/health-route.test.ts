import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

// Task 12 — test for the minimal liveness endpoint added as equivalent
// of the old StartUpController (/startup/init).
describe("health route — liveness ucu (Task 12)", () => {
  it("GET /api/health 200 ve status:ok döner", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; timestamp: string };
    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
  });
});
