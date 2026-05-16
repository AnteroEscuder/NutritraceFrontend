import { render, screen } from "@testing-library/react";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { describe, expect, it } from "vitest";
import MetricCard from "../components/MetricCard";

describe("MetricCard", () => {
  it("renders its label and value", () => {
    render(<MetricCard icon={<RestaurantIcon />} label="Comidas" value="4" />);

    expect(screen.getByText("Comidas")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
