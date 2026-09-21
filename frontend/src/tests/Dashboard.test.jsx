import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import Dashboard from "../Dashboard";

describe("Dashboard Component", () => {
  test("displays the Release Dashboard heading", () => {
    render(<Dashboard />);

    expect(
      screen.getByText("Release Dashboard")
    ).toBeInTheDocument();
  });

  test("displays application statistics", () => {
    render(<Dashboard />);

    expect(
      screen.getByText("Applications")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Active Releases")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("Canary Traffic").length
    ).toBeGreaterThan(0);

    expect(
      screen.getByText("Rollbacks")
    ).toBeInTheDocument();
  });
});