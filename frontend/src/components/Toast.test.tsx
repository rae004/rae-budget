import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider, useToast } from "../contexts/ToastContext";
import { ToastContainer } from "./Toast";

// Test component that exposes toast controls
function TestComponent() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast("Success message", "success")}>
        Show Success
      </button>
      <button onClick={() => showToast("Error message", "error")}>
        Show Error
      </button>
      <button onClick={() => showToast("Info message", "info")}>
        Show Info
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <ToastProvider>
      <TestComponent />
      <ToastContainer />
    </ToastProvider>
  );
}

describe("Toast", () => {
  it("does not show any toasts initially", () => {
    renderWithProvider();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows success toast when triggered", () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("Show Success"));

    expect(screen.getByText("Success message")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("alert-success");
  });

  it("shows error toast when triggered", () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("Show Error"));

    expect(screen.getByText("Error message")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("alert-error");
  });

  it("shows info toast when triggered", () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("Show Info"));

    expect(screen.getByText("Info message")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("alert-info");
  });

  it("removes toast when clicked", () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success message")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("alert"));
    expect(screen.queryByText("Success message")).not.toBeInTheDocument();
  });

  it("can show multiple toasts", () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("Show Success"));
    fireEvent.click(screen.getByText("Show Error"));

    expect(screen.getByText("Success message")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
    expect(screen.getAllByRole("alert")).toHaveLength(2);
  });
});
