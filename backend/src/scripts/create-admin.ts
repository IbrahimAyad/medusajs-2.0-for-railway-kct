import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function createAdmin({ container }: ExecArgs) {
  const userService = container.resolve(Modules.USER);
  const authService = container.resolve(Modules.AUTH);
  
  const adminEmail = process.env.MEDUSA_ADMIN_EMAIL || "admin@kctmenswear.com";
  const adminPassword = process.env.MEDUSA_ADMIN_PASSWORD || "127598";
  
  console.log(`Creating admin user with email: ${adminEmail}`);
  
  try {
    // Check if user exists
    const existingUsers = await userService.listUsers({ email: adminEmail });
    
    if (existingUsers?.length > 0) {
      console.log("Admin user already exists");
      return;
    }
    
    // Create admin user without password (password is set via auth identity)
    const createdUsers = await userService.createUsers([{
      email: adminEmail,
      first_name: "Admin",
      last_name: "User"
    }]);
    
    const user = createdUsers[0];
    console.log("Admin user created successfully");
    
    // Create auth identity with password using correct structure
    await authService.createAuthIdentities([{
      provider_identities: [{
        entity_id: user.id,
        provider: "emailpass",
        user_metadata: {
          email: adminEmail,
          password: adminPassword
        }
      }]
    }]);
    
    console.log("Auth identity created successfully");
    console.log(`You can now login with email: ${adminEmail} and your configured password`);
    
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}