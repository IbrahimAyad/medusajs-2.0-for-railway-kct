import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

// Simple endpoint to link the auth identity to the user
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const authService = req.scope.resolve(Modules.AUTH);
  
  try {
    // These are the exact IDs from the debug output
    const authId = "authid_01K3Q3A60WGJVRQMCAXDH9YJJ6";
    const userId = "user_01K3Q46KTWAB81CMQFNATJRVZG";
    
    // Update the auth identity to link it to the user
    const result = await authService.updateAuthIdentities({
      id: authId,
      app_metadata: {
        user_id: userId
      }
    });
    
    return res.json({
      success: true,
      message: "Successfully linked auth identity to user",
      auth_id: authId,
      user_id: userId,
      result
    });
    
  } catch (error) {
    console.error("Error linking auth:", error);
    return res.status(500).json({ 
      error: error.message,
      manual_fix: "Run this SQL in your database: UPDATE auth_identity SET app_metadata = '{\"user_id\": \"user_01K3Q46KTWAB81CMQFNATJRVZG\"}' WHERE id = 'authid_01K3Q3A60WGJVRQMCAXDH9YJJ6';"
    });
  }
};