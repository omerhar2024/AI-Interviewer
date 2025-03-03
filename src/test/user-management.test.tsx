import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserManagementPage from "../pages/admin/user-management";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useIsAdmin } from "../lib/hooks/use-admin";
import { useToast } from "../components/ui/use-toast";
import { BrowserRouter } from "react-router-dom";

// Mock the necessary dependencies
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    auth: {
      signUp: vi.fn(),
    },
  },
}));

vi.mock("../lib/auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../lib/hooks/use-admin", () => ({
  useIsAdmin: vi.fn(),
}));

vi.mock("../components/ui/use-toast", () => ({
  useToast: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("UserManagementPage", () => {
  beforeEach(() => {
    // Setup default mocks
    useAuth.mockReturnValue({
      user: { id: "test-user-id", email: "admin@example.com" },
    });

    useIsAdmin.mockReturnValue({
      data: true,
      isLoading: false,
    });

    useToast.mockReturnValue({
      toast: vi.fn(),
    });

    // Mock successful database responses
    supabase
      .from()
      .select()
      .order.mockResolvedValue({
        data: [
          {
            id: "user1",
            email: "user1@example.com",
            role: "free",
            created_at: new Date().toISOString(),
          },
          {
            id: "user2",
            email: "user2@example.com",
            role: "premium",
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      });
  });

  it("renders the user management page for admin users", async () => {
    render(
      <BrowserRouter>
        <UserManagementPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("User Management")).toBeInTheDocument();
    });
  });

  it("fetches users on initial load", async () => {
    render(
      <BrowserRouter>
        <UserManagementPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("users");
      expect(supabase.select).toHaveBeenCalled();
    });
  });

  it("allows adding a new user", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "new-user-id", email: "newuser@example.com" } },
      error: null,
    });

    supabase.from().insert.mockResolvedValue({
      error: null,
    });

    render(
      <BrowserRouter>
        <UserManagementPage />
      </BrowserRouter>,
    );

    // Click the Add User button
    await waitFor(() => {
      const addButton = screen.getByText("Add User");
      fireEvent.click(addButton);
    });

    // Fill in the form
    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText("user@example.com");
      const passwordInput = screen.getByPlaceholderText("••••••••");

      fireEvent.change(emailInput, {
        target: { value: "newuser@example.com" },
      });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      const submitButton = screen.getByText("Add User", { selector: "button" });
      fireEvent.click(submitButton);
    });

    // Verify the API calls
    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "password123",
      });
      expect(supabase.from).toHaveBeenCalledWith("users");
      expect(supabase.insert).toHaveBeenCalled();
    });
  });

  it("allows updating user roles", async () => {
    supabase.from().update.mockResolvedValue({
      error: null,
    });

    supabase.from().upsert.mockResolvedValue({
      error: null,
    });

    render(
      <BrowserRouter>
        <UserManagementPage />
      </BrowserRouter>,
    );

    // Select a user
    await waitFor(() => {
      const checkbox = screen.getAllByRole("checkbox")[1]; // First user checkbox
      fireEvent.click(checkbox);
    });

    // Click the Update Roles button
    await waitFor(() => {
      const updateButton = screen.getByText("Update Roles");
      fireEvent.click(updateButton);
    });

    // Select a new role and submit
    await waitFor(() => {
      const submitButton = screen.getByText("Update Roles", {
        selector: "button:not([disabled])",
      });
      fireEvent.click(submitButton);
    });

    // Verify the API calls
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("users");
      expect(supabase.update).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith("subscriptions");
      expect(supabase.upsert).toHaveBeenCalled();
    });
  });

  it("allows deleting a user", async () => {
    supabase.from().delete.mockResolvedValue({
      error: null,
    });

    render(
      <BrowserRouter>
        <UserManagementPage />
      </BrowserRouter>,
    );

    // Click the Delete button for a user
    await waitFor(() => {
      const deleteButton = screen.getAllByText("Delete")[0];
      fireEvent.click(deleteButton);
    });

    // Confirm deletion
    await waitFor(() => {
      const confirmButton = screen.getByText("Delete", {
        selector: "button.bg-red-600",
      });
      fireEvent.click(confirmButton);
    });

    // Verify the API calls
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("subscriptions");
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith("users");
      expect(supabase.delete).toHaveBeenCalled();
    });
  });

  it("allows exporting users to CSV", async () => {
    // Mock document methods
    global.URL.createObjectURL = vi.fn();
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
    };
    document.createElement = vi.fn().mockReturnValue(mockLink);
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();

    render(
      <BrowserRouter>
        <UserManagementPage />
      </BrowserRouter>,
    );

    // Click the Export button
    await waitFor(() => {
      const exportButton = screen.getByText("Export");
      fireEvent.click(exportButton);
    });

    // Verify export functionality
    await waitFor(() => {
      expect(document.createElement).toHaveBeenCalledWith("a");
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        "download",
        expect.stringContaining("users_export_"),
      );
      expect(mockLink.click).toHaveBeenCalled();
    });
  });
});
