import Stripe from "stripe";
import { supabase } from "../../src/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret!);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      const subscription = event.data.object as Stripe.Subscription;
      await updateSubscription(subscription);
      break;
    case "customer.subscription.deleted":
      const deletedSubscription = event.data.object as Stripe.Subscription;
      await cancelSubscription(deletedSubscription);
      break;
  }

  return new Response(JSON.stringify({ received: true }));
}

async function updateSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!user) return;

  const planType = subscription.items.data[0].price.lookup_key || "free";

  await supabase.from("subscriptions").upsert({
    user_id: user.id,
    plan_type: planType,
    stripe_subscription_id: subscription.id,
    start_date: new Date(
      subscription.current_period_start * 1000,
    ).toISOString(),
    end_date: new Date(subscription.current_period_end * 1000).toISOString(),
  });
}

async function cancelSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!user) return;

  await supabase
    .from("subscriptions")
    .update({
      plan_type: "free",
      end_date: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}
