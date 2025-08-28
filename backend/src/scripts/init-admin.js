const { Modules } = require("@medusajs/framework/utils");

async function initAdmin(container) {
  try {
    const userService = container.resolve(Modules.USER);
    const authService = container.resolve(Modules.AUTH);
    
    const adminEmail = process.env.MEDUSA_ADMIN_EMAIL || "admin@kctmenswear.com";
    const adminPassword = process.env.MEDUSA_ADMIN_PASSWORD || "127598";
    
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
    
    // Create auth identity with password
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
    
    console.log(`Admin user created successfully: ${adminEmail}`);
    
  } catch (error) {
    console.error("Error initializing admin:", error);
  }
}

module.exports = { initAdmin };