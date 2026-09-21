import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, beforeEach } from "vitest";
import Releases from "../pages/Releases";

describe("Releases Component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Test 1
  test("displays the Releases page heading", () => {
    render(<Releases />);

    expect(
      screen.getByRole("heading", { name: "Releases" })
    ).toBeInTheDocument();
  });

  // Test 2
  test("displays existing releases", () => {
    render(<Releases />);

    expect(
      screen.getByText("Payment Service")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Order Service")
    ).toBeInTheDocument();
  });

  // Test 3
  test("displays the New Release button", () => {
    render(<Releases />);

    expect(
      screen.getByRole("button", { name: "+ New Release" })
    ).toBeInTheDocument();
  });

  // Test 4
  test("opens the release creation form", async () => {
    const user = userEvent.setup();

    render(<Releases />);

    const newReleaseButton = screen.getByRole("button", {
      name: "+ New Release",
    });

    await user.click(newReleaseButton);

    // The form should now be visible.
    // We check for form-related controls rather than
    // assuming a specific label structure.

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });
  });
}); 