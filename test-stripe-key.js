// Quick test to check Stripe key
require("dotenv").config();

console.log("🔍 Environment Variables Check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("STRIPE_SECRET_KEY length:", process.env.STRIPE_SECRET_KEY?.length);
console.log(
  "STRIPE_SECRET_KEY first 20 chars:",
  process.env.STRIPE_SECRET_KEY?.substring(0, 20)
);
console.log(
  "STRIPE_SECRET_KEY last 10 chars:",
  process.env.STRIPE_SECRET_KEY?.substring(
    process.env.STRIPE_SECRET_KEY.length - 10
  )
);
console.log(
  "STRIPE_PUBLISHABLE_KEY length:",
  process.env.STRIPE_PUBLISHABLE_KEY?.length
);
console.log(
  "STRIPE_PUBLISHABLE_KEY first 20 chars:",
  process.env.STRIPE_PUBLISHABLE_KEY?.substring(0, 20)
);
