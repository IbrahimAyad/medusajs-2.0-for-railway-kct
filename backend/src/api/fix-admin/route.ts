import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

// Emergency fix endpoint for admin auth
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const userService = req.scope.resolve(Modules.USER);
  const authService = req.scope.resolve(Modules.AUTH);
  const query = req.scope.resolve("query");
  
  const adminEmail = process.env.MEDUSA_ADMIN_EMAIL || "admin@kctmenswear.com";
  
  try {
    // Get all auth identities
    const { data: authIdentities } = await query.graph({
      entity: "auth_identity",
      fields: ["id", "provider_identities", "app_metadata"],
    });
    
    console.log(`Found ${authIdentities.length} auth identities`);
    
    // Find the one for our admin email
    const adminAuth = authIdentities.find(auth => {
      return auth.provider_identities?.some(pi => 
        pi.entity_id === adminEmail && pi.provider === "emailpass"
      );
    });
    
    if (!adminAuth) {
      return res.status(404).json({ 
        error: "No auth identity found for admin email" 
      });
    }
    
    console.log("Found admin auth:", adminAuth.id);
    console.log("Current app_metadata:", adminAuth.app_metadata);
    
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
    
    // Update auth identity with direct query
    const { data: updatedAuth } = await query.graph({
      entity: "auth_identity",
      filters: { id: adminAuth.id },
      fields: ["id", "app_metadata"],
    });
    
    // Try to update using the service
    try {
      await authService.updateAuthIdentities({
        id: adminAuth.id,
        app_metadata: {
          user_id: user.id
        }
      });
      
      return res.json({ 
        success: true, 
        message: "Successfully updated auth identity",
        user_id: user.id,
        auth_id: adminAuth.id
      });
    } catch (updateError) {
      console.error("Service update failed:", updateError);
      
      // Return partial success
      return res.json({ 
        success: false, 
        message: "Could not update auth identity - manual database update required",
        user_id: user.id,
        auth_id: adminAuth.id,
        sql: `UPDATE auth_identity SET app_metadata = '{"user_id": "${user.id}"}' WHERE id = '${adminAuth.id}';`
      });
    }
    
    return res.status(500).json({ 
      error: "Could not update auth identity" 
    });
    
  } catch (error) {
    console.error("Error fixing admin:", error);
    return res.status(500).json({ 
      error: error.message 
    });
  }
};