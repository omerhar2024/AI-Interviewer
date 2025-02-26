import { supabase } from "./supabase";

export async function createCheckoutSession(priceId: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        priceId,
        userId: user.id,
      }),
    });

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export async function createPortalSession() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const response = await fetch("/api/create-portal-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
      }),
    });

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
