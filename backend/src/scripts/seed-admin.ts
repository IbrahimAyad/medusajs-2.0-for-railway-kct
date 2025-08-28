import { Modules } from "@medusajs/framework/utils";

export default async function seedAdmin({ container }) {
  const logger = container.resolve("logger");
  
  try {
    const userModule = container.resolve(Modules.USER);
    const authModule = container.resolve(Modules.AUTH);
    
    const adminEmail = process.env.MEDUSA_ADMIN_EMAIL || "admin@kctmenswear.com";
    const adminPassword = process.env.MEDUSA_ADMIN_PASSWORD || "127598";
    
    // Check if admin user already exists
    const existingUsers = await userModule.listUsers({
      email: adminEmail,
    });
    
    if (existingUsers?.length > 0) {
      logger.info(`Admin user ${adminEmail} already exists`);
      return;
    }
    
    // Create admin user without password (password is set via auth identity)
    const adminUsers = await userModule.createUsers([{
      email: adminEmail,
      first_name: "Admin",
      last_name: "User"
    }]);
    
    const adminUser = adminUsers[0];
    logger.info(`Admin user created: ${adminEmail}`);
    
    // Create auth identity with password
    await authModule.createAuthIdentities([{
      provider_identities: [{
        entity_id: adminUser.id,
        provider: "emailpass",
        user_metadata: {
          email: adminEmail,
          password: adminPassword
        }
      }]
    }]);
    
    logger.info("Admin user authentication identity created");
    
  } catch (error) {
    logger.error("Error creating admin user:", error);
    throw error;
  }
}