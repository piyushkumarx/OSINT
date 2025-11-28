const ADMIN_KEY = process.env.ADMIN_KEY || "MRWEIRDO";
const keys = new Set(["FUCKDEMO"]); // demo key for testing

// URLs per type
const apiUrls = {
  number: [
    "https://osint-info.great-site.net/num.php?key=Vishal&phone="
  ],
  vehicle: [
    "https://osintx.info/API/new1vehicle.php?key=JONATHAN&rc=",
  ],
  aadhaar: [
    "https://osintx.info/API/aetherdemo.php?key=JONATHAN&type=id_number&term=",
    "https://osintx.danger-vip-key.shop/api.php?key=DEMO&aadhar="
  ],
  ifsc: [
    "https://ifsc.razorpay.com/",
    "https://osintx.danger-vip-key.shop/api.php?key=DEMO&ifsc="
  ]
};

// Helper to fetch from multiple URLs with cookie handling
async function proxyFetch(urls, term) {
  for (const url of urls) {
    try {
      let currentUrl = url + encodeURIComponent(term);
      let redirectCount = 0;
      const maxRedirects = 5;
      let cookies = '';

      while (redirectCount < maxRedirects) {
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        };

        // Add cookies if we have them
        if (cookies) {
          headers['Cookie'] = cookies;
        }

        const r = await fetch(currentUrl, { headers });
        
        // Update cookies from response
        const setCookie = r.headers.get('set-cookie');
        if (setCookie) {
          cookies = setCookie;
        }

        const ct = r.headers.get("content-type") || "";
        let body = await r.text();
        
        // Check if it's the encrypted response with redirect
        if (body.includes('slowAES.decrypt') && body.includes('location.href')) {
          // Extract the redirect URL from the JavaScript
          const redirectMatch = body.match(/location\.href="([^"]+)"/);
          if (redirectMatch && redirectMatch[1]) {
            currentUrl = redirectMatch[1];
            redirectCount++;
            continue; // Follow the redirect
          }
        }
        
        // Check if it's the cookies error page
        if (body.includes('Cookies are not enabled')) {
          // Try to extract and set the cookie from the JavaScript
          const cookieMatch = body.match(/document\.cookie="([^=]+)=([^;]+);/);
          if (cookieMatch && cookieMatch[1] && cookieMatch[2]) {
            cookies = `${cookieMatch[1]}=${cookieMatch[2]}`;
            redirectCount++;
            continue; // Retry with the cookie
          }
        }
        
        // If we get here, we have the final response
        let data;
        try {
          if (ct.includes("application/json") || body.trim().startsWith("{")) {
            data = JSON.parse(body);
          } else {
            data = body;
          }
        } catch {
          data = body;
        }
        
        // Return the first successful response only
        return data;
      }
      
      return { error: "Too many redirects" };
    } catch (e) {
      continue; // try next URL
    }
  }
  return { error: "No response from APIs" };
}

export default async function handler(req, res) {
  const q = req.query || {};

  // Admin endpoints
  if (req.url.includes("/api/key")) {
    const provided = q.key || "";
    if (provided !== ADMIN_KEY) {
      return res.status(401).json({ success: false, error: "invalid admin key" });
    }

    if (q.genkey) {
      const newKey = q.genkey.trim();
      keys.add(newKey);
      return res.json({ success: true, added: newKey, note: "IN-MEMORY only (prototype)" });
    }

    if (q.delkey) {
      const deleted = keys.delete(q.delkey.trim());
      return res.json({ success: true, deleted });
    }

    if ("keylist" in q) {
      return res.json({ success: true, keys: Array.from(keys) });
    }

    return res.json({ success: false, error: "No admin action specified" });
  }

  // User API
  const userKey = q.key;
  if (!userKey) return res.status(400).json({ success: false, error: "missing key" });
  if (!keys.has(userKey)) return res.status(403).json({ success: false, error: "invalid key" });

  const type = q.type;
  const term = q.term || q.number || q.mobile;
  if (!type || !term) return res.status(400).json({ success: false, error: "missing type or term" });

  const urls = apiUrls[type.toLowerCase()];
  if (!urls) return res.status(400).json({ success: false, error: "unknown type" });

  try {
    const result = await proxyFetch(urls, term);
    return res.json({
      success: true,
      APIowner: "@velvierhackzone, @Hijdksosk",
      type,
      term,
      result
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.toString() });
  }
}
