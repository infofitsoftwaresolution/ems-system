# GitHub Secrets Setup Guide

This guide explains how to configure GitHub secrets for the EMS system CI/CD pipeline.

## Required Secrets

### 1. AWS Credentials

#### AWS_ACCESS_KEY_ID
- **Description**: Your AWS access key ID
- **How to get**: 
  1. Go to AWS Console → IAM → Users → Your User → Security credentials
  2. Create access key
  3. Copy the Access Key ID

#### AWS_SECRET_ACCESS_KEY
- **Description**: Your AWS secret access key
- **How to get**: Same as above, copy the Secret Access Key
- **Security**: Keep this secret and never share it

#### AWS_REGION
- **Description**: AWS region where your EC2 instance is located
- **Example**: `us-east-1`, `us-west-2`, `eu-west-1`

### 2. EC2 Connection Details

#### EC2_HOST
- **Description**: Public IP address of your EC2 instance
- **How to get**: 
  1. Go to AWS Console → EC2 → Instances
  2. Select your instance
  3. Copy the Public IPv4 address

#### EC2_USERNAME
- **Description**: Username for SSH connection
- **Value**: `ubuntu` (for Ubuntu instances)

#### EC2_SSH_KEY
- **Description**: Private SSH key content
- **How to get**:
  1. Open your private key file (`.pem` file)
  2. Copy the entire content including `-----BEGIN` and `-----END` lines
  3. Paste as the secret value

#### EC2_PORT
- **Description**: SSH port number
- **Value**: `22` (default SSH port)

### 3. Application Secrets

#### JWT_SECRET
- **Description**: Secret key for JWT token signing
- **How to generate**:
  ```bash
  # Generate a random secret
  openssl rand -base64 32
  ```
- **Example**: `aBcD1234EfGh5678IjKl9012MnOp3456QrSt7890UvWx`

#### GH_TOKEN
- **Description**: GitHub personal access token
- **How to create**:
  1. Go to GitHub → Settings → Developer settings → Personal access tokens
  2. Generate new token (classic)
  3. Select scopes: `repo`, `write:packages`, `read:packages`
  4. Copy the generated token
- **Note**: Use `GH_TOKEN` instead of `GITHUB_TOKEN` to avoid GitHub naming restrictions

### 4. Optional Secrets

#### SLACK_WEBHOOK
- **Description**: Slack webhook URL for deployment notifications
- **How to get**:
  1. Go to Slack → Apps → Incoming Webhooks
  2. Create webhook for your channel
  3. Copy the webhook URL

#### S3_BUCKET
- **Description**: S3 bucket name for backups
- **Example**: `ems-backups-bucket`

## How to Add Secrets

### Step 1: Navigate to Repository Settings
1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click "Secrets and variables"
4. Click "Actions"

### Step 2: Add New Secret
1. Click "New repository secret"
2. Enter the secret name (exactly as listed above)
3. Enter the secret value
4. Click "Add secret"

### Step 3: Verify Secrets
1. Go to "Actions" tab
2. Click on a workflow run
3. Check if all secrets are being used correctly

## Security Best Practices

### 1. Secret Management
- Never commit secrets to your repository
- Use environment variables in production
- Rotate secrets regularly
- Use least privilege principle

### 2. Access Control
- Limit who can access repository settings
- Use team-based access control
- Regularly review access permissions

### 3. Monitoring
- Monitor secret usage in GitHub Actions
- Set up alerts for failed deployments
- Log access to sensitive resources

## Troubleshooting

### Common Issues

#### 1. Secret Not Found
- **Error**: `Secret not found`
- **Solution**: Verify secret name is exactly correct (case-sensitive)

#### 2. Permission Denied
- **Error**: `Permission denied (publickey)`
- **Solution**: Check EC2_SSH_KEY format and EC2_USERNAME

#### 3. AWS Authentication Failed
- **Error**: `AWS authentication failed`
- **Solution**: Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

#### 4. GitHub Token Invalid
- **Error**: `GitHub token invalid`
- **Solution**: Check token permissions and expiration

### Verification Commands

#### Test SSH Connection
```bash
# Test SSH connection manually
ssh -i your-key.pem ubuntu@your-ec2-ip
```

#### Test AWS Credentials
```bash
# Test AWS credentials
aws sts get-caller-identity
```

#### Test GitHub Token
```bash
# Test GitHub token
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

## Secret Rotation

### When to Rotate
- Every 90 days (recommended)
- When team members leave
- If secrets are compromised
- After security incidents

### How to Rotate
1. Generate new secret
2. Update in GitHub repository settings
3. Test deployment
4. Remove old secret

## Environment-Specific Secrets

### Development
- Use test AWS account
- Use development EC2 instance
- Use test GitHub token

### Production
- Use production AWS account
- Use production EC2 instance
- Use production GitHub token
- Enable additional security measures

## Monitoring and Alerts

### Set Up Alerts
1. GitHub Actions notifications
2. AWS CloudWatch alarms
3. Slack notifications
4. Email alerts

### Monitor Secret Usage
1. Check GitHub Actions logs
2. Monitor AWS CloudTrail
3. Review access logs
4. Set up anomaly detection

## Backup and Recovery

### Backup Secrets
- Store secrets in secure password manager
- Use AWS Secrets Manager for production
- Document secret purposes and rotation schedules

### Recovery Procedures
1. Identify which secrets need recovery
2. Generate new secrets
3. Update all systems
4. Test functionality
5. Document the incident

## Compliance and Auditing

### Audit Trail
- GitHub Actions logs
- AWS CloudTrail
- Access logs
- Change management

### Compliance Requirements
- GDPR compliance
- SOC 2 compliance
- Industry-specific requirements
- Internal security policies

---

**Important**: Never share these secrets in plain text or commit them to version control. Always use GitHub's secret management system.
