import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Sparkline from "./Sparkline";

describe("Sparkline", () => {
  it("renders one circle per value and a polyline", () => {
    const { container } = render(<Sparkline values={[10, 20, 15]} height={60} />);

    expect(container.querySelectorAll("circle")).toHaveLength(3);
    expect(container.querySelector("polyline")).toHaveAttribute("points");
  });

  it("handles empty values without crashing", () => {
    const { container } = render(<Sparkline values={[]} />);

    expect(container.querySelectorAll("circle")).toHaveLength(0);
    expect(container.querySelector("polyline")).toHaveAttribute("points", "");
  });
});
