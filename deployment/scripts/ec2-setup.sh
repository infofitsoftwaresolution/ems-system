#!/bin/bash

# EC2 Initial Setup Script for EMS
# This script prepares an EC2 instance for EMS deployment

set -e

# Configuration
LOG_FILE="/var/log/ec2-setup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# Function to update system
update_system() {
    log "Updating system packages..."
    
    apt-get update -y
    apt-get upgrade -y
    apt-get autoremove -y
    apt-get autoclean
    
    success "System updated successfully"
}

# Function to install essential packages
install_essentials() {
    log "Installing essential packages..."
    
    apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        htop \
        vim \
        nano \
        ufw \
        fail2ban \
        logrotate \
        cron \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        jq \
        tree \
        net-tools
    
    success "Essential packages installed"
}

# Function to setup firewall
setup_firewall() {
    log "Setting up firewall..."
    
    # Reset UFW
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow custom ports if needed
    ufw allow 3001/tcp comment 'EMS Backend'
    
    # Enable firewall
    ufw --force enable
    
    success "Firewall configured"
}

# Function to setup fail2ban
setup_fail2ban() {
    log "Setting up fail2ban..."
    
    # Create jail.local
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF
    
    # Restart fail2ban
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    success "Fail2ban configured"
}

# Function to setup Docker
setup_docker() {
    log "Setting up Docker..."
    
    # Remove old Docker installations
    apt-get remove -y docker docker-engine docker.io containerd runc || true
    
    # Install Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    systemctl enable docker
    systemctl start docker
    
    # Add current user to docker group
    usermod -aG docker $SUDO_USER
    
    success "Docker installed and configured"
}

# Function to setup Docker Compose
setup_docker_compose() {
    log "Setting up Docker Compose..."
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    success "Docker Compose installed"
}

# Function to setup monitoring
setup_monitoring() {
    log "Setting up system monitoring..."
    
    # Install htop and other monitoring tools
    apt-get install -y htop iotop nethogs
    
    # Create monitoring script
    cat > /usr/local/bin/system-monitor.sh << 'EOF'
#!/bin/bash

# System monitoring script
LOG_FILE="/var/log/system-monitor.log"

echo "=== System Status $(date) ===" >> "$LOG_FILE"
echo "CPU Usage:" >> "$LOG_FILE"
top -bn1 | grep "Cpu(s)" >> "$LOG_FILE"
echo "Memory Usage:" >> "$LOG_FILE"
free -h >> "$LOG_FILE"
echo "Disk Usage:" >> "$LOG_FILE"
df -h >> "$LOG_FILE"
echo "Docker Status:" >> "$LOG_FILE"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> "$LOG_FILE"
echo "================================" >> "$LOG_FILE"
EOF
    
    chmod +x /usr/local/bin/system-monitor.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/system-monitor.sh") | crontab -
    
    success "Monitoring setup completed"
}

# Function to setup log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    # Create logrotate configuration
    cat > /etc/logrotate.d/ems-system << EOF
/var/log/ec2-setup.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}

/var/log/system-monitor.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}

/var/log/ems-deployment.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF
    
    success "Log rotation configured"
}

# Function to setup swap
setup_swap() {
    log "Setting up swap space..."
    
    # Check if swap already exists
    if [ -f /swapfile ]; then
        warning "Swap file already exists"
        return
    fi
    
    # Create swap file (2GB)
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    # Add to fstab
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    
    # Configure swappiness
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    
    success "Swap space configured"
}

# Function to optimize system
optimize_system() {
    log "Optimizing system settings..."
    
    # Update sysctl settings
    cat >> /etc/sysctl.conf << EOF

# Network optimizations
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_congestion_control = bbr

# File system optimizations
fs.file-max = 2097152
EOF
    
    # Apply settings
    sysctl -p
    
    # Update limits
    cat >> /etc/security/limits.conf << EOF

# EMS System limits
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF
    
    success "System optimized"
}

# Function to create deployment user
create_deployment_user() {
    log "Creating deployment user..."
    
    # Create ems user
    useradd -m -s /bin/bash ems || true
    
    # Add to docker group
    usermod -aG docker ems
    
    # Create .ssh directory
    mkdir -p /home/ems/.ssh
    chmod 700 /home/ems/.ssh
    chown ems:ems /home/ems/.ssh
    
    # Create deployment directory
    mkdir -p /opt/ems-deployment
    chown ems:ems /opt/ems-deployment
    
    success "Deployment user created"
}

# Function to setup SSL certificates (optional)
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Create SSL directory
    mkdir -p /etc/ssl/certs
    mkdir -p /etc/ssl/private
    
    # Generate self-signed certificate (for testing)
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/ems.key \
        -out /etc/ssl/certs/ems.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    chmod 600 /etc/ssl/private/ems.key
    chmod 644 /etc/ssl/certs/ems.crt
    
    success "SSL certificates generated"
}

# Function to show system information
show_system_info() {
    log "System Information:"
    echo "=================="
    
    echo "OS: $(lsb_release -d | cut -f2)"
    echo "Kernel: $(uname -r)"
    echo "Architecture: $(uname -m)"
    echo "CPU: $(nproc) cores"
    echo "Memory: $(free -h | awk '/^Mem:/ {print $2}')"
    echo "Disk: $(df -h / | awk 'NR==2 {print $2}')"
    echo "Docker: $(docker --version)"
    echo "Docker Compose: $(docker-compose --version)"
    
    echo -e "\nNetwork Interfaces:"
    ip addr show | grep -E "inet |UP"
    
    echo -e "\nFirewall Status:"
    ufw status
    
    echo -e "\nServices Status:"
    systemctl is-active docker
    systemctl is-active fail2ban
}

# Main setup function
main() {
    log "Starting EC2 setup for EMS..."
    
    check_root
    update_system
    install_essentials
    setup_firewall
    setup_fail2ban
    setup_docker
    setup_docker_compose
    setup_monitoring
    setup_log_rotation
    setup_swap
    optimize_system
    create_deployment_user
    setup_ssl
    
    success "EC2 setup completed successfully!"
    show_system_info
    
    log "Next steps:"
    echo "1. Configure GitHub secrets in your repository"
    echo "2. Run the deployment script: /opt/ems-deployment/deployment/scripts/deploy-to-ec2.sh"
    echo "3. Access your application at http://$(curl -s ifconfig.me)"
}

# Handle command line arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "info")
        show_system_info
        ;;
    "update")
        update_system
        ;;
    *)
        echo "Usage: $0 {setup|info|update}"
        exit 1
        ;;
esac