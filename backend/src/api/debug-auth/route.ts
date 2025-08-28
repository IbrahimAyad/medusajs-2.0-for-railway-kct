import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

// Debug endpoint to see what's in the database
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const userService = req.scope.resolve(Modules.USER);
  const authService = req.scope.resolve(Modules.AUTH);
  const query = req.scope.resolve("query");
  
  try {
    // Get all users
    const allUsers = await userService.listUsers({});
    
    // Get all auth identities
    const { data: authIdentities } = await query.graph({
      entity: "auth_identity",
      fields: ["id", "provider_identities", "app_metadata"],
    });
    
    // Map auth data
    const authInfo = authIdentities.map(auth => ({
      id: auth.id,
      providers: auth.provider_identities?.map(pi => ({
        entity_id: pi.entity_id,
        provider: pi.provider
      })),
      app_metadata: auth.app_metadata
    }));
    
    return res.json({
      users: allUsers.map(u => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name
      })),
      auth_identities: authInfo,
      target_email: process.env.MEDUSA_ADMIN_EMAIL || "admin@kctmenswear.com"
    });
  } catch (error) {
    return res.status(500).json({ 
      error: error.message 
    });
  }
};