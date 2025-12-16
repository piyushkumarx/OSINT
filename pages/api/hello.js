const ADMIN_KEY = "MRWEIRDO"; // Fixed admin key
const keys = new Set(["FUCKDEMO"]); // demo key for testing

// Updated API URLs
const apiUrls = {
  number: [
    "https://flipcartstore.serv00.net/PHONE/1.php?api_key=cyberGen123&mobile="
  ],
  
  vehicle: [
    "https://vehicle-darkgoku-api-nmhg.vercel.app/vehicle_info?vehicle_no=",
    "https://vechileinfoapi.anshppt19.workers.dev/api/rc?number=",
    "https://suryansh.site/vehicle-api.php?reg="
  ],
  
  aadhaar: [
    "https://osintx.info/API/aetherdemo.php?key=JONATHAN&type=id_number&term=",
    "https://osintx.danger-vip-key.shop/api.php?key=DEMO&aadhar="
  ],
  
  ifsc: [
    "https://ifsc.razorpay.com/",
    "https://osintx.danger-vip-key.shop/api.php?key=DEMO&ifsc="
  ],
  
  pan: [
    "https://paninfobyrajan.vercel.app/api/lookup?pan="
  ],
  
  imei: [
    "https://imeiinfobyrajan-ro2o.vercel.app/api/imei?num="
  ],
  
  ration: [
    "https://example.com/ration-api?number="
  ]
};

// Cache system
const responseCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

// Main fetch function
async function proxyFetch(urls, term) {
  const results = [];
  const errors = [];
  
  const cacheKey = `${urls[0]}:${term}`;
  const cached = responseCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  for (const url of urls) {
    try {
      let currentUrl = url + encodeURIComponent(term);
      let redirectCount = 0;
      const maxRedirects = 3;
      let cookies = '';

      while (redirectCount < maxRedirects) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive'
        };

        if (cookies) {
          headers['Cookie'] = cookies;
        }

        const r = await fetch(currentUrl, { 
          headers,
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        const setCookie = r.headers.get('set-cookie');
        if (setCookie) {
          cookies = setCookie;
        }

        const ct = r.headers.get("content-type") || "";
        let body = await r.text();
        
        // Handle redirects
        if (body.includes('slowAES.decrypt') && body.includes('location.href')) {
          const redirectMatch = body.match(/location\.href="([^"]+)"/);
          if (redirectMatch && redirectMatch[1]) {
            currentUrl = redirectMatch[1];
            redirectCount++;
            continue;
          }
        }
        
        // Handle cookie errors
        if (body.includes('Cookies are not enabled')) {
          const cookieMatch = body.match(/document\.cookie="([^=]+)=([^;]+);/);
          if (cookieMatch && cookieMatch[1] && cookieMatch[2]) {
            cookies = `${cookieMatch[1]}=${cookieMatch[2]}`;
            redirectCount++;
            continue;
          }
        }
        
        // Parse response
        let data;
        try {
          if (ct.includes("application/json") || body.trim().startsWith("{") || body.trim().startsWith("[")) {
            data = JSON.parse(body);
          } else if (body.includes('<') && body.includes('>')) {
            // Simple XML/HTML extraction
            const textMatch = body.match(/>([^<>{}\[\]]+)</);
            data = textMatch ? { text: textMatch[1].trim() } : { raw: body.substring(0, 200) };
          } else {
            data = { data: body.trim() };
          }
        } catch {
          data = { raw: body.substring(0, 500) };
        }
        
        // Clean data
        data = cleanData(data);
        results.push({
          source: url.split('//')[1].split('/')[0],
          data: data,
          timestamp: new Date().toLocaleTimeString()
        });
        
        break;
      }
    } catch (e) {
      errors.push({
        url: url.split('?')[0],
        error: e.message
      });
    }
  }
  
  if (results.length === 0) {
    return { 
      error: "All APIs failed", 
      errors: errors
    };
  }
  
  const finalResult = results.length === 1 ? results[0].data : results;
  responseCache.set(cacheKey, {
    data: finalResult,
    timestamp: Date.now()
  });
  
  return finalResult;
}

// Clean data function
function cleanData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const cleaned = Array.isArray(data) ? [...data] : {...data};
  
  const removeFields = [
    'credit', 'credit_by', 'developer', 'powered_by',
    'promotion', 'credits', 'ad', 'advertisement',
    'sponsored', 'ads', 'promo', 'promotional'
  ];
  
  removeFields.forEach(field => {
    delete cleaned[field];
  });
  
  if (Array.isArray(cleaned)) {
    return cleaned.map(item => cleanData(item));
  }
  
  for (const key in cleaned) {
    if (cleaned[key] && typeof cleaned[key] === 'object') {
      cleaned[key] = cleanData(cleaned[key]);
    }
  }
  
  return cleaned;
}

// Main handler
export default async function handler(req, res) {
  const q = req.query || {};

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Admin endpoints
  if (req.url.includes("/api/key")) {
    const provided = q.key || "";
    if (provided !== ADMIN_KEY) {
      return res.status(401).json({ success: false, error: "invalid admin key" });
    }

    if (q.genkey) {
      const newKey = q.genkey.trim();
      keys.add(newKey);
      return res.json({ 
        success: true, 
        added: newKey, 
        total_keys: keys.size 
      });
    }

    if (q.delkey) {
      const deleted = keys.delete(q.delkey.trim());
      return res.json({ 
        success: true, 
        deleted: q.delkey.trim(),
        found: deleted 
      });
    }

    if ("keylist" in q) {
      return res.json({ 
        success: true, 
        keys: Array.from(keys),
        count: keys.size 
      });
    }

    return res.json({ success: false, error: "No action specified" });
  }

  // User API
  const userKey = q.key;
  if (!userKey) {
    return res.status(400).json({ 
      success: false, 
      error: "missing key",
      hint: "Add ?key=FUCKDEMO for testing" 
    });
  }
  
  if (!keys.has(userKey)) {
    return res.status(403).json({ 
      success: false, 
      error: "invalid key" 
    });
  }

  const type = q.type;
  const term = q.term || q.number || q.mobile || q.vehicle_no || q.pan || q.imei || q.ifsc;
  
  if (!type || !term) {
    return res.status(400).json({ 
      success: false, 
      error: "missing type or term",
      supported_types: Object.keys(apiUrls).join(", ")
    });
  }

  const urls = apiUrls[type.toLowerCase()];
  if (!urls) {
    return res.status(400).json({ 
      success: false, 
      error: "unknown type",
      supported_types: Object.keys(apiUrls).join(", ")
    });
  }

  // Rate limiting
  const rateKey = `${userKey}:${type}`;
  const lastCall = responseCache.get(`rate:${rateKey}`);
  if (lastCall && (Date.now() - lastCall.timestamp) < 1000) {
    return res.status(429).json({
      success: false,
      error: "Too fast, wait 1 second"
    });
  }
  responseCache.set(`rate:${rateKey}`, { timestamp: Date.now() });

  try {
    const result = await proxyFetch(urls, term);
    
    const response = {
      success: true,
      APIowner: "@velvierhackzone, @Hijdksosk",
      type: type.toLowerCase(),
      term: term,
      timestamp: new Date().toLocaleString(),
      result: result
    };

    return res.json(response);
  } catch (e) {
    return res.status(500).json({ 
      success: false, 
      error: e.message,
      type: type,
      term: term
    });
  }
}

// Test endpoints
export async function test(req, res) {
  return res.json({
    status: "API Working",
    version: "2.0",
    endpoints: Object.keys(apiUrls),
    admin_key: "MRWEIRDO",
    demo_key: "FUCKDEMO"
  });
}
