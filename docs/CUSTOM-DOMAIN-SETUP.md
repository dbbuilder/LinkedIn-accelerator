# Custom Domain Setup: linkedin.servicevision.io

This guide explains how to configure the custom subdomain `linkedin.servicevision.io` for the LinkedIn Accelerator application on Vercel.

## Prerequisites

- Access to servicevision.io DNS management (DigitalOcean, Cloudflare, or other DNS provider)
- Vercel project deployed and accessible

## Step 1: Add Domain in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select the **LinkedIn-accelerator** project
3. Navigate to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `linkedin.servicevision.io`
6. Click **Add**

Vercel will provide DNS configuration instructions.

## Step 2: Configure DNS Records

### Option A: Using CNAME (Recommended)

Add the following DNS record to your `servicevision.io` domain:

```
Type:  CNAME
Name:  linkedin
Value: cname.vercel-dns.com
TTL:   3600 (or Auto)
```

### Option B: Using A Record

If CNAME is not available, use A records:

```
Type:  A
Name:  linkedin
Value: 76.76.21.21
TTL:   3600
```

## Step 3: DNS Provider-Specific Instructions

### DigitalOcean (Using API Token from CLAUDE.md)

You can use the DigitalOcean API to add the DNS record:

```bash
# Set your DigitalOcean API token (get from CLAUDE.md)
export DO_TOKEN="your_digitalocean_api_token_here"

# Add CNAME record for linkedin subdomain
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DO_TOKEN" \
  -d '{
    "type": "CNAME",
    "name": "linkedin",
    "data": "cname.vercel-dns.com.",
    "ttl": 3600
  }' \
  "https://api.digitalocean.com/v2/domains/servicevision.io/records"
```

### Manual Configuration (Any DNS Provider)

1. Log into your DNS provider for `servicevision.io`
2. Navigate to DNS records/zone management
3. Add new CNAME record:
   - **Hostname/Name**: `linkedin`
   - **Points to/Value**: `cname.vercel-dns.com`
   - **TTL**: 3600 seconds (1 hour)
4. Save changes

## Step 4: Verify Configuration

### Check DNS Propagation

```bash
# Check CNAME record
dig linkedin.servicevision.io CNAME +short

# Expected output:
# cname.vercel-dns.com.
```

### Wait for DNS Propagation

- DNS changes can take 1-48 hours to fully propagate
- Typically propagates within 5-30 minutes
- Check status at: https://dnschecker.org

## Step 5: Configure SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt:

1. Once DNS is configured and verified
2. Vercel will automatically issue an SSL certificate
3. This usually takes 1-5 minutes
4. Status visible in Vercel dashboard under Domains

## Step 6: Set as Primary Domain (Optional)

If you want `linkedin.servicevision.io` to be the primary domain:

1. In Vercel project settings → Domains
2. Find `linkedin.servicevision.io`
3. Click the three dots (⋯) menu
4. Select **Set as Primary Domain**

This will redirect all other domains (like `*.vercel.app`) to your custom domain.

## Verification Checklist

- [ ] CNAME record added to DNS provider
- [ ] DNS propagation verified with `dig` command
- [ ] Domain shows as "Valid Configuration" in Vercel
- [ ] SSL certificate issued (🔒 HTTPS working)
- [ ] Site accessible at https://linkedin.servicevision.io
- [ ] Environment variables configured (if needed)

## Troubleshooting

### Domain shows "Invalid Configuration"

**Cause**: DNS records not configured or not propagated yet

**Solution**:
1. Verify DNS records are correct
2. Wait for DNS propagation (check with `dig`)
3. Click "Refresh" in Vercel domain settings

### SSL Certificate Not Issuing

**Cause**: DNS not fully propagated or CAA records blocking Let's Encrypt

**Solution**:
1. Wait for full DNS propagation
2. Check for CAA records: `dig servicevision.io CAA`
3. If CAA records exist, ensure they allow Let's Encrypt:
   ```
   servicevision.io. CAA 0 issue "letsencrypt.org"
   ```

### 404 Error on Custom Domain

**Cause**: Domain not properly linked to deployment

**Solution**:
1. Verify domain is added in Vercel project settings
2. Check that latest deployment is assigned to domain
3. Redeploy if necessary

## Quick Setup Script

```bash
#!/bin/bash
# Quick setup script for linkedin.servicevision.io

# Set variables
DOMAIN="servicevision.io"
SUBDOMAIN="linkedin"
DO_TOKEN="your_digitalocean_api_token_here"  # Get from CLAUDE.md

echo "Adding CNAME record for ${SUBDOMAIN}.${DOMAIN}..."

curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DO_TOKEN" \
  -d "{
    \"type\": \"CNAME\",
    \"name\": \"${SUBDOMAIN}\",
    \"data\": \"cname.vercel-dns.com.\",
    \"ttl\": 3600
  }" \
  "https://api.digitalocean.com/v2/domains/${DOMAIN}/records"

echo ""
echo "DNS record added! Now:"
echo "1. Add domain in Vercel dashboard"
echo "2. Wait for DNS propagation (5-30 minutes)"
echo "3. Vercel will auto-issue SSL certificate"
echo ""
echo "Check DNS: dig ${SUBDOMAIN}.${DOMAIN} CNAME +short"
```

## Environment Variables

Ensure these environment variables are set in Vercel:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- Any other required environment variables

## Final URLs

After setup, your application will be accessible at:

- **Primary**: https://linkedin.servicevision.io
- **Vercel**: https://linkedin-accelerator.vercel.app (redirects to primary if set)

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify DNS configuration with `dig` or `nslookup`
3. Contact Vercel support if SSL issues persist
4. Check DNS provider documentation for specific instructions
