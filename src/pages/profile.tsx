import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user?.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfile();
  }, [user, toast]);

  const handleUpdateEmail = async (newEmail: string) => {
    try {
      setUpdating(true);
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      toast({
        title: "Success",
        description: "Please check your email to confirm the change.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <h1 className="text-4xl font-bold mb-8">Profile</h1>

      <div className="max-w-md space-y-8">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={profile?.email || ""}
            onChange={(e) => setProfile({ ...profile!, email: e.target.value })}
          />
          <Button
            onClick={() => handleUpdateEmail(profile?.email || "")}
            disabled={updating || profile?.email === user?.email}
            className="bg-green-600 hover:bg-green-700"
          >
            Update Email
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Subscription Status</Label>
          <Input value={profile?.subscription_status || "free"} disabled />
        </div>

        <div className="space-y-2">
          <Label>Member Since</Label>
          <Input
            value={new Date(profile?.created_at || "").toLocaleDateString()}
            disabled
          />
        </div>
      </div>
    </div>
  );
}
