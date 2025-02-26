import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import RecordingPage from "../recording";
import { supabase } from "@/lib/supabase";
import { deepseek } from "@/lib/deepseek";

// Mock the dependencies
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: "test-question-id",
                text: "Test question text",
              },
            }),
          ),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: { id: "test-response-id" } }),
          ),
        })),
      })),
    })),
  },
}));

vi.mock("@/lib/deepseek", () => ({
  deepseek: {
    chat: {
      completions: {
        create: vi.fn(() =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content:
                    "Situation (8/10)\nTask (7/10)\nAction (9/10)\nResult (8/10)\nOverall Score: 8/10",
                },
              },
            ],
          }),
        ),
      },
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ questionId: "test-question-id" }),
  };
});

describe("RecordingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders recording page with initial state", () => {
    render(
      <BrowserRouter>
        <RecordingPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Question")).toBeInTheDocument();
    expect(screen.getByText("Sample Response")).toBeInTheDocument();
    expect(screen.getByText("STAR Response")).toBeInTheDocument();
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("loads question data on mount", async () => {
    render(
      <BrowserRouter>
        <RecordingPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Test question text")).toBeInTheDocument();
    });

    expect(supabase.from).toHaveBeenCalledWith("questions");
  });

  it("handles recording state changes", () => {
    render(
      <BrowserRouter>
        <RecordingPage />
      </BrowserRouter>,
    );

    const recordButton = screen.getByRole("button", { name: /mic/i });
    fireEvent.click(recordButton);

    expect(screen.getByRole("button", { name: /square/i })).toBeInTheDocument();
  });

  it("handles text input and analysis submission", async () => {
    render(
      <BrowserRouter>
        <RecordingPage />
      </BrowserRouter>,
    );

    const textarea = screen.getByPlaceholderText(
      "Your speech will appear here as you speak...",
    );
    fireEvent.change(textarea, { target: { value: "Test response" } });

    const submitButton = screen.getByText("Submit Response");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(deepseek.chat.completions.create).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith("responses");
    });
  });

  it("shows loading state during analysis", async () => {
    render(
      <BrowserRouter>
        <RecordingPage />
      </BrowserRouter>,
    );

    const textarea = screen.getByPlaceholderText(
      "Your speech will appear here as you speak...",
    );
    fireEvent.change(textarea, { target: { value: "Test response" } });

    const submitButton = screen.getByText("Submit Response");
    fireEvent.click(submitButton);

    expect(screen.getByText("Analyzing...")).toBeInTheDocument();
  });
});
