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
    const users = await userService.listUsers({ email: adminEmail });
    
    if (users?.length > 0) {
      console.log("Admin user already exists");
      return;
    }
    
    // Create admin user
    const users = await userService.createUsers([{
      email: adminEmail,
      password: adminPassword,
      first_name: "Admin",
      last_name: "User"
    }]);
    
    const user = users[0];
    console.log("Admin user created successfully");
    
    // Create auth identity for the user
    await authService.createAuthIdentities([{
      entity_id: user.id,
      provider: "emailpass",
      provider_metadata: {
        email: adminEmail
      }
    }]);
    
    console.log("Auth identity created successfully");
    console.log(`You can now login with email: ${adminEmail} and your configured password`);
    
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}