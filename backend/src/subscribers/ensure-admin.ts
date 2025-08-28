import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export default async function ensureAdminSubscriber({
  container,
}: SubscriberArgs) {
  const userService = container.resolve(Modules.USER);
  const authService = container.resolve(Modules.AUTH);
  
  const adminEmail = process.env.MEDUSA_ADMIN_EMAIL || "admin@kctmenswear.com";
  const adminPassword = process.env.MEDUSA_ADMIN_PASSWORD || "127598";
  
  try {
    // Check if admin exists
    const users = await userService.listUsers({ email: adminEmail });
    
    if (users?.length > 0) {
      console.log("Admin user already exists");
      return;
    }
    
    // Create admin user
    const createdUsers = await userService.createUsers([{
      email: adminEmail,
      first_name: "Admin",
      last_name: "User"
    }]);
    
    const user = createdUsers[0];
    
    // Create auth identity
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
    
    console.log(`Admin user created: ${adminEmail}`);
  } catch (error) {
    console.error("Failed to ensure admin user:", error);
  }
}

export const config: SubscriberConfig = {
  event: "system.ready",
};