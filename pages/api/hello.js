/**
 * API SERVICE BY @VELVIERHACKZONE
 * Clean OSINT Proxy - No Credits, No Junk
 */

// ================== CONFIG ==================
const ADMIN_KEY = "MRWEIRDO"; 
const keys = new Set(["FUCKDEMOO"]); 

// ================== API URLS ==================
const apiUrls = {
  number: [
    "https://insure.page.gd/api.php?key=velvier&i=1&num=",
    "https://ravan-lookup.vercel.app/api?key=Ravan&type=mobile&term="
  ],
  vehicle: [
    "https://vehicle-darkgoku-api-nmhg.vercel.app/vehicle_info?vehicle_no=",
    "https://vechileinfoapi.anshppt19.workers.dev/api/rc?number="
  ],
  vehicletonumber: ["https://osintx.site/vehicle-owner.php?key=suryansh&reg="],
  aadhaar: [
    "https://allapiinone.vercel.app/?key=DEMOKEY&type=id_number&term=",
    "https://osintx.danger-vip-key.shop/api.php?key=DEMO&aadhar="
  ],
  aadharrfamily: ["https://osintx.site/family.php?term="],
  upi: ["https://osintx.site/upi.php?vpa="],
  ifsc: [
    "https://ifsc.razorpay.com/",
    "https://osintx.danger-vip-key.shop/api.php?key=DEMO&ifsc="
  ],
  pan: ["https://paninfobyrajan.vercel.app/api/lookup?pan="],
  imei: ["https://imeiinfobyrajan-ro2o.vercel.app/api/imei?num="]
};

// ================== CACHE ==================
const cache = new Map();
const CACHE_TIME = 5 * 60 * 1000;

// ================== DATA CLEANER (REMOVES CREDITS/ADS) ==================
/**
 * Recursively removes keys associated with ads, credits, and developers
 */
function cleanData(data) {
  if (!data || typeof data !== "object") return data;

  const bannedKeys = [
    "credit", "credit_by", "developer", "powered_by",
    "ads", "ad", "promo", "promotion", "sponsored",
    "api_by", "api_owner", "copyright", "_source", "extracted_address"
  ];

  if (Array.isArray(data)) {
    return data.map(item => cleanData(item));
  }

  const obj = {};
  for (const key in data) {
    const keyLower = key.toLowerCase();
    
    // Exact match or partial match for banned keywords
    let shouldSkip = bannedKeys.some(banned => keyLower.includes(banned));
    
    if (shouldSkip) continue;

    // Remove if the value itself contains typical credit handles
    const val = data[key];
    if (typeof val === "string" && (val.includes("@") || val.toLowerCase().includes("not available"))) {
        // We skip specifically known credit handles like Learnerboy
        if(val.toLowerCase().includes("learnerboy")) continue;
    }

    if (typeof data[key] === "object" && data[key] !== null) {
      obj[key] = cleanData(data[key]);
    } else {
      obj[key] = data[key];
    }
  }
  return obj;
}

// ================== CORE FETCH LOGIC ==================
async function proxyFetch(urls, term, type) {
  const cacheKey = `${type}:${term}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TIME) return cached.data;

  const results = [];

  for (const baseUrl of urls) {
    try {
      let finalUrl = baseUrl + encodeURIComponent(term);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(finalUrl, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json"
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      const text = await res.text();
      let data;
      try {
        // Extracts JSON block even if there is surrounding HTML/Text
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
      } catch (e) { continue; }

      const cleaned = cleanData(data);
      
      // Only push if the object isn't empty after cleaning
      if (cleaned && Object.keys(cleaned).length > 0) {
        results.push(cleaned);
      }

    } catch (e) { 
      console.error(`Fetch error for ${type}:`, e.message); 
    }
  }

  if (results.length === 0) throw new Error("No data found for this query.");

  const finalResponse = results.length === 1 ? results[0] : results;
  cache.set(cacheKey, { data: finalResponse, time: Date.now() });
  return finalResponse;
}

// ================== MAIN HANDLER ==================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const q = req.query || {};

  // Admin and Auth Check
  if (!q.key || (!keys.has(q.key) && q.key !== ADMIN_KEY)) {
    return res.status(403).json({ success: false, error: "Access Denied: Invalid Key" });
  }

  const type = q.type?.toLowerCase();
  const term = q.term || q.number || q.mobile || q.vehicle_no || q.pan || q.imei || q.ifsc || q.aadhar || q.vpa || q.reg;

  if (!type || !term || !apiUrls[type]) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing or invalid parameters",
      supported: Object.keys(apiUrls)
    });
  }

  try {
    const result = await proxyFetch(apiUrls[type], term, type);
    
    return res.status(200).json({
      success: true,
      status: "Found",
      data_info: { type, query: term, timestamp: new Date().toISOString() },
      result: result
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
