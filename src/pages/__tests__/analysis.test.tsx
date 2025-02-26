import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import AnalysisPage from "../analysis";
import { supabase } from "@/lib/supabase";

// Mock the dependencies
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                text: `Situation (Score 8/10):
- What was observed: Clear context provided
- What was missing: More details needed
- Improvement suggestions: Add specific examples

Task (Score 7/10):
- What was observed: Goal was stated
- What was missing: Role clarity
- Improvement suggestions: Define responsibilities

Action (Score 9/10):
- What was observed: Detailed steps
- What was missing: Timeline
- Improvement suggestions: Add timeframes

Result (Score 8/10):
- What was observed: Outcome described
- What was missing: Metrics
- Improvement suggestions: Add quantifiable results

Key Strengths:
- Strong communication
- Clear structure

Areas for Improvement:
- Add more details
- Include metrics`,
                score: 8,
              },
            }),
          ),
        })),
      })),
    })),
  },
}));

describe("AnalysisPage", () => {
  it("should render analysis with correct scores and feedback", async () => {
    render(
      <BrowserRouter>
        <AnalysisPage />
      </BrowserRouter>,
    );

    // Wait for scores to be displayed
    expect(await screen.findByText("8/10")).toBeInTheDocument();
    expect(await screen.findByText("7/10")).toBeInTheDocument();
    expect(await screen.findByText("9/10")).toBeInTheDocument();
    expect(await screen.findByText("8/10")).toBeInTheDocument();

    // Check feedback sections
    expect(screen.getByText("Clear context provided")).toBeInTheDocument();
    expect(screen.getByText("Goal was stated")).toBeInTheDocument();
    expect(screen.getByText("Detailed steps")).toBeInTheDocument();
    expect(screen.getByText("Outcome described")).toBeInTheDocument();

    // Check strengths and improvements
    expect(screen.getByText("Strong communication")).toBeInTheDocument();
    expect(screen.getByText("Add more details")).toBeInTheDocument();
  });
});
