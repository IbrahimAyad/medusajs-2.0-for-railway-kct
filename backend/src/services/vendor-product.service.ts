import { TransactionBaseService } from "@medusajs/medusa"
import { EntityManager } from "typeorm"

type VendorProduct = {
  id: string
  shopify_product_id: string
  title: string
  vendor?: string
  status: 'pending' | 'imported' | 'rejected' | 'updated'
  vendor_price: number
  our_price?: number
  images: any[]
  variants?: VendorProductVariant[]
  metadata?: Record<string, any>
  medusa_product_id?: string
  last_synced_at: Date
  imported_at?: Date
}

type VendorProductVariant = {
  id: string
  shopify_variant_id: string
  title: string
  sku: string
  vendor_price: number
  inventory_quantity: number
  options: any[]
}

export class VendorProductService extends TransactionBaseService {
  protected manager_: EntityManager

  constructor(container) {
    super(container)
    this.manager_ = container.manager
  }

  async list(
    selector: Partial<VendorProduct> = {},
    config: { skip?: number; take?: number; order?: any } = {}
  ): Promise<VendorProduct[]> {
    const query = this.manager_
      .createQueryBuilder()
      .select("vp.*")
      .from("vendor_products", "vp")
    
    if (selector.status) {
      query.where("vp.status = :status", { status: selector.status })
    }

    if (config.skip) {
      query.offset(config.skip)
    }

    if (config.take) {
      query.limit(config.take)
    }

    if (config.order) {
      Object.entries(config.order).forEach(([key, value]) => {
        query.orderBy(`vp.${key}`, value as any)
      })
    }

    const result = await query.getRawMany()
    
    // Get variants for each product
    for (const product of result) {
      const variants = await this.manager_
        .createQueryBuilder()
        .select("*")
        .from("vendor_product_variants", "vpv")
        .where("vpv.vendor_product_id = :id", { id: product.id })
        .getRawMany()
      
      product.variants = variants
    }

    return result
  }

  async retrieve(id: string): Promise<VendorProduct | null> {
    const product = await this.manager_
      .createQueryBuilder()
      .select("*")
      .from("vendor_products", "vp")
      .where("vp.id = :id", { id })
      .getRawOne()

    if (!product) {
      return null
    }

    // Get variants
    const variants = await this.manager_
      .createQueryBuilder()
      .select("*")
      .from("vendor_product_variants", "vpv")
      .where("vpv.vendor_product_id = :id", { id })
      .getRawMany()

    product.variants = variants
    return product
  }

  async create(data: Partial<VendorProduct>): Promise<VendorProduct> {
    const id = this.generateId()
    const now = new Date()

    const { variants, ...productData } = data

    // Insert product
    await this.manager_
      .createQueryBuilder()
      .insert()
      .into("vendor_products")
      .values({
        id,
        ...productData,
        created_at: now,
        updated_at: now,
        last_synced_at: now
      })
      .execute()

    // Insert variants if provided
    if (variants && variants.length > 0) {
      const variantValues = variants.map(v => ({
        id: this.generateId(),
        vendor_product_id: id,
        ...v,
        created_at: now,
        updated_at: now
      }))

      await this.manager_
        .createQueryBuilder()
        .insert()
        .into("vendor_product_variants")
        .values(variantValues)
        .execute()
    }

    return this.retrieve(id)
  }

  async update(id: string, data: Partial<VendorProduct>): Promise<VendorProduct> {
    const { variants, ...updateData } = data

    await this.manager_
      .createQueryBuilder()
      .update("vendor_products")
      .set({
        ...updateData,
        updated_at: new Date()
      })
      .where("id = :id", { id })
      .execute()

    return this.retrieve(id)
  }

  async updateStatus(
    id: string, 
    status: 'pending' | 'imported' | 'rejected' | 'updated'
  ): Promise<VendorProduct> {
    const updateData: any = {
      status,
      updated_at: new Date()
    }

    if (status === 'imported') {
      updateData.imported_at = new Date()
    }

    await this.manager_
      .createQueryBuilder()
      .update("vendor_products")
      .set(updateData)
      .where("id = :id", { id })
      .execute()

    return this.retrieve(id)
  }

