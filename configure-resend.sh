#!/bin/bash

# Configure Resend Email Service for KCT Menswear
# This script helps set up Resend email service

echo "==================================="
echo "Configuring Resend Email Service"
echo "==================================="

# Environment variables to add to Railway
cat << EOF

Add these environment variables to Railway:

1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to "Variables" tab
4. Add these variables:

RESEND_API_KEY=re_2P3zWsMq_8gLFuPBBg62yT7wAt9NBpoLP
RESEND_FROM_EMAIL=orders@kctmenswear.com
RESEND_FROM_NAME=KCT Menswear

5. Deploy/Restart the service

==================================="
Email Features Enabled:
==================================="
✅ Order confirmation emails
✅ Shipping notifications  
✅ Password reset emails
✅ Customer welcome emails
✅ Return confirmations
✅ Admin invitations

==================================="
Testing Email Service:
==================================="
After deployment, orders will automatically send confirmation emails.

Important: Make sure kctmenswear.com is verified in your Resend dashboard!

EOF

echo "Configuration instructions ready!"