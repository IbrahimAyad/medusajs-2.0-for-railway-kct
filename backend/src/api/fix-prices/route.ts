/**
 * Quick Fix for Product Variant Prices
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const query = `
      INSERT INTO product_variant_price (id, variant_id, currency_code, amount, region_id, created_at, updated_at)
      SELECT 
        gen_random_uuid() as id,
        pv.id as variant_id,
        CASE 
          WHEN r.currency_code = 'usd' THEN 'usd'
          WHEN r.currency_code = 'eur' THEN 'eur'
          ELSE 'usd'
        END as currency_code,
        CASE 
          WHEN p.metadata->>'pricing_tier' = 'TUXEDO_PREMIUM' THEN 29999
          WHEN p.metadata->>'pricing_tier' = 'TUXEDO_STANDARD' THEN 22999
          WHEN p.metadata->>'pricing_tier' = 'TUXEDO_BASIC' THEN 19999
          WHEN p.metadata->>'pricing_tier' = 'SUIT_PREMIUM' THEN 24999
          WHEN p.metadata->>'pricing_tier' = 'SUIT_STANDARD' THEN 19999
          WHEN p.metadata->>'pricing_tier' = 'ACCESSORY' THEN 2999
          ELSE 14999
        END as amount,
        r.id as region_id,
        NOW() as created_at,
        NOW() as updated_at
      FROM product_variant pv
      JOIN product p ON pv.product_id = p.id
      CROSS JOIN region r
      WHERE NOT EXISTS (
        SELECT 1 FROM product_variant_price pvp 
        WHERE pvp.variant_id = pv.id AND pvp.region_id = r.id
      )
      LIMIT 1000;
    `
    
    // Execute using the database connection
    const knex = req.scope.resolve("__pg__")
    const result = await knex.raw(query)
    
    res.json({
      success: true,
      message: "Prices have been added to variants",
      rows_affected: result.rowCount || 0,
      note: "Run this endpoint multiple times if you have more than 1000 variants without prices"
    })
  } catch (error: any) {
    // Fallback to simpler approach
    res.json({
      message: "Please use the admin panel to set product prices",
      admin_url: "https://backend-production-7441.up.railway.app/app",
      credentials: {
        email: "admin@kctmenswear.com",
        password: "127598"
      },
      manual_steps: [
        "1. Login to admin panel",
        "2. Go to Products",
        "3. Select a product",
        "4. Add prices for each variant",
        "5. Set price for USD and EUR regions"
      ],
      error: error.message
    })
  }
}