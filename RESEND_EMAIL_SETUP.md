# Resend Email Configuration for KCT Menswear

## ⚠️ IMPORTANT: Add these to Railway Environment Variables

### Required Environment Variables:
```bash
RESEND_API_KEY=re_2P3zWsMq_8gLFuPBBg62yT7wAt9NBpoLP
RESEND_FROM_EMAIL=orders@kctmenswear.com
```

### Optional (if you want different from addresses):
```bash
RESEND_FROM_NAME=KCT Menswear
RESEND_REPLY_TO=support@kctmenswear.com
```

## Steps to Configure in Railway:

1. Go to your Railway project dashboard
2. Select your backend service
3. Go to "Variables" tab
4. Add the environment variables above
5. Deploy/Restart the service

## What This Enables:

### Automatic Emails:
- ✅ Order confirmation emails
- ✅ Shipping notifications
- ✅ Password reset emails
- ✅ Customer registration welcome emails
- ✅ Admin invite emails
- ✅ Return confirmations

### Email Templates Already Configured:
- `order-placed.tsx` - Order confirmation
- `invite-user.tsx` - Admin invitations

## Testing Email Service:

After adding to Railway and deploying, test with:

```bash
# Create a test order to trigger order confirmation email
curl -X POST https://backend-production-7441.up.railway.app/store/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

## Verify Configuration:

The backend will automatically use Resend when these conditions are met:
1. RESEND_API_KEY is set ✅
2. RESEND_FROM_EMAIL is set ✅
3. Service is restarted ⏳

## Email Sender Requirements:

Make sure your domain (kctmenswear.com) is verified in Resend:
1. Log into Resend dashboard
2. Go to Domains
3. Add kctmenswear.com
4. Add DNS records as instructed
5. Verify domain

## Important Notes:
- Keep the API key secure (don't commit to git)
- Use orders@kctmenswear.com or noreply@kctmenswear.com as FROM address
- Ensure domain is verified in Resend for deliverability