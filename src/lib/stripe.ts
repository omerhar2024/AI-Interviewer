import { loadStripe } from "@stripe/stripe-js";

export const stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export const PLANS = {
  FREE: "free",
  PRO: "pro",
} as const;

export const PLAN_DETAILS = {
  [PLANS.FREE]: {
    name: "Free",
    questions: 10,
    price: 0,
  },
  [PLANS.PRO]: {
    name: "Pro",
    questions: Infinity,
    price: 29,
  },
} as const;
