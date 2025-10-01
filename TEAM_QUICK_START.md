# ⚡ Team Quick Start Guide

## 🚀 One-Command Setup

```bash
# Clone and setup everything
git clone https://github.com/infofitsoftwaresolution/ems-system.git
cd ems-system
npm run setup
```

## 🎯 What This Does

1. ✅ Installs all dependencies (root, backend, frontend)
2. ✅ Seeds database with sample data
3. ✅ Creates default admin and employee accounts
4. ✅ Sets up KYC test data

## 🌐 Access the System

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 👤 Login Credentials

### Admin Account
- **Email**: `admin@ruralsamridhi.com`
- **Password**: `admin123`

### Test Employee
- **Email**: `employee@ruralsamridhi.com`
- **Password**: `employee123`

## 🛠️ Start Development

```bash
# Start both servers
npm run dev
```

## 📧 Email Setup (Optional)

1. Copy `backend/env.example` to `backend/.env`
2. Add your Gmail credentials for email features
3. Restart backend server

## 🆘 Need Help?

- Check `SETUP_GUIDE.md` for detailed instructions
- Check `TROUBLESHOOTING.md` for common issues
- Run `npm run reset` for a fresh start

---

**Ready to go! 🎉**
