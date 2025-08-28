import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const userService = req.scope.resolve(Modules.USER);
  const authService = req.scope.resolve(Modules.AUTH);
  
  const adminEmail = process.env.MEDUSA_ADMIN_EMAIL || "admin@kctmenswear.com";
  const adminPassword = process.env.MEDUSA_ADMIN_PASSWORD || "127598";
  
  try {
    // Check if user exists
    const existingUsers = await userService.listUsers({ email: adminEmail });
    
    let user;
    if (existingUsers?.length > 0) {
      user = existingUsers[0];
      console.log("User already exists:", user.id);
    } else {
      // Create user
      const createdUsers = await userService.createUsers([{
        email: adminEmail,
        first_name: "Admin",
        last_name: "User"
      }]);
      user = createdUsers[0];
      console.log("Created user:", user.id);
    }
    
    // Check if auth identity exists
    const authIdentities = await authService.listAuthIdentities({
      app_metadata: {
        user_id: user.id
      }
    });
    
    if (authIdentities?.length > 0) {
      return res.json({ 
        success: true, 
        message: "Admin user already configured",
        user_id: user.id 
      });
    }
    
    // Try to find existing auth identity by email
    const existingAuth = await authService.listAuthIdentities({
      provider_identities: {
        entity_id: adminEmail
      }
    });
    
    if (existingAuth?.length > 0) {
      // Update existing auth identity to link with user
      await authService.updateAuthIdentities({
        id: existingAuth[0].id,
        app_metadata: {
          user_id: user.id
        }
      });
      
      return res.json({ 
        success: true, 
        message: "Linked existing auth to user",
        user_id: user.id,
        auth_id: existingAuth[0].id
      });
    }
    
    // Create new auth identity
    const authIdentity = await authService.createAuthIdentities([{
      provider_identities: [{
        entity_id: adminEmail,
        provider: "emailpass"
      }],
      app_metadata: {
        user_id: user.id
      }
    }]);
    
    return res.json({ 
      success: true, 
      message: "Admin user created and configured",
      user_id: user.id,
      auth_id: authIdentity[0].id
    });
    
  } catch (error) {
    console.error("Error creating admin:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};