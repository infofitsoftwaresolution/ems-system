# CI/CD Implementation - Step by Step Commands

## New EC2 Instance: 13.234.30.222

Follow these commands **ONE AT A TIME** in order.

---

## Step 1: Verify EC2 Instance is Running

Go to AWS Console → EC2 → Instances and verify:
- Instance with IP `13.234.30.222` is running
- Note the "Key pair name" associated with this instance
- Make sure you have the correct `.pem` file for this key pair

---

## Step 2: Test SSH Connection

**Command 1:**
```powershell
ssh -i "C:\Users\shubh\Downloads\rsamridhi.pem" ec2-user@13.234.30.222
```

If this fails, try:
```powershell
ssh -i "C:\Users\shubh\Downloads\rsamridhi.pem" ubuntu@13.234.30.222
```

**If SSH still doesn't work:**
- Use AWS Systems Manager Session Manager (no SSH key needed)
- Or verify you have the correct key pair file

---

## Step 3: Once Connected to EC2, Install Docker

**Command 2 (on EC2):**
```bash
sudo yum update -y
```

**Command 3 (on EC2):**
```bash
sudo yum install -y docker
```

**Command 4 (on EC2):**
```bash
sudo systemctl enable docker
```

**Command 5 (on EC2):**
```bash
sudo systemctl start docker
```

**Command 6 (on EC2):**
```bash
sudo usermod -aG docker ec2-user
```

**Command 7 (on EC2):**
```bash
docker --version
```

---

## Step 4: Install Docker Compose

**Command 8 (on EC2):**
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```

**Command 9 (on EC2):**
```bash
sudo chmod +x /usr/local/bin/docker-compose
```

**Command 10 (on EC2):**
```bash
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
```

**Command 11 (on EC2):**
```bash
docker-compose --version
```

---

## Step 5: Create Deployment Directory

**Command 12 (on EC2):**
```bash
sudo mkdir -p /opt/ems-deployment
```

**Command 13 (on EC2):**
```bash
sudo chown -R ec2-user:ec2-user /opt/ems-deployment
```

**Command 14 (on EC2):**
```bash
cd /opt/ems-deployment
```

---

## Step 6: Clone Repository

**Command 15 (on EC2):**
```bash
git clone https://github.com/infofitsoftwaresolution/ems-system.git .
```

**Command 16 (on EC2):**
```bash
ls -la
```

---

## Step 7: Configure GitHub Secrets (On GitHub Website)

Go to: **https://github.com/infofitsoftwaresolution/ems-system/settings/secrets/actions**

Click **"New repository secret"** and add:

**Secret 1:**
- Name: `EC2_USERNAME`
- Value: `ec2-user` (or `ubuntu` if that's what worked)

**Secret 2:**
- Name: `EC2_SSH_KEY`
- Value: (Open your `rsamridhi.pem` file and copy ALL content including `-----BEGIN` and `-----END` lines)

**Secret 3 (Optional):**
- Name: `EC2_PORT`
- Value: `22`

**Secret 4 (Optional but recommended):**
- Name: `JWT_SECRET`
- Value: (Generate with: `openssl rand -base64 32`)

---

## Step 8: Commit and Push CI/CD Changes

**Command 17 (on your local machine):**
```powershell
cd D:\Project1\Rural_samridhi\EMS
```

**Command 18 (on your local machine):**
```powershell
git status
```

**Command 19 (on your local machine):**
```powershell
git add .
```

**Command 20 (on your local machine):**
```powershell
git commit -m "Update CI/CD for new EC2 instance 13.234.30.222"
```

**Command 21 (on your local machine):**
```powershell
git push origin main
```

---

## Step 9: Monitor Deployment

1. Go to: **https://github.com/infofitsoftwaresolution/ems-system/actions**
2. Click on the running workflow
3. Watch the deployment progress

---

## Step 10: Verify Deployment (On EC2)

**Command 22 (on EC2):**
```bash
cd /opt/ems-deployment
```

**Command 23 (on EC2):**
```bash
docker-compose -f docker-compose.production.yml ps
```

**Command 24 (on EC2):**
```bash
curl http://localhost:3001/api/health
```

---

## Troubleshooting

If deployment fails, check logs:

**Command (on EC2):**
```bash
cd /opt/ems-deployment
docker-compose -f docker-compose.production.yml logs
```

---

## Summary

✅ Updated workflow with new IP: 13.234.30.222
✅ Follow commands 1-24 in order
✅ Configure GitHub secrets (Step 7)
✅ Push code to trigger deployment

