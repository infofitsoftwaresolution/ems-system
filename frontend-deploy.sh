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

# Pull and run frontend container
docker pull 777555685730.dkr.ecr.us-east-1.amazonaws.com/ems-frontend:latest
docker run -d --name ems-frontend -p 80:80 -p 443:443 \
  -e BACKEND_URL=http://13.220.223.74:3001 \
  -e NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx \
  --restart unless-stopped \
  777555685730.dkr.ecr.us-east-1.amazonaws.com/ems-frontend:latest
