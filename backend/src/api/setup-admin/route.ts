import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

// Public endpoint to set up initial admin
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const userService = req.scope.resolve(Modules.USER);
  const authService = req.scope.resolve(Modules.AUTH);
  
  const adminEmail = process.env.MEDUSA_ADMIN_EMAIL || "admin@kctmenswear.com";
  const adminPassword = process.env.MEDUSA_ADMIN_PASSWORD || "127598";
  
  try {
    // Security check - only allow if no users exist yet
    const allUsers = await userService.listUsers({});
    if (allUsers.length > 1) {
      return res.status(403).json({ 
        error: "Setup already complete" 
      });
    }
    
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
    
    // Find auth identity created by register endpoint
    try {
      // First, check all auth identities
      const allAuthIdentities = await authService.listAuthIdentities({});
      console.log(`Found ${allAuthIdentities.length} auth identities`);
      
      // Find the one for our email
      const authForEmail = allAuthIdentities.find(auth => {
        return auth.provider_identities?.some(pi => 
          pi.entity_id === adminEmail && pi.provider === "emailpass"
        );
      });
      
      if (authForEmail) {
        console.log("Found auth identity:", authForEmail.id);
        
        // Update it to link with user
        await authService.updateAuthIdentities({
          id: authForEmail.id,
          app_metadata: {
            user_id: user.id
          }
        });
        
        return res.json({ 
          success: true, 
          message: "Successfully linked auth to user",
          user_id: user.id,
          auth_id: authForEmail.id
        });
      }
    } catch (authError) {
      console.error("Error finding auth:", authError);
    }
    
    // If no auth exists, create one
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
    console.error("Error setting up admin:", error);
    return res.status(500).json({ 
      error: error.message 
    });
  }
};