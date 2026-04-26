import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./Layout";
import { ToastProvider } from "../contexts/ToastContext";

function renderLayout() {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<div data-testid="page">Home page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
}

describe("Layout", () => {
  it("renders the navbar", () => {
    renderLayout();
    expect(screen.getByText("Rae Budget")).toBeInTheDocument();
  });

  it("renders the routed child via Outlet", () => {
    renderLayout();
    expect(screen.getByTestId("page")).toHaveTextContent("Home page");
  });
});
