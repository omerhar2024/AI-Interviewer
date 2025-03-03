import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, emailType } = req.body;

    if (!userId || !emailType) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get subscription details if needed
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Prepare email content based on type
    let emailContent = {
      to: userData.email,
      subject: "",
      body: "",
    };

    switch (emailType) {
      case "subscription_canceled":
        emailContent.subject = "Your Subscription Has Been Canceled";
        emailContent.body = `
          <h1>Subscription Cancellation Confirmation</h1>
          <p>Hello,</p>
          <p>We're confirming that your premium subscription has been canceled as requested.</p>
          <p>You'll continue to have access to premium features until ${new Date(subscriptionData.end_date).toLocaleDateString()}.</p>
          <p>After this date, your account will automatically be converted to a free account.</p>
          <p>If you change your mind, you can reactivate your subscription at any time before the end date.</p>
          <p>Thank you for using our service!</p>
        `;
        break;

      // Add other email types as needed
      default:
        return res.status(400).json({ error: "Invalid email type" });
    }

    // In a real implementation, you would send the email here
    // using a service like SendGrid, Mailgun, etc.
    console.log("Sending email:", emailContent);

    // For now, we'll just log it and return success
    return res
      .status(200)
      .json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
