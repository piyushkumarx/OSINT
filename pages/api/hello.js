/**
 * API SERVICE BY @VELVIERHACKZONE
 * Optimized for Ravan Lookup & Multi-Source OSINT
 */

// ================== CONFIG ==================
const ADMIN_KEY = "MRWEIRDO"; 
const keys = new Set(["FUCKDEMOO"]); 

// ================== API URLS ==================
// Updated to use only the specific APIs you requested
const apiUrls = {
  number: [
    "https://ravan-lookup.vercel.app/api?key=Ravan&type=mobile&term="
  ],

  vehicle: [
    "https://vehicle-darkgoku-api-nmhg.vercel.app/vehicle_info?vehicle_no=",
    "https://vechileinfoapi.anshppt19.workers.dev/api/rc?number="
  ],

  vehicletonumber: [
    "https://osintx.site/vehicle-owner.php?key=suryansh&reg="
  ],

  aadhaar: [
    "https://allapiinone.vercel.app/?key=DEMOKEY&type=id_number&term=",
    "https://osintx.danger-vip-key.shop/api.php?key=DEMO&aadhar="
  ],

  aadharrfamily: [
    "https://osintx.site/family.php?term="
  ],

  upi: [
    "https://osintx.site/upi.php?vpa="
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
  ]
};

// ================== CACHE SETTINGS ==================
const cache = new Map();
const CACHE_TIME = 5 * 60 * 1000; // 5 Minutes Cache

// ================== DATA CLEANER ==================
/**
 * Removes ads, credits, and promotion keys from API responses
 */
function cleanData(data) {
  if (!data || typeof data !== "object") return data;

  const bannedKeys = [
    "credit", "credit_by", "developer", "powered_by",
    "ads", "ad", "promo", "promotion", "sponsored",
    "credit_to", "credits", "developer_info", "powered",
    "api_by", "api_owner", "copyright", "_source", "msg", "status"
  ];

  if (Array.isArray(data)) {
    return data.map(item => cleanData(item));
  }

  const obj = {};
  for (const key in data) {
    const keyLower = key.toLowerCase();
    
    let shouldSkip = false;
    for (const banned of bannedKeys) {
      if (keyLower.includes(banned)) {
        shouldSkip = true;
        break;
      }
    }
    
    if (shouldSkip) continue;

    if (typeof data[key] === "object" && data[key] !== null) {
      obj[key] = cleanData(data[key]);
    } else {
      obj[key] = data[key];
    }
  }
  return obj;
}

// ================== CORE FETCH LOGIC ==================
/**
 * Handles all API requests with timeout and error handling
 */
async function proxyFetch(urls, term, type) {
  const cacheKey = `${type}:${term}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.time < CACHE_TIME) {
    return cached.data;
  }

  const results = [];
  const errors = [];

  for (const baseUrl of urls) {
    try {
      // Special logic for specific API structures if needed
      let finalUrl = baseUrl + encodeURIComponent(term);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(finalUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*"
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      const text = await res.text();
      let data;

      try {
        // Regex to extract JSON if the API returns dirty strings or HTML
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0]);
        } else {
          data = JSON.parse(text);
        }
      } catch (e) {
        data = { error: "Invalid JSON response", raw: text.slice(0, 200) };
      }

      const cleaned = cleanData(data);
      if (cleaned && Object.keys(cleaned).length > 0) {
        results.push(cleaned);
      }

    } catch (e) {
      errors.push({ url: baseUrl, error: e.message });
    }
  }

  if (results.length === 0) {
    throw new Error(errors.length > 0 ? errors[0].error : "No data found");
  }

  // If multiple APIs were hit for one type (like vehicle), return array, else single object
  const finalResponse = results.length === 1 ? results[0] : results;
  
  // Cache the final result
  cache.set(cacheKey, { data: finalResponse, time: Date.now() });
  
  return finalResponse;
}

// ================== MAIN SERVERLESS HANDLER ==================
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const q = req.query || {};

  // 1. ADMIN PANEL ROUTES
  if (req.url.includes("/api/key")) {
    if (q.key !== ADMIN_KEY) {
      return res.status(401).json({ success: false, error: "Unauthorized: Invalid Admin Key" });
    }

    if (q.genkey) {
      keys.add(q.genkey);
      return res.json({ success: true, message: "Key added successfully", key: q.genkey });
    }

    if (q.delkey) {
      const deleted = keys.delete(q.delkey);
      return res.json({ success: true, message: deleted ? "Key deleted" : "Key not found" });
    }

    if ("keylist" in q) {
      return res.json({ success: true, total: keys.size, active_keys: [...keys] });
    }
  }

  // 2. USER AUTHENTICATION
  if (!q.key) {
    return res.status(400).json({ success: false, error: "API Key is required" });
  }

  if (!keys.has(q.key) && q.key !== ADMIN_KEY) {
    return res.status(403).json({ success: false, error: "Forbidden: Invalid API Key" });
  }

  // 3. PARAMETER VALIDATION
  const type = q.type?.toLowerCase();
  // Support multiple parameter names for ease of use
  const term = q.term || q.number || q.mobile || q.vehicle_no || q.pan || q.imei || q.ifsc || q.aadhar || q.vpa || q.reg;

  if (!type || !term) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing parameters", 
      required: { type: "string", term: "string/number" },
      supported_types: Object.keys(apiUrls)
    });
  }

  if (!apiUrls[type]) {
    return res.status(400).json({ success: false, error: `Unknown type: ${type}` });
  }

  // 4. RATE LIMITING (Basic 1 req per second)
  const rateKey = `limit:${q.key}`;
  const lastReq = cache.get(rateKey);
  if (lastReq && Date.now() - lastReq.time < 1000) {
    return res.status(429).json({ success: false, error: "Rate limit exceeded. Slow down." });
  }
  cache.set(rateKey, { time: Date.now() });

  // 5. EXECUTION
  try {
    const result = await proxyFetch(apiUrls[type], term, type);
    
    return res.status(200).json({
      success: true,
      status: "Found",
      owner: "@velvierhackzone",
      data_info: {
        type: type,
        query: term,
        timestamp: new Date().toISOString()
      },
      result: result
    });

  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      error: "Service Temporarily Unavailable", 
      message: err.message 
    });
  }
}

// ================== SYSTEM STATUS ==================
export async function test(req, res) {
  return res.json({
    engine: "V2.5-Stable",
    author: "@velvierhackzone",
    modules: Object.keys(apiUrls),
    active_keys: keys.size,
    ravan_lookup: "Active",
    endpoints: {
      number: apiUrls.number[0],
      aadhaar_family: apiUrls.aadharrfamily[0]
    }
  });
}
