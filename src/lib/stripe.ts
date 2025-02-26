import { loadStripe } from "@stripe/stripe-js";

export const stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export const PLANS = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const;

export const PLAN_DETAILS = {
  [PLANS.FREE]: {
    name: "Free",
    questions: 3,
    price: 0,
  },
  [PLANS.PRO]: {
    name: "Pro",
    questions: Infinity,
    price: 29,
  },
  [PLANS.ENTERPRISE]: {
    name: "Enterprise",
    questions: Infinity,
    price: null, // Custom pricing
  },
} as const;
