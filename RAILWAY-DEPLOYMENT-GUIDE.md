# 🚂 Railway Deployment Guide for KCT Menswear

## ✅ **Correct Deployment Process**

### **Always Deploy From Parent Directory:**
```bash
cd /Users/ibrahim/Desktop/medusa-railway-setup
railway up --service Backend
```

### **NOT from backend directory:**
```bash
# ❌ WRONG - Don't do this:
cd backend
railway up

# ✅ CORRECT - Do this:
cd /Users/ibrahim/Desktop/medusa-railway-setup
railway up --service Backend
```

## 📝 **Important Notes:**
- Service name is **"Backend"** with capital B
- Always run from project root, not backend folder
- Railway will automatically detect the backend folder

## 🔧 **If Deployment Fails:**
1. Check you're in the right directory
2. Verify service name is correct
3. Run `railway status` to check connection

## 🚀 **Quick Deploy Command:**
```bash
cd /Users/ibrahim/Desktop/medusa-railway-setup && railway up --service Backend
```

Save this command and use it every time!