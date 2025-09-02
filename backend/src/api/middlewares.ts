import { defineMiddlewares } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/prepare-cart",
      middlewares: [],
    },
    {
      matcher: "/store/checkout-status",
      middlewares: [],
    },
    {
      matcher: "/admin/setup-product-pricing",
      middlewares: [],
    },
  ],
})