  async importToStore(vendorProductId: string, productService: any): Promise<any> {
    const vendorProduct = await this.retrieve(vendorProductId)
    
    if (!vendorProduct) {
      throw new Error("Vendor product not found")
    }

    // Create product in main store
    const medusaProduct = await productService.create({
      title: vendorProduct.title,
      description: vendorProduct.metadata?.description,
      images: vendorProduct.images?.map(img => ({ url: img })),
      options: vendorProduct.metadata?.options || [],
      variants: vendorProduct.variants?.map(v => ({
        title: v.title,
        sku: v.sku,
        barcode: v.metadata?.barcode,
        prices: [{
          amount: vendorProduct.our_price || v.vendor_price,
          currency_code: "usd"
        }],
        inventory_quantity: v.inventory_quantity,
        manage_inventory: true,
        options: v.options
      })),
      metadata: {
        vendor_product_id: vendorProductId,
        shopify_product_id: vendorProduct.shopify_product_id,
        source: 'vendor_import'
      }
    })

    // Update vendor product with medusa product id
    await this.update(vendorProductId, {
      medusa_product_id: medusaProduct.id,
      status: 'imported'
    })

    return medusaProduct
  }

  async syncFromShopify(shopifyProducts: any[]): Promise<{
    added: number
    updated: number
    total: number
  }> {
    let added = 0
    let updated = 0

    for (const shopifyProduct of shopifyProducts) {
      // Check if product exists
      const existing = await this.manager_
        .createQueryBuilder()
        .select("*")
        .from("vendor_products", "vp")
        .where("vp.shopify_product_id = :id", { id: shopifyProduct.id })
        .getRawOne()

      const productData = {
        shopify_product_id: shopifyProduct.id,
        shopify_handle: shopifyProduct.handle,
        title: shopifyProduct.title,
        vendor: shopifyProduct.vendor,
        product_type: shopifyProduct.product_type,
        tags: shopifyProduct.tags?.join(', '),
        vendor_price: parseFloat(shopifyProduct.variants?.[0]?.price || 0),
        compare_at_price: parseFloat(shopifyProduct.variants?.[0]?.compare_at_price || 0),
        description: shopifyProduct.body_html,
        images: shopifyProduct.images?.map(img => img.src) || [],
        metadata: {
          shopify_data: shopifyProduct
        }
      }

      if (existing) {
        await this.update(existing.id, {
          ...productData,
          status: existing.status === 'imported' ? 'updated' : existing.status
        })
        updated++
      } else {
        await this.create({
          ...productData,
          variants: shopifyProduct.variants?.map(v => ({
            shopify_variant_id: v.id,
            title: v.title,
            sku: v.sku,
            vendor_price: parseFloat(v.price),
            inventory_quantity: v.inventory_quantity || 0,
            options: [
              { option_id: "size", value: v.option1 },
              { option_id: "color", value: v.option2 }
            ].filter(o => o.value),
            metadata: {
              barcode: v.barcode,
              weight: v.weight,
              weight_unit: v.weight_unit
            }
          }))
        })
        added++
      }
    }

    // Log sync history
    await this.manager_
      .createQueryBuilder()
      .insert()
      .into("vendor_sync_history")
      .values({
        id: this.generateId(),
        sync_type: 'full',
        status: 'completed',
        products_synced: shopifyProducts.length,
        products_added: added,
        products_updated: updated,
        completed_at: new Date()
      })
      .execute()

    return { added, updated, total: shopifyProducts.length }
  }

  async getStats(): Promise<any> {
    const stats = await this.manager_
      .createQueryBuilder()
      .select([
        "COUNT(*) as total",
        "COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending",
        "COUNT(CASE WHEN status = 'imported' THEN 1 END) as imported",
        "COUNT(CASE WHEN status = 'updated' THEN 1 END) as needs_update",
        "COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected"
      ])
      .from("vendor_products", "vp")
      .getRawOne()

    const lastSync = await this.manager_
      .createQueryBuilder()
      .select("*")
      .from("vendor_sync_history", "vsh")
      .where("vsh.status = 'completed'")
      .orderBy("vsh.completed_at", "DESC")
      .limit(1)
      .getRawOne()

    return {
      ...stats,
      last_sync: lastSync
    }
  }

  private generateId(): string {
    return `vp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}