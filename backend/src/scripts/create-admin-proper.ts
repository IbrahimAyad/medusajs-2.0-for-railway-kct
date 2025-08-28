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
      
      // Try to authenticate to verify it works
      try {
        const authResult = await authService.authenticate("emailpass", {
          body: {
            email: adminEmail,
            password: adminPassword
          }
        });
        
        if (authResult.success) {
          console.log("Admin user can authenticate successfully");
        }
      } catch (authError) {
        console.log("Admin exists but auth might need fixing");
      }
      
      return;
    }
    
    // 1. Create admin user
    const createdUsers = await userService.createUsers([{
      email: adminEmail,
      first_name: "Admin",
      last_name: "User"
    }]);
    
    const user = createdUsers[0];
    console.log("Admin user created successfully");
    
    // 2. Register authentication using the register method
    const authIdentity = await authService.register("emailpass", {
      body: {
        email: adminEmail,
        password: adminPassword
      }
    });
    
    if (!authIdentity.success) {
      throw new Error(`Failed to register auth: ${authIdentity.error}`);
    }
    
    // 3. Update auth identity with user association
    if (authIdentity.authIdentity) {
      await authService.updateAuthIdentities({
        id: authIdentity.authIdentity.id,
        app_metadata: {
          user_id: user.id
        }
      });
    }
    
    console.log("Auth identity created and linked successfully");
    console.log(`You can now login with email: ${adminEmail}`);
    
  } catch (error) {
    console.error("Error creating admin user:", error);
    
    // Fallback approach - try alternative method
    try {
      console.log("Attempting alternative approach...");
      
      const existingUsers = await userService.listUsers({ email: adminEmail });
      let user = existingUsers[0];
      
      if (!user) {
        const createdUsers = await userService.createUsers([{
          email: adminEmail,
          first_name: "Admin",
          last_name: "User"
        }]);
        user = createdUsers[0];
      }
      
      // Alternative: Create auth identity directly
      const authIdentities = await authService.createAuthIdentities([{
        provider_identities: [{
          entity_id: adminEmail, // Use email as entity_id for emailpass
          provider: "emailpass"
        }],
        app_metadata: {
          user_id: user.id
        }
      }]);
      
      console.log("Alternative approach succeeded");
    } catch (altError) {
      console.error("Alternative approach also failed:", altError);
      throw error;
    }
  }
}