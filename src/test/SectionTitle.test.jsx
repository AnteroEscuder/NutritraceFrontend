import { render, screen } from "@testing-library/react";
import FlagIcon from "@mui/icons-material/Flag";
import { describe, expect, it } from "vitest";
import SectionTitle from "../components/SectionTitle";

describe("SectionTitle", () => {
  it("renders title and optional subtitle", () => {
    render(
      <SectionTitle
        icon={<FlagIcon />}
        title="Configuración diaria"
        subtitle="Ajusta tus objetivos"
      />,
    );

    expect(screen.getByText("Configuración diaria")).toBeInTheDocument();
    expect(screen.getByText("Ajusta tus objetivos")).toBeInTheDocument();
  });
});
