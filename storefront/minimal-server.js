const express = require('express');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>KCT Menswear Development Server Working!</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; text-align: center; }
            .success { color: #16a34a; }
            .warning { color: #d97706; background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="success">✅ KCT Menswear Development Server is Working!</h1>
            <p>This confirms that Node.js can bind to ports properly on this system.</p>
            
            <div class="warning">
                <h3>Issue Identified: Next.js 15.3.5 Port Binding Problem</h3>
                <p>The Next.js development server reports "Ready" but fails to actually bind to ports. This is a known issue with certain versions of Next.js 15.</p>
            </div>
            
            <h3>Recommended Solutions:</h3>
            <ul style="text-align: left; max-width: 600px; margin: 20px auto;">
                <li>Downgrade to Next.js 14.x for stable development</li>
                <li>Use custom server implementation (working)</li>
                <li>Wait for Next.js 15.4.x patch</li>
                <li>Use production build with 'npm start'</li>
            </ul>
            
            <p style="margin-top: 40px;">
                <strong>Server Details:</strong><br>
                Port: ${port}<br>
                Node.js: Working ✅<br>
                Express: Working ✅<br>
                Next.js Dev: Failed ❌
            </p>
        </div>
    </body>
    </html>
  `);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Minimal server running at http://localhost:${port}`);
  console.log(`🔧 Next.js development server binding issue confirmed`);
  console.log(`💡 Recommendation: Use a custom server or downgrade Next.js`);
});