import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Calendar,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { syncAllAuthUsers, directSyncUsers } from "@/lib/admin";

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [planType, setPlanType] = useState("pro");
  const [expirationDate, setExpirationDate] = useState("");

  // Only admin users should access this page
  const isAdmin =
    user?.email === "omerhar2024@gmail.com" ||
    user?.email === "omerhar206@gmail.com";

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

      // Try to sync all users first
      try {
        const { success } = await syncAllAuthUsers();
        if (!success) {
          // If that fails, try direct sync as fallback
          await directSyncUsers();
        }
      } catch (syncErr) {
        console.error("Failed to sync users:", syncErr);
        toast({
          variant: "destructive",
          title: "Error Syncing Users",
          description: "Please use the Fix Users tool in the admin dashboard.",
        });
      }

      // Then fetch the users with a slight delay to ensure DB consistency
      setTimeout(async () => {
        // First try to get users directly from auth.users via our secure function
        try {
          const { data: authUsers, error: authError } =
            await supabase.rpc("list_all_users");

          if (!authError && authUsers && authUsers.length > 0) {
            // For each auth user, ensure they exist in public.users and have a subscription
            for (const authUser of authUsers) {
              try {
                // Upsert to public.users
                await supabase.from("users").upsert(
                  {
                    id: authUser.id,
                    email: authUser.email,
                    created_at: authUser.created_at,
                    role: authUser.role || "user",
                  },
                  { onConflict: "id" },
                );

                // Ensure subscription exists (with minimal fields to avoid schema issues)
                await supabase.from("subscriptions").upsert(
                  {
                    user_id: authUser.id,
                    plan_type: "free",
                    start_date: new Date().toISOString(),
                    status: "active",
                  },
                  { onConflict: "user_id" },
                );
              } catch (userError) {
                console.error(
                  `Error processing user ${authUser.email}:`,
                  userError,
                );
              }
            }
          }
        } catch (authError) {
          console.error("Error fetching auth users:", authError);
        }

        // Now get users from public.users table with their subscriptions
        const { data, error } = await supabase
          .from("users")
          .select("*, subscriptions(*)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setUsers(data || []);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users. Please try again.",
      });
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

  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    // Check if trying to delete admin account
    const userToDeleteData = users.find((u) => u.id === userToDelete);
    if (userToDeleteData?.email === "omerhar2024@gmail.com") {
      toast({
        variant: "destructive",
        title: "Cannot Delete Admin",
        description:
          "The admin account cannot be deleted for security reasons.",
      });
      setUserToDelete(null);
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
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

  const handleGrantAccess = async () => {
    try {
      if (selectedUsers.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select at least one user.",
        });
        return;
      }

      // Calculate expiration date if provided
      let expiresAt = null;
      if (expirationDate) {
        expiresAt = new Date(expirationDate).toISOString();
      }

      // Update subscription for each selected user
      for (const userId of selectedUsers) {
        const { error } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            plan_type: planType,
            end_date: planType === "free" ? null : expiresAt, // Only set end_date for premium users
            status: "active", // Reset status to active when changing plan
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Premium access granted to ${selectedUsers.length} user(s).`,
      });

      setIsGrantDialogOpen(false);
      setSelectedUsers([]);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error granting access:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to grant premium access. Please try again.",
      });
    }
  };

  const handleExportUsers = () => {
    try {
      // Prepare data for export
      const exportData = filteredUsers.map((user) => ({
        email: user.email,
        created_at: new Date(user.created_at).toLocaleDateString(),
        subscription: user.subscriptions?.[0]?.plan_type || "free",
        subscription_end: user.subscriptions?.[0]?.expires_at
          ? new Date(user.subscriptions[0].expires_at).toLocaleDateString()
          : "N/A",
      }));

      // Convert to CSV
      const headers = [
        "Email",
        "Created At",
        "Subscription",
        "Subscription End",
      ];
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
              open={isGrantDialogOpen}
              onOpenChange={setIsGrantDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  disabled={selectedUsers.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                >
                  Grant Premium Access
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Grant Premium Access</DialogTitle>
                  <DialogDescription>
                    Grant premium access to {selectedUsers.length} selected
                    user(s).
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right">Plan Type</label>
                    <Select value={planType} onValueChange={setPlanType}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select plan type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right">Expiration Date</label>
                    <div className="col-span-3">
                      <Input
                        type="date"
                        value={expirationDate}
                        onChange={(e) => setExpirationDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsGrantDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGrantAccess}
                    className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                  >
                    Grant Access
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
                <TableHead>Subscription</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Subscription End Date</TableHead>
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
                        className={`px-2 py-1 rounded-full text-xs font-medium ${user.email === "omerhar2024@gmail.com" ? "bg-blue-100 text-blue-800" : user.subscriptions && user.subscriptions.length > 0 && user.subscriptions[0]?.plan_type === "premium" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {user.email === "omerhar2024@gmail.com"
                          ? "Admin"
                          : (user.subscriptions &&
                              user.subscriptions.length > 0 &&
                              user.subscriptions[0]?.plan_type) ||
                            "free"}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      {user.subscriptions && user.subscriptions.length > 0
                        ? formatDate(user.subscriptions[0]?.expires_at)
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUsers([user.id]);
                            setIsGrantDialogOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Grant Access
                        </Button>
                        {user.email !== "omerhar2024@gmail.com" && (
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
                  <TableCell colSpan={6} className="text-center py-4">
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
    </div>
  );
}
