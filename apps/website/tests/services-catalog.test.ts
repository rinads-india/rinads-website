import { describe, expect, it } from "vitest";
import { ORDER_STATUS_PROGRESS } from "@/lib/services/types";

describe("services catalog", () => {
  it("maps order statuses to progress percentages", () => {
    expect(ORDER_STATUS_PROGRESS.delivered).toBe(100);
    expect(ORDER_STATUS_PROGRESS.assigned).toBe(25);
    expect(ORDER_STATUS_PROGRESS.pending).toBe(5);
  });
});
