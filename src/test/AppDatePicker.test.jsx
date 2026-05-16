import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AppDatePicker from "../components/AppDatePicker";

describe("AppDatePicker", () => {
  it("calls onChange when the native date input changes", () => {
    const onChange = vi.fn();

    render(
      <AppDatePicker
        value="2026-05-16"
        onChange={onChange}
        label="Fecha"
        selectLabel="Seleccionar fecha"
        formattedValue="sáb, 16 may"
      />,
    );

    fireEvent.change(screen.getByLabelText("Seleccionar fecha"), {
      target: { value: "2026-05-17" },
    });

    expect(onChange).toHaveBeenCalledWith("2026-05-17");
  });

  it("uses todayValue when the today button is clicked", () => {
    const onChange = vi.fn();

    render(
      <AppDatePicker
        value="2026-05-15"
        onChange={onChange}
        label="Fecha"
        todayLabel="Hoy"
        todayValue="2026-05-16"
        selectLabel="Seleccionar fecha"
        formattedValue="vie, 15 may"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hoy" }));

    expect(onChange).toHaveBeenCalledWith("2026-05-16");
  });
});
