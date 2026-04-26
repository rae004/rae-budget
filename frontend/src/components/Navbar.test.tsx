import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "./Navbar";

function renderNavbarAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>
  );
}

describe("Navbar", () => {
  it("renders the brand and all nav links", () => {
    renderNavbarAt("/");
    expect(screen.getByText("Rae Budget")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bill Templates" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
  });

  it("marks the Dashboard link active on /", () => {
    renderNavbarAt("/");
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveClass("active");
    expect(screen.getByRole("link", { name: "Bill Templates" })).not.toHaveClass(
      "active"
    );
  });

  it("marks Bill Templates active on /bill-templates", () => {
    renderNavbarAt("/bill-templates");
    expect(screen.getByRole("link", { name: "Bill Templates" })).toHaveClass("active");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveClass("active");
  });

  it("marks Settings active on /settings", () => {
    renderNavbarAt("/settings");
    expect(screen.getByRole("link", { name: "Settings" })).toHaveClass("active");
  });
});
