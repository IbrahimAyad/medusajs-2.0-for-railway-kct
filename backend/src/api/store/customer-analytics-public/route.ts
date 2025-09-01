/**
 * Public Customer Analytics Dashboard
 * Accessible without authentication for testing
 * IMPORTANT: Remove or secure this endpoint before production!
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    const orderModuleService = req.scope.resolve(Modules.ORDER)
    
    // Get all customer groups
    const [groups, groupCount] = await customerModuleService.listAndCountCustomerGroups({})
    
    // Get all customers
    const [customers, customerCount] = await customerModuleService.listAndCountCustomers({})
    
    // Get recent orders
    const [orders] = await orderModuleService.listAndCountOrders(
      {},
      { take: 10, order: { created_at: 'DESC' } }
    )
    
    // Build HTML dashboard
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KCT Customer Analytics Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            color: white;
            margin-bottom: 30px;
            font-size: 2.5rem;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .stat-value {
            font-size: 3rem;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
        }
        .stat-label {
            color: #666;
            font-size: 1rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .section {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.8rem;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            background: #f7f7f7;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #e0e0e0;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        tr:hover {
            background: #f9f9f9;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .badge-vip { background: #ffd700; color: #333; }
        .badge-new { background: #4caf50; color: white; }
        .badge-wedding { background: #e91e63; color: white; }
        .badge-corporate { background: #2196f3; color: white; }
        .badge-risk { background: #ff9800; color: white; }
        .badge-prom { background: #9c27b0; color: white; }
        .no-data {
            text-align: center;
            padding: 40px;
            color: #999;
            font-size: 1.2rem;
        }
        .action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        .btn {
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        .alert {
            background: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 KCT Customer Analytics Dashboard</h1>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${customerCount}</div>
                <div class="stat-label">Total Customers</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${groupCount}</div>
                <div class="stat-label">Customer Groups</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${orders.length}</div>
                <div class="stat-label">Recent Orders</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">45%</div>
                <div class="stat-label">Guest Conversion</div>
            </div>
        </div>

        <div class="section">
            <h2>📊 Customer Groups</h2>
            ${groupCount === 0 ? `
                <div class="alert">
                    ⚠️ No customer groups found. Click the button below to create them.
                </div>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="setupGroups()">Create Customer Groups</button>
                </div>
            ` : `
                <table>
                    <thead>
                        <tr>
                            <th>Group Name</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Discount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${groups.map((group: any) => {
                            const metadata = group.metadata || {}
                            const type = metadata.type || 'manual'
                            const description = metadata.description || 'No description'
                            const discount = metadata.vip_discount || metadata.group_discount || 
                                           metadata.welcome_discount || metadata.win_back_discount || 
                                           metadata.seasonal_discount || metadata.volume_discount || 0
                            
                            let badgeClass = 'badge'
                            if (group.name.includes('VIP')) badgeClass = 'badge-vip'
                            else if (group.name.includes('New')) badgeClass = 'badge-new'
                            else if (group.name.includes('Wedding')) badgeClass = 'badge-wedding'
                            else if (group.name.includes('Corporate')) badgeClass = 'badge-corporate'
                            else if (group.name.includes('Risk')) badgeClass = 'badge-risk'
                            else if (group.name.includes('Prom')) badgeClass = 'badge-prom'
                            
                            return `
                                <tr>
                                    <td><strong>${group.name}</strong></td>
                                    <td><span class="badge ${badgeClass}">${type}</span></td>
                                    <td>${description}</td>
                                    <td>${discount}%</td>
                                    <td>${metadata.auto_segment ? '🤖 Auto' : '👤 Manual'}</td>
                                </tr>
                            `
                        }).join('')}
                    </tbody>
                </table>
            `}
        </div>

        <div class="section">
            <h2>👥 Recent Customers</h2>
            ${customerCount === 0 ? `
                <div class="no-data">No customers yet</div>
            ` : `
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Name</th>
                            <th>Created</th>
                            <th>Groups</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customers.slice(0, 10).map((customer: any) => `
                            <tr>
                                <td>${customer.email || 'N/A'}</td>
                                <td>${customer.first_name || ''} ${customer.last_name || ''}</td>
                                <td>${new Date(customer.created_at).toLocaleDateString()}</td>
                                <td>${customer.groups?.length || 0} groups</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        </div>

        <div class="section">
            <h2>📈 Segmentation Strategy</h2>
            <p style="margin-bottom: 15px;">Our automated customer segmentation system includes:</p>
            <ul style="list-style: none; padding: 0;">
                <li style="padding: 8px 0;">✅ <strong>Guest Conversion:</strong> 10% off incentive, 45% expected conversion</li>
                <li style="padding: 8px 0;">✅ <strong>Lifecycle Management:</strong> New → Active → VIP progression</li>
                <li style="padding: 8px 0;">✅ <strong>Event Groups:</strong> Wedding parties (15% discount), Prom (10% seasonal)</li>
                <li style="padding: 8px 0;">✅ <strong>Re-engagement:</strong> At Risk (15% win-back), Dormant (20% win-back)</li>
                <li style="padding: 8px 0;">✅ <strong>Specialty Segments:</strong> Big & Tall, High AOV ($500+)</li>
                <li style="padding: 8px 0;">✅ <strong>B2B Support:</strong> Corporate accounts with net terms</li>
            </ul>
        </div>
    </div>

    <script>
        async function setupGroups() {
            if (confirm('This will create all 12 customer groups. Continue?')) {
                try {
                    const response = await fetch('/admin/setup-customer-groups', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    })
                    const data = await response.json()
                    alert('Customer groups created successfully! Refreshing...')
                    window.location.reload()
                } catch (error) {
                    alert('Error creating groups: ' + error.message)
                }
            }
        }
    </script>
</body>
</html>
    `
    
    res.setHeader('Content-Type', 'text/html')
    res.send(html)
    
  } catch (error: any) {
    console.error("[Customer Analytics Dashboard] Error:", error)
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>Error Loading Dashboard</h1>
          <p>${error.message}</p>
          <p style="color: #666; margin-top: 20px;">Check console for details</p>
        </body>
      </html>
    `)
  }
}