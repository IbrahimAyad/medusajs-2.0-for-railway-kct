/**
 * Create Admin User
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import * as crypto from "crypto"

export const POST = async (
  req: MedusaRequest<{
    email: string
    password: string
    first_name?: string
    last_name?: string
  }>,
  res: MedusaResponse
) => {
  try {
    const userModuleService = req.scope.resolve(Modules.USER)
    
    const { email, password, first_name = "Admin", last_name = "User" } = req.body
    
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      })
    }
    
    // Check if user already exists
    const existingUsers = await userModuleService.listUsers({ email })
    if (existingUsers.length > 0) {
      return res.status(400).json({
        error: "User with this email already exists",
        user: {
          id: existingUsers[0].id,
          email: existingUsers[0].email
        }
      })
    }
    
    // Hash password using crypto (SHA-256)
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex')
    
    // Create admin user
    const user = await userModuleService.createUsers({
      email,
      password_hash: hashedPassword,
      first_name,
      last_name,
      metadata: {
        is_admin: true,
        role: "admin"
      }
    })
    
    res.json({
      success: true,
      message: "Admin user created successfully",
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      },
      admin_url: "https://backend-production-7441.up.railway.app/app",
      instructions: "You can now login to the admin panel with these credentials"
    })
    
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      note: "Error creating admin user"
    })
  }
}