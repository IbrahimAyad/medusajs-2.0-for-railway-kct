import { defineMiddlewares } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/checkout-diagnostics",
      middlewares: [],
    },
    {
      matcher: "/store/cart-prepare-stripe",
      middlewares: [],
    },
    {
      matcher: "/store/stripe-payment-fix",
      middlewares: [],
    },
  ],
})