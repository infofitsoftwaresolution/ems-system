# SSH Connection Troubleshooting

## Issue: Permission denied (publickey)

The key file is valid, but authentication is failing. This means the key is not associated with your EC2 instance.

## Solutions:

### Option 1: Verify the Correct Key Pair

1. Go to AWS Console → EC2 → Instances
2. Select your instance (13.233.73.43)
3. Check the "Key pair name" in the details
4. Make sure you're using the correct `.pem` file that matches this key pair

### Option 2: Check if Key Pair is Correct

The key you're using: `rsamridhi.pem`
- Make sure this is the key pair you selected when launching the EC2 instance
- If you used a different key, download that key from AWS Console

### Option 3: Use AWS Systems Manager (If SSH doesn't work)

If you can't access via SSH, you can use AWS Systems Manager:

1. Go to AWS Console → EC2 → Instances
2. Select your instance
3. Click "Connect" → "Session Manager"
4. This doesn't require SSH keys

### Option 4: Add Your Key to the Instance

If you have access through AWS Console, you can add your public key:

1. Get your public key:
   ```powershell
   ssh-keygen -y -f "C:\Users\shubh\Downloads\rsamridhi.pem"
   ```

2. Use AWS Systems Manager to connect and add the key to `~/.ssh/authorized_keys`

### Option 5: Verify Username

Try different usernames based on your AMI:
- Amazon Linux 2: `ec2-user`
- Ubuntu: `ubuntu`
- CentOS: `centos`
- RHEL: `ec2-user` or `root`

## Quick Check Commands:

```powershell
# Verify key is valid (you already did this - it's valid)
ssh-keygen -l -f "C:\Users\shubh\Downloads\rsamridhi.pem"

# Try with different username
ssh -i "C:\Users\shubh\Downloads\rsamridhi.pem" ubuntu@13.233.73.43

# Get public key from private key
ssh-keygen -y -f "C:\Users\shubh\Downloads\rsamridhi.pem"
```

## Most Likely Solution:

**Check AWS Console** to verify which key pair is associated with your EC2 instance, then use that exact key file.

