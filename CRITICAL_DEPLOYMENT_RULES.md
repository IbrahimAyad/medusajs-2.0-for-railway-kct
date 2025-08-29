# CRITICAL DEPLOYMENT RULES - DO NOT VIOLATE

## ⚠️ MUST FOLLOW - Railway Deployment Rules

### 1. ALWAYS Deploy from Project Root
```bash
# CORRECT ✅
cd /Users/ibrahim/Desktop/medusa-railway-setup
railway up --service Backend --detach

# WRONG ❌ - NEVER do this
cd /Users/ibrahim/Desktop/medusa-railway-setup/backend
railway up  # This will fail with "Could not find root directory: /backend"
```

### 2. Project Structure (DO NOT CHANGE)
```
/Users/ibrahim/Desktop/medusa-railway-setup/  ← ALWAYS run commands from here
├── backend/                                  ← Backend code lives here
├── storefront/                              ← Frontend code lives here
└── railway.json                             ← Railway config (DO NOT DELETE)
```

### 3. Never Create These Files
- ❌ `railway.toml` - Conflicts with railway.json
- ❌ `Dockerfile` in root - Railway uses Nixpacks
- ❌ `.railway/` directory - Not needed

### 4. Common Mistakes That Break Deployment

| Mistake | Result | Fix |
|---------|--------|-----|
| Running `railway up` from `/backend` | "Could not find root directory: /backend" | `cd ..` to project root |
| Creating `railway.toml` | Conflicting configurations | Delete it, use only railway.json |
| Running `railway up backend` | "prefix not found" error | Use `railway up --service Backend` |
| Using lowercase "backend" | "Service not found" | Use capital "Backend" |

### 5. Correct Deployment Commands

```bash
# From project root ONLY:
cd /Users/ibrahim/Desktop/medusa-railway-setup

# Deploy backend:
railway up --service Backend --detach

# Check logs:
railway logs --service Backend

# Check status:
railway status
```

### 6. If Deployment Fails

1. **First check your location:**
   ```bash
   pwd  # Must show: /Users/ibrahim/Desktop/medusa-railway-setup
   ```

2. **If in wrong directory:**
   ```bash
   cd /Users/ibrahim/Desktop/medusa-railway-setup
   ```

3. **Remove any conflicting files:**
   ```bash
   rm -f railway.toml
   rm -rf .railway/
   ```

4. **Deploy correctly:**
   ```bash
   railway up --service Backend --detach
   ```

## 🚨 REMEMBER
- **NEVER** run railway commands from inside `/backend` directory
- **ALWAYS** use capital "B" in `--service Backend`
- **NEVER** create railway.toml when railway.json exists
- **ALWAYS** deploy from project root

---
Last successful deployment: Aug 29, 2025
Deployment ID: 03d5f280-f098-447c-89c2-715c1fec8f86
This guide created after fixing the "Could not find root directory" error