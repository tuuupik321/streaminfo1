import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LiveIndicator } from "@/components/dashboard/LiveIndicator";

describe("LiveIndicator", () => {
  it("shows offline label", () => {
    render(<LiveIndicator isLive={false} />);
    expect(screen.getByText("OFFLINE")).toBeInTheDocument();
  });

  it("shows live label", () => {
    render(<LiveIndicator isLive />);
    expect(screen.getByText("LIVE")).toBeInTheDocument();
  });
});

