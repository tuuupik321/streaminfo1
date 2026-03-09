import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";
import { PieChart } from "lucide-react";

describe("EmptyState", () => {
  it("should render the title and description", () => {
    render(
      <EmptyState
        icon={PieChart}
        title="No data yet"
        description="Start streaming to see your analytics."
      />
    );

    expect(screen.getByText("No data yet")).toBeInTheDocument();
    expect(screen.getByText("Start streaming to see your analytics.")).toBeInTheDocument();
  });
});
