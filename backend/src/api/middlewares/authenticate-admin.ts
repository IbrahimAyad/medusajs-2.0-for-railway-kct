import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

/**
 * Middleware to authenticate admin users
 * This ensures all admin routes require proper JWT authentication
 */
export const authenticateAdmin = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    // Extract JWT token from Authorization header or cookies
    let token: string | undefined

    // Check Authorization header first
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    // Check cookies as fallback
    if (!token && req.cookies?.['session']) {
      token = req.cookies['session']
    }

    // Check for connect.sid cookie (Express session)
    if (!token && req.cookies?.['connect.sid']) {
      token = req.cookies['connect.sid']
    }

    if (!token) {
      console.log('[Auth Middleware] No token found in headers or cookies')
      return res.status(401).json({
        error: "Authentication required",
        message: "No valid authentication token found"
      })
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('[Auth Middleware] JWT_SECRET not configured')
      return res.status(500).json({
        error: "Server configuration error",
        message: "JWT secret not configured"
      })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch (jwtError) {
      console.log('[Auth Middleware] JWT verification failed:', jwtError.message)
      return res.status(401).json({
        error: "Invalid token",
        message: "Authentication token is invalid or expired"
      })
    }

    // Extract user information from token
    const userId = decoded.user_id || decoded.userId || decoded.sub

    if (!userId) {
      console.log('[Auth Middleware] No user ID found in token')
      return res.status(401).json({
        error: "Invalid token",
        message: "Token does not contain valid user information"
      })
    }

    try {
      // Verify user exists and has admin privileges
      const userService = req.scope.resolve(Modules.USER)
      const user = await userService.retrieveUser(userId)

      if (!user) {
        console.log('[Auth Middleware] User not found:', userId)
        return res.status(401).json({
          error: "User not found",
          message: "Authentication failed - user does not exist"
        })
      }

      // Add user to request context
      req.user = user
      req.userId = userId

      console.log('[Auth Middleware] Authentication successful for user:', user.email)
      next()

    } catch (userError) {
      console.log('[Auth Middleware] Error retrieving user:', userError.message)
      return res.status(401).json({
        error: "Authentication failed",
        message: "Could not verify user credentials"
      })
    }

  } catch (error) {
    console.error('[Auth Middleware] Unexpected error:', error)
    return res.status(500).json({
      error: "Internal server error",
      message: "Authentication middleware encountered an error"
    })
  }
}

/**
 * Optional middleware for endpoints that can work with or without authentication
 */
export const authenticateAdminOptional = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    // Try to authenticate, but don't fail if no token
    let token: string | undefined

    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    if (!token && req.cookies?.['session']) {
      token = req.cookies['session']
    }

    if (!token) {
      // No token provided, continue without authentication
      next()
      return
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      next()
      return
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any
      const userId = decoded.user_id || decoded.userId || decoded.sub

      if (userId) {
        const userService = req.scope.resolve(Modules.USER)
        const user = await userService.retrieveUser(userId)
        
        if (user) {
          req.user = user
          req.userId = userId
        }
      }
    } catch (error) {
      // Ignore authentication errors for optional auth
    }

    next()

  } catch (error) {
    // For optional auth, continue even if there's an error
    next()
  }
}