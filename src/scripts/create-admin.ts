// Temporarily disabled to fix build errors
// This script needs to be updated for Medusa v2 API changes

export default async function createAdmin() {
  console.log("Admin creation script disabled - needs update for Medusa v2");
  return;
}

/* Original code commented out - needs updating for new API
import { MedusaContainer } from '@medusajs/framework/types'

export default async function createAdmin(container: MedusaContainer) {
  const userService = container.resolve('userService')
  const authService = container.resolve('authService')
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@medusa.com'
  
  try {
    // Check if admin exists
    const existingUsers = await userService.listUsers({ email: adminEmail })
    
    if (existingUsers.length > 0) {
      console.log('Admin user already exists')
      return
    }
    
    // Create admin user - API changed, needs update
    const newUsers = await userService.createUsers([{
      email: adminEmail,
      // password field no longer exists in CreateUserDTO
      first_name: 'Admin',
      last_name: 'User'
    }])
    
    console.log('Admin user created:', newUsers[0].email)
    
    // Create auth identity - API changed
    await authService.createAuthIdentities([{
      // entity_id field changed
      provider: 'email',
      provider_metadata: {
        email: adminEmail
      }
    }])
    
    console.log('Admin auth identity created')
  } catch (error) {
    console.error('Error creating admin:', error)
  }
}
*/