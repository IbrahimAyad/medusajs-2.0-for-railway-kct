import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // This is a public endpoint to fix the admin auth issue
    const authService = req.scope.resolve(Modules.AUTH);
    const userService = req.scope.resolve(Modules.USER);
    
    // Find the admin user
    const users = await userService.listUsers({ email: "admin@kctmenswear.com" });
    
    if (!users || users.length === 0) {
      return res.status(404).json({ error: "Admin user not found" });
    }
    
    const user = users[0];
    
    // Try to update the auth identity to link it to the user
    try {
      // Get auth identities
      const authIdentities = await authService.listAuthIdentities({
        provider: "emailpass"
      });
      
      // Find the one for admin email
      const adminAuth = authIdentities.find((auth: any) => 
        auth.provider_metadata?.email === "admin@kctmenswear.com"
      );
      
      if (adminAuth) {
        // Update the auth identity with the user ID
        await authService.updateAuthIdentities({
          id: adminAuth.id,
          app_metadata: {
            user_id: user.id
          }
        });
        
        return res.json({
          success: true,
          message: "Admin auth fixed",
          user_id: user.id
        });
      }
    } catch (updateError: any) {
      console.error("Update error:", updateError);
    }
    
    return res.json({
      message: "Admin user exists",
      user_id: user.id
    });
    
  } catch (error: any) {
    return res.status(500).json({
      error: error.message
    });
  }
};