/**
 * API SERVICE BY @VELVIERHACKZONE
 * Fixed: Address Mapping & Credit Removal
 */

const ADMIN_KEY = "MRWEIRDO"; 
const keys = new Set(["FUCKDEMOO"]); 

const apiUrls = {
  number: [
    "https://insure.page.gd/api.php?key=velvier&i=1&num=",
    "https://ravan-lookup.vercel.app/api?key=Ravan&type=mobile&term="
  ],
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

// ================== DATA CLEANER & ADDRESS FIXER ==================
function cleanAndFix(data, type) {
  if (!data || typeof data !== "object") return data;

  const bannedKeys = ["credit", "developer", "powered", "ads", "promo", "copyright", "extracted_address"];
  
  if (Array.isArray(data)) return data.map(item => cleanAndFix(item, type));

  const obj = {};
  for (const key in data) {
    const keyLower = key.toLowerCase();
    const val = data[key];

    // 1. Skip Banned Keys (Credits/Ads)
    if (bannedKeys.some(banned => keyLower.includes(banned))) continue;
    if (typeof val === "string" && (val.includes("@") || val.toLowerCase().includes("learnerboy"))) continue;

    // 2. Address Normalizer: If we find a location-related key, map it to "address"
    if (type === 'number') {
        const addressAliases = ["location", "circle", "state", "city", "region", "address"];
        if (addressAliases.includes(keyLower) && val) {
            obj["address"] = val; // Force key to be named "address"
        }
    }

    if (typeof val === "object" && val !== null) {
      obj[key] = cleanAndFix(val, type);
    } else {
      obj[key] = val;
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

      // Clean and Rename keys to ensure "address" exists
      const cleaned = cleanAndFix(data, type);
      
      if (cleaned && Object.keys(cleaned).length > 0) results.push(cleaned);
    } catch (e) { console.error("Source Error"); }
  }

  if (results.length === 0) throw new Error("No data found.");
  const finalResponse = results.length === 1 ? results[0] : results;
  cache.set(cacheKey, { data: finalResponse, time: Date.now() });
  return finalResponse;
}

// ================== MAIN HANDLER ==================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const q = req.query || {};

  if (!q.key || (!keys.has(q.key) && q.key !== ADMIN_KEY)) {
    return res.status(403).json({ success: false, error: "Invalid Key" });
  }

  const type = q.type?.toLowerCase();
  const term = q.term || q.number || q.mobile || q.vehicle_no || q.pan || q.imei || q.ifsc || q.aadhar || q.vpa || q.reg;

  if (!apiUrls[type]) return res.status(400).json({ success: false, error: "Invalid Type" });

  try {
    const result = await proxyFetch(apiUrls[type], term, type);
    return res.status(200).json({
      success: true,
      owner: "@velvierhackzone",
      result: result
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
