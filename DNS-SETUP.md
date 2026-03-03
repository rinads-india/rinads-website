# DNS Setup for www.rinads.com

**Status:** Domains added to Vercel. Verification pending.

> ⚠️ **Important:** The domain is linked to another Vercel account. Add the TXT record below to verify ownership.

## Configure DNS at your domain registrar

Add these records where you manage DNS for **rinads.com** (e.g. GoDaddy, Namecheap, Cloudflare, Google Domains):

### For www.rinads.com (main site)

| Type | Name | Value |
|------|------|-------|
| **CNAME** | `www` | `ab42082f21de3e50.vercel-dns-017.com` |
| **TXT** | `_vercel` | `vc-domain-verify=www.rinads.com,11adc5c7865c197c4f74` |

### For rinads.com (redirect to www)

| Type | Name | Value |
|------|------|-------|
| **A** | `@` | `76.76.21.21` |

*(Or use CNAME if your provider supports apex CNAME.)*

---

## Steps

1. Log in to your domain registrar (where you bought rinads.com).
2. Open DNS settings for rinads.com.
3. Add the **CNAME** and **TXT** records above.
4. Save changes.
5. Wait 5–60 minutes for DNS propagation.
6. Vercel will verify automatically. Check: https://vercel.com/rinadss-projects-1ebcffe7/rinads-website/settings/domains

---

## After verification

- **www.rinads.com** → RINADS website
- **rinads.com** → Redirects to www.rinads.com
