/**
 * API SERVICE BY @VELVIERHACKZONE
 * Fixed + Stable + Address-Safe Version
 * V3.0
 */

// ================== CONFIG ==================
const ADMIN_KEY = "MRWEIRDO";
const keys = new Set(["FUCKDEMOO"]);

// ================== API URLS ==================
const apiUrls = {
  number: [
    "https://allapiinone.vercel.app/?key=DEMOKEY&type=mobile&term="
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

// ================== CACHE ==================
const cache = new Map();
const CACHE_TIME = 5 * 60 * 1000;

// ================== SAFE DATA CLEANER ==================
function cleanData(data) {
  if (!data || typeof data !== "object") return data;

  const bannedKeys = [
    "credit", "credit_by", "developer", "powered_by",
    "ads", "promo", "sponsored", "api_owner",
    "copyright"
  ];

  if (Array.isArray(data)) return data.map(cleanData);

  const obj = {};
  for (const key in data) {
    const lower = key.toLowerCase();

    if (bannedKeys.some(b => lower.includes(b))) continue;

    obj[key] =
      typeof data[key] === "object"
        ? cleanData(data[key])
        : data[key];
  }
  return obj;
}

// ================== ADDRESS NORMALIZER ==================
function extractAddress(data) {
  if (!data || typeof data !== "object") return null;

  const addressKeys = [
    "address",
    "owner_address",
    "present_address",
    "permanent_address",
    "current_address",
    "full_address"
  ];

  for (const key of addressKeys) {
    if (data[key]) return data[key];
  }

  for (const k in data) {
    if (typeof data[k] === "object") {
      const found = extractAddress(data[k]);
      if (found) return found;
    }
  }

  return null;
}

// ================== FETCH CORE ==================
async function proxyFetch(urls, term, type) {
  const cacheKey = `${type}:${term}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.time < CACHE_TIME) {
    return cached.data;
  }

  const results = [];

  for (const baseUrl of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(baseUrl + encodeURIComponent(term), {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json,text/plain,*/*"
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        const match = text.match(/({[\s\S]*}|\[[\s\S]*\])/);
        data = match ? JSON.parse(match[1]) : { raw: text };
      }

      const cleaned = cleanData(data);

      // 🔥 Attach extracted address if exists
      const address = extractAddress(cleaned);
      if (address) cleaned.__address__ = address;

      if (Object.keys(cleaned).length > 0) {
        results.push(cleaned);
      }

    } catch (e) {
      continue;
    }
  }

  if (!results.length) throw new Error("No data found");

  const finalData = results.length === 1 ? results[0] : results;
  cache.set(cacheKey, { data: finalData, time: Date.now() });

  return finalData;
}

// ================== MAIN HANDLER ==================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.end();

  const q = req.query || {};

  // ===== ADMIN =====
  if (req.url.includes("/api/key")) {
    if (q.key !== ADMIN_KEY)
      return res.status(401).json({ success: false });

    if (q.genkey) {
      keys.add(q.genkey);
      return res.json({ success: true, key: q.genkey });
    }

    if (q.delkey) {
      keys.delete(q.delkey);
      return res.json({ success: true });
    }

    if ("keylist" in q) {
      return res.json({ success: true, keys: [...keys] });
    }
  }

  // ===== AUTH =====
  if (!q.key) return res.status(400).json({ error: "Key required" });
  if (!keys.has(q.key) && q.key !== ADMIN_KEY)
    return res.status(403).json({ error: "Invalid key" });

  const type = q.type?.toLowerCase();
  const term =
    q.term || q.number || q.mobile || q.vehicle_no ||
    q.pan || q.imei || q.ifsc || q.aadhar || q.vpa || q.reg;

  if (!type || !term)
    return res.status(400).json({ error: "Missing params" });

  if (!apiUrls[type])
    return res.status(400).json({ error: "Invalid type" });

  // ===== RATE LIMIT =====
  const rateKey = `rl:${q.key}`;
  const last = cache.get(rateKey);
  if (last && Date.now() - last.time < 1000)
    return res.status(429).json({ error: "Slow down" });

  cache.set(rateKey, { time: Date.now() });

  // ===== EXECUTE =====
  try {
    const result = await proxyFetch(apiUrls[type], term, type);

    res.json({
      success: true,
      owner: "@velvierhackzone",
      query: { type, term },
      timestamp: new Date().toISOString(),
      result
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
}

// ================== STATUS ==================
export async function test(req, res) {
  res.json({
    engine: "V3.0-Fixed",
    active_keys: keys.size,
    modules: Object.keys(apiUrls),
    address_support: "ENABLED"
  });
}
