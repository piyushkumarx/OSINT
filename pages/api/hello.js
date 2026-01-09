/**
 * API SERVICE BY @VELVIERHACKZONE - UPDATED VERSION
 * Optimized for Address Recovery & Multi-Source OSINT
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
  // ... (rest of your categories remain the same)
  vehicle: ["https://vehicle-darkgoku-api-nmhg.vercel.app/vehicle_info?vehicle_no=", "https://vechileinfoapi.anshppt19.workers.dev/api/rc?number="],
  vehicletonumber: ["https://osintx.site/vehicle-owner.php?key=suryansh&reg="],
  aadhaar: ["https://allapiinone.vercel.app/?key=DEMOKEY&type=id_number&term=", "https://osintx.danger-vip-key.shop/api.php?key=DEMO&aadhar="],
  aadharrfamily: ["https://osintx.site/family.php?term="],
  upi: ["https://osintx.site/upi.php?vpa="],
  ifsc: ["https://ifsc.razorpay.com/", "https://osintx.danger-vip-key.shop/api.php?key=DEMO&ifsc="],
  pan: ["https://paninfobyrajan.vercel.app/api/lookup?pan="],
  imei: ["https://imeiinfobyrajan-ro2o.vercel.app/api/imei?num="]
};

const cache = new Map();
const CACHE_TIME = 5 * 60 * 1000;

// ================== DATA CLEANER (FIXED) ==================
function cleanData(data) {
  if (!data || typeof data !== "object") return data;

  // Reduced aggressive filtering to prevent deleting address/location data
  const bannedKeys = [
    "credit_by", "developer_info", "promo", "sponsored", 
    "api_owner", "copyright", "ads_link"
  ];

  if (Array.isArray(data)) {
    return data.map(item => cleanData(item));
  }

  const obj = {};
  for (const key in data) {
    const keyLower = key.toLowerCase();
    
    // Check if key is strictly for advertising/credits
    let shouldSkip = bannedKeys.some(banned => keyLower === banned);
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
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: controller.signal
      });
      clearTimeout(timeout);

      const text = await res.text();
      let data;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
      } catch (e) { continue; }

      const cleaned = cleanData(data);
      
      // ADDRESS EXTRACTION LOGIC
      // If it's a number lookup, ensure address/location fields are surfaced
      if (type === 'number' && cleaned) {
        cleaned.extracted_address = cleaned.address || cleaned.location || cleaned.city || "Not Available in this Source";
      }

      if (cleaned && Object.keys(cleaned).length > 0) results.push(cleaned);

    } catch (e) { console.error("Source Error:", e.message); }
  }

  if (results.length === 0) throw new Error("No data found across all sources.");

  const finalResponse = results.length === 1 ? results[0] : results;
  cache.set(cacheKey, { data: finalResponse, time: Date.now() });
  return finalResponse;
}

// ================== SERVERLESS HANDLER ==================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const q = req.query || {};

  // Auth check
  if (!q.key || (!keys.has(q.key) && q.key !== ADMIN_KEY)) {
    return res.status(403).json({ success: false, error: "Invalid API Key" });
  }

  const type = q.type?.toLowerCase();
  const term = q.term || q.number || q.mobile || q.vehicle_no || q.pan || q.imei || q.ifsc || q.aadhar || q.vpa || q.reg;

  if (!apiUrls[type]) return res.status(400).json({ success: false, error: "Invalid Type" });

  try {
    const result = await proxyFetch(apiUrls[type], term, type);
    return res.status(200).json({
      success: true,
      owner: "@velvierhackzone",
      results: result
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
