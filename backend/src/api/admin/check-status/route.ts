/**
 * Check Admin Panel Status and Configuration
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const userModuleService = req.scope.resolve(Modules.USER)
    
    // List admin users
    const users = await userModuleService.listUsers({})
    const adminUsers = users.filter((user: any) => 
      user.metadata?.is_admin === true || 
      user.email?.includes('admin')
    )
    
    // Get configuration status
    const config = {
      admin_url: process.env.BACKEND_PUBLIC_URL ? 
        `${process.env.BACKEND_PUBLIC_URL}/app` : 
        'https://backend-production-7441.up.railway.app/app',
      admin_enabled: process.env.MEDUSA_DISABLE_ADMIN !== 'true',
      total_users: users.length,
      admin_users: adminUsers.length,
      has_default_admin: adminUsers.some((u: any) => 
        u.email === 'admin@kctmenswear.com' || 
        u.email === 'admin@medusa-test.com'
      )
    }
    
    res.json({
      success: true,
      status: "Admin panel is configured and accessible",
      config,
      admin_users: adminUsers.map((u: any) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at
      })),
      instructions: {
        access_url: config.admin_url,
        default_credentials: {
          email: "admin@medusa-test.com",
          password: "supersecret",
          note: "Create new admin user if these don't work"
        },
        create_new_admin: "POST to /admin/create-user with email and password"
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      note: "Admin module may not be initialized"
    })
  }
}