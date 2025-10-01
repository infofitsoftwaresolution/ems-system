#!/bin/bash

# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI for ECR
aws configure set region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 777555685730.dkr.ecr.us-east-1.amazonaws.com

# Pull and run backend container
docker pull 777555685730.dkr.ecr.us-east-1.amazonaws.com/ems-backend:latest
docker run -d --name ems-backend -p 3001:3001 \
  -e NODE_ENV=production \
  -e DB_PATH=/app/database.sqlite \
  -e JWT_SECRET=your-super-secret-jwt-key \
  -e PORT=3001 \
  -e LOG_LEVEL=info \
  -v /home/ec2-user/uploads:/app/uploads \
  -v /home/ec2-user/data:/app/data \
  --restart unless-stopped \
  777555685730.dkr.ecr.us-east-1.amazonaws.com/ems-backend:latest

# Create necessary directories
mkdir -p /home/ec2-user/uploads/kyc
mkdir -p /home/ec2-user/data

# Set proper permissions
sudo chown -R ec2-user:ec2-user /home/ec2-user/uploads
sudo chown -R ec2-user:ec2-user /home/ec2-user/data
