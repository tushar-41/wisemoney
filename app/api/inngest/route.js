import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { paymentReminder } from "@/lib/inngest/paymentReminder";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    /* your functions will be passed here later! */
   paymentReminder,
  ],
});
