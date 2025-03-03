import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Download,
  RefreshCw,
  Trash2,
  UserPlus,
  Shield,
  UserCog,
  AlertCircle,
} from "lucide-react";
import { useIsAdmin } from "@/lib/hooks/use-admin";
import { syncAllAuthUsers } from "@/lib/admin";

import { useFontFix } from "@/lib/hooks/use-font-fix";

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: isAdmin } = useIsAdmin();

  // Apply font fix to prevent CSP errors
  useFontFix();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("free");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("free");

  useEffect(() => {
    // Redirect non-admin users
    if (user && !isAdmin) {
      navigate("/dashboard");
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to access this page.",
      });
    }

    fetchUsers();
  }, [user, isAdmin, navigate, toast]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let fetchError = null;

      // First try to fix database schema and create missing functions
      try {
        // Skip SQL functions since they're failing with 404
        // Just try to sync users directly
        const { success, message } = await syncAllAuthUsers();
        console.log("Sync result:", message);
      } catch (syncError) {
        console.error("Error syncing users:", syncError);
        fetchError = syncError;
      }

      // First try to get users from auth.users via RPC
      try {
        const { data: authUsers, error: authError } =
          await supabase.rpc("list_all_users");

        if (!authError && authUsers && authUsers.length > 0) {
          console.log(`Found ${authUsers.length} users via RPC`);

          // Process and format the users
          const processedUsers = authUsers.map((user) => ({
            id: user.id,
            email: user.email,
            role: user.role || "free",
            created_at: user.created_at,
            subscriptions: [],
          }));

          setUsers(processedUsers);
          setLoading(false);
          return;
        }
      } catch (rpcError) {
        console.error("Error fetching users via RPC:", rpcError);
        // Continue to fallback methods
      }

      // Fallback: Get users from the users table with their subscriptions
      const { data, error } = await supabase
        .from("users")
        .select("*, subscriptions(*)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users from database:", error);
        fetchError = error;

        // Try to import the direct user management functions
        try {
          const { fetchUsersDirectly } = await import(
            "@/lib/direct-user-management"
          );
          const { success, users } = await fetchUsersDirectly();

          if (success && users.length > 0) {
            setUsers(users);
            return;
          }
        } catch (directError) {
          console.error("Error using direct user management:", directError);
        }

        throw error;
      }

      setUsers(data || []);

      // If we got users but there was an earlier error, show a warning
      if (fetchError && data && data.length > 0) {
        toast({
          title: "Warning",
          description:
            "Some users were loaded, but there might be issues with the database connection.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);

      // Provide specific error messages based on error type
      if (
        error.message?.includes("character varying") ||
        error.message?.includes("type mismatch")
      ) {
        toast({
          variant: "destructive",
          title: "Database Type Error",
          description:
            "There's a type mismatch in the database. Please use the Fix Database tool.",
        });
      } else if (
        error.code === "PGRST301" ||
        error.message?.includes("permission denied")
      ) {
        toast({
          variant: "destructive",
          title: "Permission Error",
          description:
            "You don't have permission to access this data. Please use the Fix Database tool.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "Failed to load users. Please try again or use the Fix Database tool.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    // Check if trying to delete admin account
    const userToDeleteData = users.find((u) => u.id === userToDelete);
    if (userToDeleteData?.role === "admin") {
      toast({
        variant: "destructive",
        title: "Cannot Delete Admin",
        description: "Admin accounts cannot be deleted for security reasons.",
      });
      setUserToDelete(null);
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      // 1. Delete subscription records first to avoid foreign key constraints
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .delete()
        .eq("user_id", userToDelete);

      if (subscriptionError) {
        console.error("Error deleting subscription:", subscriptionError);
        // Continue with user deletion even if subscription deletion fails
      }

      // 2. Delete the user from the users table
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully.",
      });

      // Refresh the user list
      fetchUsers();
      setUserToDelete(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user. Please try again.",
      });
    }
  };

  const openDeleteDialog = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id));
    }
  };

  const handleUpdateRoles = async () => {
    try {
      if (selectedUsers.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select at least one user.",
        });
        return;
      }

      setLoading(true);

      // Update role for each selected user
      for (const userId of selectedUsers) {
        // 1. Update user role in users table
        try {
          // Try using RPC function first
          const { error: rpcError } = await supabase.rpc("update_user_role", {
            p_user_id: userId,
            p_role: selectedRole,
          });

          // If RPC fails, try direct update without updated_at
          let updateError = null;
          if (rpcError) {
            console.log("RPC update failed, trying direct update");
            const result = await supabase
              .from("users")
              .update({ role: selectedRole })
              .match({ id: userId });

            updateError = result.error;

            // If match fails, try eq
            if (updateError) {
              const eqResult = await supabase
                .from("users")
                .update({ role: selectedRole })
                .eq("id", userId);

              updateError = eqResult.error;
            }
          }

          if (updateError) {
            console.error("Error updating user role:", updateError);
            throw updateError;
          }
        } catch (updateError) {
          console.error("Error updating user role:", updateError);
          throw updateError;
        }

        // 2. Update or create subscription record based on new role
        let subscriptionError = null;
        try {
          // Try with all fields first
          const result = await supabase.from("subscriptions").upsert(
            {
              user_id: userId,
              plan_type: selectedRole === "premium" ? "premium" : "free",
              status: "active",
              start_date: new Date().toISOString(),
              end_date: null,
              question_limit: selectedRole === "premium" ? -1 : 10,
              perfect_response_limit: selectedRole === "premium" ? 50 : 5,
              perfect_responses_used: 0,
            },
            { onConflict: "user_id" },
          );

          subscriptionError = result.error;

          if (
            subscriptionError &&
            subscriptionError.message?.includes("question_limit")
          ) {
            // Try without the problematic fields
            const fallbackResult = await supabase.from("subscriptions").upsert(
              {
                user_id: userId,
                plan_type: selectedRole === "premium" ? "premium" : "free",
                status: "active",
                start_date: new Date().toISOString(),
                end_date: null,
              },
              { onConflict: "user_id" },
            );

            subscriptionError = fallbackResult.error;
          }
        } catch (error) {
          // Try with minimal fields as a last resort
          try {
            const minimalResult = await supabase.from("subscriptions").upsert(
              {
                user_id: userId,
                plan_type: selectedRole === "premium" ? "premium" : "free",
                status: "active",
                start_date: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );

            subscriptionError = minimalResult.error;
          } catch (minError) {
            console.error("Error in minimal subscription update:", minError);
            subscriptionError = { message: "Failed to update subscription" };
          }
        }

        if (subscriptionError) throw subscriptionError;
      }

      toast({
        title: "Success",
        description: `Updated ${selectedUsers.length} user(s) to ${selectedRole} role.`,
      });

      setIsRoleDialogOpen(false);
      setSelectedUsers([]);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error updating roles:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user roles. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a delay between user creation attempts to avoid rate limiting
  const handleAddUser = async () => {
    // Check if we've created a user in the last 60 seconds
    const lastCreationTime = localStorage.getItem("lastUserCreationTime");
    const now = Date.now();

    if (lastCreationTime && now - parseInt(lastCreationTime) < 60000) {
      const timeRemaining = Math.ceil(
        (60000 - (now - parseInt(lastCreationTime))) / 1000,
      );
      toast({
        variant: "destructive",
        title: "Rate Limit",
        description: `Please wait ${timeRemaining} seconds before creating another user.`,
      });
      return;
    }
    try {
      if (!newUserEmail || !newUserPassword) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please provide both email and password.",
        });
        return;
      }

      setLoading(true);

      // Check if email already exists in the users table
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("email")
        .eq("email", newUserEmail)
        .single();

      if (existingUser) {
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Email Already Exists",
          description:
            "This email address is already registered in the system.",
        });
        return;
      }

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
      });

      if (authError) throw authError;

      // 2. Add user to users table with selected role
      if (authData.user) {
        let userError;

        // Try with updated_at first
        try {
          const result = await supabase.from("users").insert({
            id: authData.user.id,
            email: newUserEmail,
            role: newUserRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          userError = result.error;

          // If there's an error with updated_at, try without it
          if (userError && userError.message?.includes("updated_at")) {
            const fallbackResult = await supabase.from("users").insert({
              id: authData.user.id,
              email: newUserEmail,
              role: newUserRole,
              created_at: new Date().toISOString(),
            });

            userError = fallbackResult.error;
          }
        } catch (error) {
          // Try without updated_at as a fallback
          const fallbackResult = await supabase.from("users").insert({
            id: authData.user.id,
            email: newUserEmail,
            role: newUserRole,
            created_at: new Date().toISOString(),
          });

          userError = fallbackResult.error;
        }

        if (userError) throw userError;

        // 3. Create subscription record for the user
        let subscriptionError = null;
        try {
          // Try with all fields first
          const result = await supabase.from("subscriptions").insert({
            user_id: authData.user.id,
            plan_type: newUserRole === "premium" ? "premium" : "free",
            start_date: new Date().toISOString(),
            end_date: null,
            status: "active",
            question_limit: newUserRole === "premium" ? -1 : 10,
            perfect_response_limit: newUserRole === "premium" ? 50 : 5,
            perfect_responses_used: 0,
          });

          subscriptionError = result.error;

          if (
            subscriptionError &&
            subscriptionError.message?.includes("question_limit")
          ) {
            // Try without the problematic fields
            const fallbackResult = await supabase.from("subscriptions").insert({
              user_id: authData.user.id,
              plan_type: newUserRole === "premium" ? "premium" : "free",
              start_date: new Date().toISOString(),
              end_date: null,
              status: "active",
            });

            subscriptionError = fallbackResult.error;
          }
        } catch (error) {
          // Try with minimal fields as a last resort
          try {
            const minimalResult = await supabase.from("subscriptions").insert({
              user_id: authData.user.id,
              plan_type: newUserRole === "premium" ? "premium" : "free",
              start_date: new Date().toISOString(),
              status: "active",
            });

            subscriptionError = minimalResult.error;
          } catch (minError) {
            console.error("Error in minimal subscription creation:", minError);
            subscriptionError = { message: "Failed to create subscription" };
          }
        }

        if (subscriptionError) throw subscriptionError;
      }

      // Store the current time as the last creation time
      localStorage.setItem("lastUserCreationTime", Date.now().toString());

      toast({
        title: "Success",
        description: `User ${newUserEmail} added successfully with ${newUserRole} role.`,
      });

      setIsAddUserDialogOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("free");
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error adding user:", error);

      // Handle specific error types
      if (error.message?.includes("rate limit") || error.status === 429) {
        toast({
          variant: "destructive",
          title: "Rate Limit Exceeded",
          description: "Please wait a minute before creating another user.",
        });
      } else if (
        error.message?.includes("updated_at") ||
        error.message?.includes("schema cache")
      ) {
        toast({
          variant: "destructive",
          title: "Database Schema Error",
          description:
            "There was an issue with the database schema. The 'updated_at' column might be missing.",
        });
      } else if (
        error.code === "23505" ||
        error.message?.includes("duplicate key")
      ) {
        toast({
          variant: "destructive",
          title: "Email Already Exists",
          description:
            "This email address is already registered in the system.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to add user: ${error.message || "Unknown error"}`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportUsers = () => {
    try {
      // Prepare data for export
      const exportData = filteredUsers.map((user) => ({
        email: user.email,
        role: user.role,
        created_at: new Date(user.created_at).toLocaleDateString(),
      }));

      // Convert to CSV
      const headers = ["Email", "Role", "Created At"];
      const csvContent =
        headers.join(",") +
        "\n" +
        exportData
          .map((row) =>
            Object.values(row)
              .map((value) => `"${value}"`) // Wrap in quotes to handle commas in values
              .join(","),
          )
          .join("\n");

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `users_export_${new Date().getTime()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} users to CSV.`,
      });
    } catch (error) {
      console.error("Error exporting users:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export users. Please try again.",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`;
    } catch (e) {
      return "N/A";
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isAdmin) {
    return null; // Don't render anything for non-admin users
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 mx-auto max-w-7xl">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-4xl font-bold">User Management</h1>
      </div>

      {users.length === 0 && (
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              No Users Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-4">
              No users were found in the database. This could be because:
            </p>
            <ul className="list-disc list-inside mb-6 space-y-2 text-amber-700">
              <li>
                Users exist in Supabase Auth but not in the public.users table
              </li>
              <li>Row Level Security (RLS) policies are preventing access</li>
              <li>The database connection is not working properly</li>
            </ul>
            <div className="flex justify-end">
              <Button
                onClick={() => navigate("/admin/fix-database")}
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white mr-4"
              >
                Fix Database
              </Button>
              <Button
                onClick={() => navigate("/admin/fix-users")}
                className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
              >
                Fix User Permissions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={fetchUsers}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh Users
            </Button>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleExportUsers}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            <Dialog
              open={isAddUserDialogOpen}
              onOpenChange={setIsAddUserDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account with a specific role.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right">Email</label>
                    <Input
                      className="col-span-3"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right">Password</label>
                    <Input
                      className="col-span-3"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right">Role</label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free User</SelectItem>
                        <SelectItem value="premium">Premium User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddUserDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddUser}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
                  >
                    {loading ? "Adding..." : "Add User"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={selectedUsers.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Update Roles
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Update User Roles</DialogTitle>
                  <DialogDescription>
                    Change role for {selectedUsers.length} selected user(s).
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right">Role</label>
                    <Select
                      value={selectedRole}
                      onValueChange={setSelectedRole}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free User</SelectItem>
                        <SelectItem value="premium">Premium User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsRoleDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateRoles}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                  >
                    Update Roles
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : user.role === "premium" ||
                                (user.subscriptions &&
                                  user.subscriptions[0]?.plan_type ===
                                    "premium")
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role === "admin" ? (
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </div>
                        ) : user.role === "premium" ||
                          (user.subscriptions &&
                            user.subscriptions[0]?.plan_type === "premium") ? (
                          "Premium"
                        ) : (
                          "Free"
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUsers([user.id]);
                            setIsRoleDialogOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit Role
                        </Button>
                        {user.role !== "admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(user.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Information Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            Role Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Admin</h3>
              <p className="text-sm text-gray-600">
                Full access to all features and admin panel. Can manage users
                and content.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Premium User</h3>
              <p className="text-sm text-gray-600">
                Access to all premium features including unlimited questions and
                perfect responses.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Free User</h3>
              <p className="text-sm text-gray-600">
                Limited access with restrictions on number of questions and
                perfect responses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
