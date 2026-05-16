import { render, screen } from "@testing-library/react";
import FlagIcon from "@mui/icons-material/Flag";
import { describe, expect, it } from "vitest";
import PageHero from "../components/PageHero";

describe("PageHero", () => {
  it("renders chip, title, subtitle and actions", () => {
    render(
      <PageHero
        chipIcon={<FlagIcon />}
        chipLabel="Plan"
        title="Objetivos"
        subtitle="Define tus objetivos diarios"
        actions={<button type="button">Guardar</button>}
      />,
    );

    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Objetivos" })).toBeInTheDocument();
    expect(screen.getByText("Define tus objetivos diarios")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("renders custom children instead of the default layout", () => {
    render(
      <PageHero title="No visible">
        <p>Contenido propio</p>
      </PageHero>,
    );

    expect(screen.getByText("Contenido propio")).toBeInTheDocument();
    expect(screen.queryByText("No visible")).not.toBeInTheDocument();
  });
});
