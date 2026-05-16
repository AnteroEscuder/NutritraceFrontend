import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatCard from "./StatCard";

describe("StatCard", () => {
  it("renders title, value and subtitle", () => {
    render(<StatCard title="Calorías" value="1200 kcal" subtitle="Objetivo 2000" />);

    expect(screen.getByText("Calorías")).toBeInTheDocument();
    expect(screen.getByText("1200 kcal")).toBeInTheDocument();
    expect(screen.getByText("Objetivo 2000")).toBeInTheDocument();
  });

  it("clamps progress to 100 percent", () => {
    render(<StatCard title="Proteína" value="90 g" progress={1.4} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });
});
