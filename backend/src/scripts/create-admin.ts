import { MedusaContainer } from "@medusajs/framework/types"

export default async function createAdmin(container: MedusaContainer) {
  // Admin creation is handled by init-backend.js and seed-admin.ts
  // This file is kept empty to prevent build errors
  console.log("Admin user creation handled by other scripts")
}

createAdmin.displayName = "create-admin"