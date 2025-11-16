#!/bin/bash

# HTTPS Setup Script for etymologer.com
# This script sets up SSL certificates using Let's Encrypt

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up HTTPS for etymologer.com${NC}"

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Certbot is not installed. Installing...${NC}"
    echo -e "${YELLOW}Please run: sudo apt update && sudo apt install -y certbot python3-certbot-nginx${NC}"
    exit 1
fi

# Check if nginx is running
if ! systemctl is-active --quiet nginx; then
    echo -e "${YELLOW}Starting nginx...${NC}"
    sudo systemctl start nginx
fi

# Backup current nginx config
echo -e "${YELLOW}Backing up current nginx configuration...${NC}"
sudo cp /etc/nginx/sites-available/etymologer.com /etc/nginx/sites-available/etymologer.com.backup.$(date +%Y%m%d_%H%M%S)

# Temporarily update nginx config to allow certbot verification
echo -e "${YELLOW}Updating nginx configuration for certificate verification...${NC}"
sudo tee /etc/nginx/sites-available/etymologer.com > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name etymologer.com www.etymologer.com;

    root /var/www/etymologer.com/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Test and reload nginx
echo -e "${YELLOW}Testing nginx configuration...${NC}"
sudo nginx -t

echo -e "${YELLOW}Reloading nginx...${NC}"
sudo systemctl reload nginx

# Obtain SSL certificate
echo -e "${GREEN}Obtaining SSL certificate from Let's Encrypt...${NC}"
echo -e "${YELLOW}This will automatically configure nginx for HTTPS${NC}"
sudo certbot --nginx -d etymologer.com -d www.etymologer.com --non-interactive --agree-tos --email admin@etymologer.com --redirect

if [ $? -eq 0 ]; then
    echo -e "${GREEN}SSL certificate installed successfully!${NC}"
    echo -e "${GREEN}Your site is now available at:${NC}"
    echo -e "${GREEN}  - https://etymologer.com${NC}"
    echo -e "${GREEN}  - https://www.etymologer.com${NC}"
    echo -e "${GREEN}  - http://etymologer.com (redirects to HTTPS)${NC}"
    echo -e "${GREEN}  - http://www.etymologer.com (redirects to HTTPS)${NC}"
else
    echo -e "${RED}Failed to obtain SSL certificate${NC}"
    echo -e "${YELLOW}Restoring backup configuration...${NC}"
    sudo cp /etc/nginx/sites-available/etymologer.com.backup.* /etc/nginx/sites-available/etymologer.com
    sudo nginx -t && sudo systemctl reload nginx
    exit 1
fi

# Set up auto-renewal
echo -e "${YELLOW}Setting up automatic certificate renewal...${NC}"
if ! sudo systemctl is-enabled --quiet certbot.timer; then
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
fi

echo -e "${GREEN}HTTPS setup complete!${NC}"
