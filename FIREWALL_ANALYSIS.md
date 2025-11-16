# Firewall and Network Analysis

## Current Architecture

1. **Frontend**: Served via Cloudflare → HTTPS on `etymologer.com` (port 443)
2. **Backend APIs**: Running on server ports:
   - Product API: `localhost:8000`
   - Orders API: `localhost:8002`
   - Stats API: `localhost:8001`
3. **Server IP**: `46.62.144.141`
4. **Hetzner Firewall**: May be blocking external access to ports 8000, 8001, 8002

## The Real Problem

**NOT a firewall issue** - The problem is architectural:

When a browser loads the frontend from `https://etymologer.com`, the JavaScript code tries to fetch from:
```javascript
const DB_API_BASE = 'http://localhost:8000';
```

This fails because:
- `localhost` in the browser refers to the **user's local machine**, not the server
- The browser cannot connect to `http://localhost:8000` on the user's machine (nothing is running there)
- Even if the Hetzner firewall allowed port 8000, the browser would still try to connect locally

## Solutions

### Option 1: Use Server Domain/IP (Requires Firewall Open)
Update frontend to use the actual server:
```javascript
const DB_API_BASE = 'http://46.62.144.141:8000';  // or use a subdomain
```
**Requires**: Hetzner firewall to allow ports 8000, 8001, 8002

### Option 2: Use Nginx Reverse Proxy (Recommended)
Proxy API requests through nginx on port 443:
- Frontend: `https://etymologer.com/api/products/...`
- Nginx proxies to: `http://localhost:8000/...`
**Advantages**: 
- No firewall changes needed
- Uses HTTPS (secure)
- Single domain (no CORS issues)

### Option 3: Use Subdomain with Cloudflare
- Create `api.etymologer.com` → point to server IP
- Cloudflare proxies to server
- Frontend uses `https://api.etymologer.com`
**Requires**: Cloudflare DNS + firewall allows Cloudflare IPs

## Testing Firewall

To test if Hetzner firewall is blocking:

```bash
# From external machine (not the server):
curl http://46.62.144.141:8000/

# If this fails, firewall is likely blocking
# If this works, firewall is not the issue
```

## Current Status

- ✅ API is running and accessible on `localhost:8000`
- ✅ API is accessible via server IP `46.62.144.141:8000` (tested)
- ❌ Frontend uses `localhost:8000` which won't work from browser
- ❓ Hetzner firewall status unknown (needs external test)

## Recommendation

**Use Option 2 (Nginx Reverse Proxy)** - This is the standard approach and doesn't require firewall changes or exposing backend ports directly.
