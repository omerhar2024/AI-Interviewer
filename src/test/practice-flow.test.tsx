import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PracticeCategoriesPage from "../pages/practice-categories";
import QuestionSelectionPage from "../pages/question-selection";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

// Mock the necessary dependencies
vi.mock("../lib/auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  },
}));

vi.mock("../lib/hooks/use-subscription", () => ({
  useSubscription: () => ({ data: { question_limit: 10 } }),
}));

vi.mock("../lib/hooks/use-usage-stats", () => ({
  useUsageStats: () => ({ data: { used: 5 } }),
}));

vi.mock("../lib/subscription-utils", () => ({
  hasPremiumAccess: () => true,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Practice Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    useAuth.mockReturnValue({
      user: { id: "test-user-id", email: "user@example.com" },
    });

    // Mock supabase response for questions
    supabase
      .from()
      .select()
      .order.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: "1",
              text: "How would you improve Instagram's Reels feature?",
              type: "product_sense",
              created_at: new Date().toISOString(),
            },
            {
              id: "2",
              text: "Tell me about a time you had to make a difficult decision",
              type: "behavioral",
              created_at: new Date().toISOString(),
            },
          ],
          error: null,
        }),
      });
  });

  it("renders the practice categories page with two options", async () => {
    render(
      <MemoryRouter>
        <PracticeCategoriesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Select a Category")).toBeInTheDocument();
      expect(screen.getByText("Product Sense")).toBeInTheDocument();
      expect(screen.getByText("Behavioral")).toBeInTheDocument();
    });

    // Check that both buttons are present
    expect(screen.getByText("Practice Product Sense")).toBeInTheDocument();
    expect(screen.getByText("Practice Behavioral")).toBeInTheDocument();
  });

  it("navigates to product sense questions when clicking product sense button", async () => {
    render(
      <MemoryRouter>
        <PracticeCategoriesPage />
      </MemoryRouter>,
    );

    // Click the Product Sense button
    fireEvent.click(screen.getByText("Practice Product Sense"));

    // Verify navigation was called with the correct URL
    expect(mockNavigate).toHaveBeenCalledWith("/practice?type=product_sense");
  });

  it("navigates to behavioral questions when clicking behavioral button", async () => {
    render(
      <MemoryRouter>
        <PracticeCategoriesPage />
      </MemoryRouter>,
    );

    // Click the Behavioral button
    fireEvent.click(screen.getByText("Practice Behavioral"));

    // Verify navigation was called with the correct URL
    expect(mockNavigate).toHaveBeenCalledWith("/practice?type=behavioral");
  });

  it("filters questions by type on the question selection page", async () => {
    // Mock the location.search for product_sense filter
    const mockLocation = {
      pathname: "/practice",
      search: "?type=product_sense",
      hash: "",
      state: null,
    };

    render(
      <MemoryRouter initialEntries={[mockLocation]}>
        <QuestionSelectionPage />
      </MemoryRouter>,
    );

    // Verify that the filter was applied to the supabase query
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("questions");
      expect(supabase.eq).toHaveBeenCalledWith("type", "product_sense");
    });
  });

  it("shows a back button on the question selection page", async () => {
    render(
      <MemoryRouter>
        <QuestionSelectionPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Back to Categories")).toBeInTheDocument();
    });

    // Click the back button
    fireEvent.click(screen.getByText("Back to Categories"));

    // Verify navigation was called with the correct URL
    expect(mockNavigate).toHaveBeenCalledWith("/practice-categories");
  });
});
