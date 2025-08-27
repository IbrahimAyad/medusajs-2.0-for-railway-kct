import { Modules } from "@medusajs/framework/utils";

export default async function seedAdmin({ container }) {
  const logger = container.resolve("logger");
  
  try {
    const userModule = container.resolve(Modules.USER);
    
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
    
    // Create admin user
    const adminUsers = await userModule.createUsers([{
      email: adminEmail,
      password: adminPassword,
      first_name: "Admin",
      last_name: "User",
      role: "admin"
    }]);
    
    const adminUser = adminUsers[0];
    logger.info(`Admin user created: ${adminEmail}`);
    
    // Create auth identity
    const authModule = container.resolve(Modules.AUTH);
    await authModule.createAuthIdentities([{
      entity_id: adminUser.id,
      provider: "emailpass",
      provider_metadata: {
        email: adminEmail
      }
    }]);
    
    logger.info("Admin user authentication identity created");
    
  } catch (error) {
    logger.error("Error creating admin user:", error);
    throw error;
  }
}