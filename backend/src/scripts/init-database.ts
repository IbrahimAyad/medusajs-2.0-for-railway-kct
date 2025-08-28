import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function initDatabase({ container }: ExecArgs) {
  console.log("Initializing database with admin user...");
  
  const queryRunner = container.resolve("query");
  const logger = container.resolve("logger");
  
  const adminEmail = process.env.MEDUSA_ADMIN_EMAIL || "admin@kctmenswear.com";
  const adminPassword = process.env.MEDUSA_ADMIN_PASSWORD || "127598";
  
  try {
    // First, let's check what's in the database
    const { data: users } = await queryRunner.graph({
      entity: "user",
      fields: ["id", "email", "first_name", "last_name"],
      filters: { email: adminEmail }
    });
    
    console.log(`Found ${users.length} users with email ${adminEmail}`);
    
    const { data: authIdentities } = await queryRunner.graph({
      entity: "auth_identity",
      fields: ["id", "provider_identities"],
    });
    
    console.log(`Found ${authIdentities.length} auth identities total`);
    
    // If no user exists, create one using direct database approach
    if (users.length === 0) {
      const userService = container.resolve(Modules.USER);
      const authService = container.resolve(Modules.AUTH);
      
      // Create user
      const createdUsers = await userService.createUsers([{
        email: adminEmail,
        first_name: "Admin",
        last_name: "User"
      }]);
      
      const user = createdUsers[0];
      logger.info(`Created user: ${user.id}`);
      
      // Try to use the authenticate method to set up password
      try {
        // First try to register
        const registerResult = await authService.register("emailpass", {
          body: {
            email: adminEmail,
            password: adminPassword
          }
        } as any);
        
        if (registerResult.success && registerResult.authIdentity) {
          // Link to user
          await authService.updateAuthIdentities({
            id: registerResult.authIdentity.id,
            app_metadata: {
              user_id: user.id
            }
          });
          logger.info("Successfully registered auth identity");
        }
      } catch (authError) {
        logger.error("Failed to register auth:", authError);
        
        // Fallback: Create auth identity directly
        try {
          await authService.createAuthIdentities([{
            provider_identities: [{
              entity_id: adminEmail,
              provider: "emailpass"
            }],
            app_metadata: {
              user_id: user.id
            }
          }]);
          logger.info("Created auth identity directly");
        } catch (createError) {
          logger.error("Failed to create auth identity:", createError);
        }
      }
    } else {
      logger.info("User already exists, checking auth...");
      
      // Check if auth identity exists
      const authService = container.resolve(Modules.AUTH);
      
      try {
        const authResult = await authService.authenticate("emailpass", {
          body: {
            email: adminEmail,
            password: adminPassword
          }
        } as any);
        
        if (authResult.success) {
          logger.info("Authentication works!");
        } else {
          logger.warn("Authentication failed, may need to reset password");
        }
      } catch (error) {
        logger.error("Auth check failed:", error);
      }
    }
    
    logger.info("Database initialization complete");
    
  } catch (error) {
    logger.error("Database initialization failed:", error);
    throw error;
  }
}