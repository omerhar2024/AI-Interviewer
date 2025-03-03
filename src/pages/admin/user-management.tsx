import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { createAdminClient } from "@/lib/admin-client";
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
  Database,
  Wrench,
} from "lucide-react";
import { useIsAdmin } from "@/lib/hooks/use-admin";
import { syncAllAuthUsers } from "@/lib/admin";
import { deleteUser, updateUserRole, createUser } from "@/lib/user-management";
import {
  fixCommonDatabaseIssues,
  runDatabaseDiagnostics,
} from "@/lib/debug-database";

import { useFontFix } from "@/lib/hooks/use-font-fix";

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: isAdmin } = useIsAdmin();
  // Create supabaseAdmin client
  const supabaseAdmin = createAdminClient();

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

  // Debug logging for user roles when users are loaded
  useEffect(() => {
    // When users are loaded, log their roles to check if they're correct
    if (users && users.length > 0) {
      console.log(
        "Current user roles in UI:",
        users.map((user) => ({
          email: user.email,
          role: user.role,
          subscription: user.subscriptions?.[0]?.plan_type,
          status: user.subscriptions?.[0]?.status,
        })),
      );
    }
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let fetchError = null;

      // First try to fix database schema and create missing functions
      try {
        // Try to force a complete refresh of user data
        const { forceUserDataRefresh } = await import(
          "@/lib/user-data-refresh"
        );
        await forceUserDataRefresh();
        console.log("Forced user data refresh before fetching");
      } catch (refreshError) {
        console.error("Error refreshing user data:", refreshError);
        // Continue with normal sync if refresh fails
        try {
          // Skip SQL functions since they're failing with 404
          // Just try to sync users directly
          const { success, message } = await syncAllAuthUsers();
          console.log("Sync result:", message);
        } catch (syncError) {
          console.error("Error syncing users:", syncError);
          fetchError = syncError;
        }
      }

      // Use the admin client to get the most accurate data
      try {
        console.log("Fetching users with admin client");
        const { data, error } = await supabaseAdmin
          .from("users")
          .select(
            `
            *,
            subscriptions(*)
          `,
          )
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching users with admin client:", error);
          throw error;
        }

        // Process the data to include subscription information
        const processedUsers = data.map((user) => ({
          ...user,
          // Ensure subscriptions is always an array
          subscriptions: Array.isArray(user.subscriptions)
            ? user.subscriptions
            : user.subscriptions
              ? [user.subscriptions]
              : [],
        }));

        console.log(`Fetched ${processedUsers.length} users with admin client`);
        setUsers(processedUsers);

        // Log detailed user information for debugging
        const { logUserRoles } = await import("@/lib/user-data-refresh");
        logUserRoles(processedUsers);

        return;
      } catch (adminError) {
        console.error(
          "Error fetching with admin client, trying fallbacks:",
          adminError,
        );
        // Continue to fallback methods
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
      setLoading(true);
      // Use the comprehensive deleteUser function
      const result = await deleteUser(userToDelete);

      if (result.success) {
        toast({
          title: "Success",
          description: "User deleted successfully.",
        });

        // Refresh the user list
        fetchUsers();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            result.message || "Failed to delete user. Please try again.",
        });
      }

      setUserToDelete(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user. Please try again.",
      });
    } finally {
      setLoading(false);
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

      // Track success and failures
      let successCount = 0;
      let failureCount = 0;

      // Update role for each selected user using the comprehensive function
      for (const userId of selectedUsers) {
        const result = await updateUserRole(userId, selectedRole);

        if (result.success || result.partialSuccess) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      // Force a complete refresh of user data after all updates
      try {
        const { forceUserDataRefresh } = await import(
          "@/lib/user-data-refresh"
        );
        await forceUserDataRefresh();
        console.log("Forced complete user data refresh after batch updates");
      } catch (refreshError) {
        console.error("Error forcing data refresh:", refreshError);
      }

      // Show appropriate toast based on results
      if (failureCount === 0) {
        toast({
          title: "Success",
          description: `Updated ${successCount} user(s) to ${selectedRole} role.`,
        });
      } else if (successCount > 0) {
        toast({
          variant: "warning",
          title: "Partial Success",
          description: `Updated ${successCount} user(s), but failed to update ${failureCount} user(s).`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update any user roles. Please try again.",
        });
      }

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

      // Use the comprehensive createUser function
      const result = await createUser(
        newUserEmail,
        newUserPassword,
        newUserRole,
      );

      if (result.success) {
        // Store the current time as the last creation time
        localStorage.setItem("lastUserCreationTime", Date.now().toString());

        toast({
          title: "Success",
          description:
            result.message ||
            `User ${newUserEmail} added successfully with ${newUserRole} role.`,
        });

        setIsAddUserDialogOpen(false);
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("free");
        fetchUsers(); // Refresh the user list
      } else if (result.partialSuccess) {
        // Store the current time as the last creation time
        localStorage.setItem("lastUserCreationTime", Date.now().toString());

        toast({
          variant: "warning",
          title: "Partial Success",
          description:
            result.message || "User created but some operations failed.",
        });

        setIsAddUserDialogOpen(false);
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("free");
        fetchUsers(); // Refresh the user list
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Failed to create user.",
        });
      }
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
                onClick={async () => {
                  setLoading(true);
                  try {
                    const result = await fixCommonDatabaseIssues();
                    if (result.fixes.length > 0) {
                      toast({
                        title: "Database Fixed",
                        description: `Fixed ${result.fixes.length} issues. Refreshing data...`,
                      });
                    } else if (result.issues.length > 0) {
                      toast({
                        variant: "warning",
                        title: "Issues Found",
                        description: `Found ${result.issues.length} issues but couldn't fix them automatically.`,
                      });
                    } else {
                      toast({
                        title: "Database Checked",
                        description:
                          "No issues found with the database schema.",
                      });
                    }
                    // Refresh users after fixing issues
                    await fetchUsers();
                  } catch (error) {
                    console.error("Error fixing database:", error);
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description:
                        "Failed to fix database issues. Try the Fix Database page.",
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white mr-4"
              >
                <Database className="h-4 w-4 mr-2" />
                Fix Database
              </Button>
              <Button
                onClick={() => navigate("/admin/fix-users")}
                className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
              >
                <Wrench className="h-4 w-4 mr-2" />
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
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Refreshing..." : "Refresh Users"}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                setLoading(true);
                try {
                  const diagnostics = await runDatabaseDiagnostics();
                  console.log("Database diagnostics:", diagnostics);

                  // Check for critical issues
                  const missingTables = Object.entries(diagnostics.tables)
                    .filter(([_, exists]) => !exists)
                    .map(([table]) => table);

                  const missingColumns = Object.entries(
                    diagnostics.columns,
                  ).flatMap(([table, columns]) =>
                    Object.entries(columns)
                      .filter(([_, exists]) => !exists)
                      .map(([column]) => `${table}.${column}`),
                  );

                  const missingFunctions = Object.entries(diagnostics.functions)
                    .filter(([_, exists]) => !exists)
                    .map(([func]) => func);

                  if (
                    missingTables.length > 0 ||
                    missingColumns.length > 0 ||
                    missingFunctions.length > 0
                  ) {
                    toast({
                      variant: "warning",
                      title: "Database Issues Found",
                      description: `Missing tables: ${missingTables.length}, Missing columns: ${missingColumns.length}, Missing functions: ${missingFunctions.length}. Click Fix Database to resolve.`,
                    });
                  } else {
                    toast({
                      title: "Database OK",
                      description: "No issues found with the database schema.",
                    });
                  }
                } catch (error) {
                  console.error("Error running diagnostics:", error);
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to run database diagnostics.",
                  });
                } finally {
                  setLoading(false);
                }
              }}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Database className="h-4 w-4 mr-1" />
              Check Database
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
                    <label className="text-right">Subscription</label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select subscription" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free User</SelectItem>
                        <SelectItem value="premium">Premium User</SelectItem>
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
                    <label className="text-right">Subscription</label>
                    <Select
                      value={selectedRole}
                      onValueChange={setSelectedRole}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select subscription" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free User</SelectItem>
                        <SelectItem value="premium">Premium User</SelectItem>
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
                                  ((user.subscriptions[0]?.plan_type ===
                                    "premium" &&
                                    user.subscriptions[0]?.status ===
                                      "active") ||
                                    (user.subscriptions[0]?.tier ===
                                      "premium" &&
                                      user.subscriptions[0]?.status ===
                                        "active")))
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
                            ((user.subscriptions[0]?.plan_type === "premium" &&
                              user.subscriptions[0]?.status === "active") ||
                              (user.subscriptions[0]?.tier === "premium" &&
                                user.subscriptions[0]?.status ===
                                  "active"))) ? (
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
