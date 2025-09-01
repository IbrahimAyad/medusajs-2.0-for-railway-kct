# Stripe Tax Configuration for KCT Menswear

## Overview
Automated tax calculation using Stripe Tax has been configured for the KCT Menswear Medusa backend. This will automatically calculate sales tax for all US states and VAT for international orders.

## What's Implemented

### 1. Custom Stripe Tax Provider
Created a custom tax provider at `backend/src/modules/stripe-tax/` that:
- Integrates with Stripe Tax API for real-time tax calculations
- Supports both US sales tax and international VAT
- Handles product-specific tax codes
- Falls back to zero tax on errors (fail-safe)

### 2. Tax Calculation Features
- **Automatic Tax Calculation**: Tax is calculated based on shipping address
- **Product Tax Codes**: Uses appropriate tax codes for clothing/apparel
- **Shipping Tax**: Correctly calculates tax on shipping charges
- **Multi-jurisdiction Support**: Handles state, county, and city taxes

## How It Works

1. **At Checkout**: When customer enters shipping address, tax is calculated automatically
2. **Tax Calculation**: Stripe Tax API determines correct tax rates based on:
   - Shipping destination
   - Product tax codes (clothing/apparel)
   - Local tax jurisdictions
3. **Display**: Tax amounts are shown in cart and checkout
4. **Compliance**: Stripe handles tax compliance and remittance

## Tax Codes Used

- **Products**: `txcd_99999999` (General tangible goods - clothing)
- **Shipping**: `txcd_92010001` (Shipping charges)

## Testing Tax Calculation

### Test with Different States:
```bash
# California (high tax state) - ~7.25-10.25%
Address: Los Angeles, CA 90001

# New York - ~8%
Address: New York, NY 10001

# Texas (no income tax, but has sales tax) - ~6.25-8.25%
Address: Houston, TX 77001

# Oregon (no sales tax)
Address: Portland, OR 97201

# International (VAT)
Address: London, UK
```

## Important Notes

1. **Stripe Tax Activation**: 
   - Stripe Tax must be activated in your Stripe Dashboard
   - Go to: Stripe Dashboard → Products → Tax → Get Started
   - Complete the onboarding process

2. **Tax Registration**:
   - You need to register for tax collection in states where you have nexus
   - Stripe will only calculate tax for registered jurisdictions
   - Configure this in Stripe Dashboard → Tax → Registrations

3. **Automatic Filing**:
   - Stripe can automatically file tax returns (additional fee)
   - Configure in Stripe Dashboard → Tax → Settings

## Environment Variables
The system uses the existing `STRIPE_API_KEY` for tax calculations. No additional configuration needed.

## Monitoring Tax Calculations

1. **Stripe Dashboard**: 
   - View all tax calculations in Stripe Dashboard → Tax → Calculations
   - See tax collected by jurisdiction

2. **Medusa Admin**:
   - Tax lines appear on orders
   - Tax breakdown shown in order details

## Troubleshooting

### Tax Not Calculating:
1. Check Stripe Tax is activated in Stripe Dashboard
2. Verify tax registrations are configured
3. Check logs for API errors
4. Ensure shipping address is complete

### Wrong Tax Rates:
1. Verify correct product tax codes
2. Check address is properly formatted
3. Review Stripe tax settings

### Zero Tax Shown:
- Oregon, Montana, New Hampshire, Delaware, Alaska have no sales tax
- International orders may show VAT based on destination
- Check if you're registered in that jurisdiction

## Frontend Implementation

The frontend needs to:
1. Display tax amounts from the cart/checkout API
2. Show tax breakdown (state, county, city if applicable)
3. Update tax when shipping address changes

Example API response with tax:
```json
{
  "cart": {
    "items": [...],
    "shipping_total": 0,
    "tax_total": 825, // $8.25 in cents
    "total": 10825, // $108.25 total
    "tax_lines": [
      {
        "description": "CA State Tax",
        "amount": 625,
        "rate": 0.0625
      },
      {
        "description": "LA County Tax", 
        "amount": 200,
        "rate": 0.02
      }
    ]
  }
}
```

## Compliance Notes

- Stripe Tax handles tax calculation but YOU are responsible for registration
- Register in states where you have economic nexus (usually $100k+ in sales)
- Stripe can handle filing if you enable their filing service
- Keep records of all tax collected for accounting purposes

## Support

For Stripe Tax issues:
- Stripe Tax Documentation: https://docs.stripe.com/tax
- Stripe Support: Available 24/7 via Dashboard
- Tax Registration Help: https://docs.stripe.com/tax/registrations