# Marketing Site Deployment Guide

## Initial Server Setup (One-Time)

SSH into your server and run these commands:

```bash
ssh root@5.78.155.116
```

### 1. Install Dependencies (if not already installed)

```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 globally (if not already installed)
npm install -g pm2

# Install Nginx (if not already installed)
apt-get update
apt-get install -y nginx
```

### 2. Create Log Directory

```bash
mkdir -p /root/logs
```

### 3. Create Marketing Site Directory

```bash
cd /root/marketing-machine
mkdir -p marketing-site
```

### 4. Configure Nginx

```bash
# Copy the nginx.conf file to Nginx sites-available
cp /root/marketing-machine/marketing-site/nginx.conf /etc/nginx/sites-available/marketing-site

# Create symbolic link to enable the site
ln -s /etc/nginx/sites-available/marketing-site /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Note: You'll need to set up SSL before reloading Nginx (see SSL Setup below)
```

### 5. Set up SSL with Let's Encrypt

```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate (make sure your domain DNS is pointing to this server first!)
certbot --nginx -d trymarketingmachine.com -d www.trymarketingmachine.com

# Certbot will automatically configure Nginx with SSL
# Reload Nginx
systemctl reload nginx
```

### 6. Configure PM2 to Start on Boot

```bash
pm2 startup systemd
# Follow the command it outputs
pm2 save
```

## DNS Configuration

Before deploying, make sure your DNS is configured:

1. Go to your domain registrar (where you bought trymarketingmachine.com)
2. Add/Update these DNS records:
   - `A` record: `trymarketingmachine.com` → `5.78.155.116`
   - `A` record: `www.trymarketingmachine.com` → `5.78.155.116`
3. Wait for DNS propagation (can take up to 48 hours, usually much faster)

## Deployment

### First Deployment

After completing the server setup:

```bash
# On your local machine, in the marketing-site directory
chmod +x deploy.sh
./deploy.sh
```

### Subsequent Deployments

Just run the deploy script whenever you want to update the site:

```bash
./deploy.sh
```

## Monitoring

### Check PM2 Status

```bash
ssh root@5.78.155.116
pm2 status
pm2 logs marketing-site
```

### Check Nginx Status

```bash
ssh root@5.78.155.116
systemctl status nginx
nginx -t  # Test configuration
```

### View Logs

```bash
ssh root@5.78.155.116
pm2 logs marketing-site  # Live logs
tail -f /root/logs/marketing-site-error.log  # Error logs
tail -f /var/log/nginx/marketing-site-access.log  # Nginx access logs
```

## Troubleshooting

### Site Not Loading

1. Check if Next.js is running:
   ```bash
   pm2 status
   pm2 logs marketing-site
   ```

2. Check Nginx configuration:
   ```bash
   nginx -t
   systemctl status nginx
   ```

3. Check if port 3002 is being used:
   ```bash
   lsof -i :3002
   ```

### SSL Issues

If SSL isn't working:

```bash
# Renew certificate
certbot renew

# Check certificate status
certbot certificates
```

### Restart Services

```bash
# Restart marketing site
pm2 restart marketing-site

# Restart Nginx
systemctl restart nginx
```

## Architecture

```
Internet
    ↓
Nginx (Port 80/443)
    ↓ (proxy to port 3002)
PM2 → Next.js App (Port 3002)
```

## Environment Variables

The marketing site doesn't currently need any environment variables. If you need to add them:

1. Create a `.env.production` file on the server
2. Update the PM2 ecosystem.config.js to load them
3. Redeploy

## Domain Structure

- **trymarketingmachine.com** → Marketing site (this deployment)
- **app.trymarketingmachine.com** → Main app (separate deployment)

If you want to also deploy the main app, you'll need a separate Nginx configuration for the app subdomain.
