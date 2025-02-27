import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  CalendarIcon,
  Search,
  ArrowLeft,
  UserPlus,
  Download,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [grantDetails, setGrantDetails] = useState({
    planType: "pro",
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*, subscriptions(plan_type, end_date)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Process the data to ensure subscription info is properly displayed
      const processedData = data?.map((user) => ({
        ...user,
        // If user has a subscription_status but no subscriptions array, create one
        subscriptions: user.subscriptions?.length
          ? user.subscriptions
          : user.subscription_status
            ? [{ plan_type: user.subscription_status }]
            : [],
      }));

      setUsers(processedData || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id));
    }
  };

  const handleGrantPremiumAccess = async () => {
    try {
      const { planType, expirationDate } = grantDetails;

      // Process each user individually to better handle errors
      for (const userId of selectedUsers) {
        try {
          // Update user's subscription_status in users table
          const { error: userUpdateError } = await supabase
            .from("users")
            .update({
              subscription_status: planType,
            })
            .eq("id", userId);

          if (userUpdateError) {
            console.error(
              "User update error for user",
              userId,
              userUpdateError,
            );
            throw userUpdateError;
          }

          // Create or update subscription
          const { error: subscriptionError } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              plan_type: planType,
              start_date: new Date().toISOString(),
              end_date: expirationDate.toISOString(),
            });

          if (subscriptionError) {
            console.error(
              "Subscription error for user",
              userId,
              subscriptionError,
            );
            throw subscriptionError;
          }

          // Create premium_access_grants entry
          const { error: grantError } = await supabase
            .from("premium_access_grants")
            .insert({
              user_id: userId,
              granted_by: user?.id,
              plan_type: planType,
              start_date: new Date().toISOString(),
              end_date: expirationDate.toISOString(),
            });

          if (grantError) {
            console.error("Grant error for user", userId, grantError);
            throw grantError;
          }
        } catch (userError) {
          console.error(`Error processing user ${userId}:`, userError);
          // Continue with next user instead of failing the entire operation
        }
      }

      toast({
        title: "Success",
        description: `Premium access granted to ${selectedUsers.length} user(s).`,
      });

      // Refresh users list
      fetchUsers();
      setSelectedUsers([]);
      setIsGrantDialogOpen(false);
    } catch (error) {
      console.error("Error granting premium access:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to grant premium access. Please try again.",
      });
    }
  };

  const handleExportUsers = () => {
    const csvData = [
      ["Email", "Subscription", "Created At", "Subscription End Date"],
      ...filteredUsers.map((user) => [
        user.email,
        user.subscriptions?.[0]?.plan_type || "free",
        new Date(user.created_at).toLocaleDateString(),
        user.subscriptions?.[0]?.end_date
          ? new Date(user.subscriptions[0].end_date).toLocaleDateString()
          : "N/A",
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvData.map((row) => row.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `users_export_${new Date().toISOString()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Dialog
              open={isGrantDialogOpen}
              onOpenChange={setIsGrantDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                  disabled={selectedUsers.length === 0}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Grant Premium Access
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                    <Select
                      value={grantDetails.planType}
                      onValueChange={(value) =>
                        setGrantDetails({ ...grantDetails, planType: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select plan type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right">Expiration Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="col-span-3 justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(grantDetails.expirationDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={grantDetails.expirationDate}
                          onSelect={(date) =>
                            setGrantDetails({
                              ...grantDetails,
                              expirationDate: date || new Date(),
                            })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                    onClick={handleGrantPremiumAccess}
                    className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                  >
                    Grant Access
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleExportUsers}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.length === filteredUsers.length &&
                      filteredUsers.length > 0
                    }
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
                        onChange={() => handleToggleUserSelection(user.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${user.subscriptions?.[0]?.plan_type === "pro" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {user.subscriptions?.[0]?.plan_type || "free"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {user.subscriptions?.[0]?.end_date
                        ? new Date(
                            user.subscriptions[0].end_date,
                          ).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUsers([user.id]);
                          setIsGrantDialogOpen(true);
                        }}
                      >
                        Grant Access
                      </Button>
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
    </div>
  );
}
