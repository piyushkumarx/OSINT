// ================== CONFIG ==================
const ADMIN_KEY = "MRWEIRDO"; // admin key (hardcoded as you want)
const keys = new Set(["FUCKDEMOO"]); // demo user key

// ================== API URLS ==================
const apiUrls = {
  number: [
    "https://num-to-email-all-info-api.vercel.app/?mobile=",
    "https://vishal-number-info.22web.org/information.php?number="
  ],

  vehicle: [
    "https://vehicle-darkgoku-api-nmhg.vercel.app/vehicle_info?vehicle_no=",
    "https://vechileinfoapi.anshppt19.workers.dev/api/rc?number="
  ],

  vehicletonumber: [
    "https://suryansh.site/vehicle-owner.php?reg="
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
  ]
};

// ================== API CONFIGURATIONS ==================
const apiConfigs = {
  number: [
    {
      url: "https://num-to-email-all-info-api.vercel.app/?mobile=",
      params: (term, key) => `${term}&key=GOKU`
    },
    {
      url: "https://vishal-number-info.22web.org/information.php?number=",
      params: (term, key) => `${term}&api_key=vishal_Hacker&i=1`
    }
  ]
};

// ================== CACHE ==================
const cache = new Map();
const CACHE_TIME = 5 * 60 * 1000; // 5 min

// ================== CLEAN DATA ==================
function cleanData(data) {
  if (!data || typeof data !== "object") return data;

  const banned = [
    "credit", "credit_by", "developer", "powered_by",
    "ads", "ad", "promo", "promotion", "sponsored",
    "credit_to", "credits", "developer_info", "powered",
    "api_by", "api_owner", "copyright", "author"
  ];

  // For array responses
  if (Array.isArray(data)) {
    return data.map(item => cleanData(item));
  }

  const obj = {};
  for (const k in data) {
    const keyLower = k.toLowerCase();
    
    // Skip banned keys
    if (banned.some(bannedWord => keyLower.includes(bannedWord))) {
      continue;
    }
    
    // Recursively clean nested objects
    if (typeof data[k] === "object" && data[k] !== null) {
      obj[k] = cleanData(data[k]);
    } else {
      obj[k] = data[k];
    }
  }
  return obj;
}

// ================== FETCH LOGIC ==================
async function proxyFetch(urls, term, key) {
  const cacheKey = urls.join("|") + ":" + term;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.time < CACHE_TIME) {
    return cached.data;
  }

  const errors = [];
  
  // Special handling for number API with multiple endpoints
  if (urls === apiUrls.number && apiConfigs.number) {
    for (const apiConfig of apiConfigs.number) {
      try {
        const fullUrl = apiConfig.url + encodeURIComponent(term) + 
                        (apiConfig.params ? "&" + apiConfig.params(term, key).split('&')[1] : "");
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(fullUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json,text/html,*/*"
          },
          signal: controller.signal
        });

        clearTimeout(timeout);

        const text = await res.text();
        let data;

        try {
          data = JSON.parse(text);
        } catch {
          // Try to extract JSON from HTML if needed
          const jsonMatch = text.match(/\{.*\}/s);
          if (jsonMatch) {
            try {
              data = JSON.parse(jsonMatch[0]);
            } catch {
              data = { raw: text.slice(0, 500) };
            }
          } else {
            data = { raw: text.slice(0, 500) };
          }
        }

        const cleanedData = cleanData(data);
        
        // If we got valid data, cache and return it
        if (cleanedData && Object.keys(cleanedData).length > 0) {
          cache.set(cacheKey, { data: cleanedData, time: Date.now() });
          return cleanedData;
        } else {
          errors.push({ api: apiConfig.url, error: "No valid data returned" });
        }

      } catch (e) {
        errors.push({ api: apiConfig.url, error: e.message });
        // Continue to next API
      }
    }
  } else {
    // Original logic for other APIs
    const results = [];

    for (const baseUrl of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(baseUrl + encodeURIComponent(term), {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json,text/html,*/*"
          },
          signal: controller.signal
        });

        clearTimeout(timeout);

        const text = await res.text();
        let data;

        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text.slice(0, 500) };
        }

        results.push(cleanData(data));

      } catch (e) {
        errors.push({ api: baseUrl, error: e.message });
      }
    }

    if (!results.length) {
      return { error: "All APIs failed", errors };
    }

    const finalData = results.length === 1 ? results[0] : results;
    cache.set(cacheKey, { data: finalData, time: Date.now() });

    return finalData;
  }

  // If we reached here, all number APIs failed
  return { 
    error: "All number APIs failed", 
    errors,
    note: "Tried multiple sources but no valid data received"
  };
}

// ================== MAIN HANDLER ==================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const q = req.query || {};

  // -------- ADMIN ROUTES --------
  if (req.url.includes("/api/key")) {
    if (q.key !== ADMIN_KEY) {
      return res.status(401).json({ success: false, error: "invalid admin key" });
    }

    if (q.genkey) {
      keys.add(q.genkey);
      return res.json({ success: true, added: q.genkey });
    }

    if (q.delkey) {
      return res.json({
        success: true,
        deleted: q.delkey,
        found: keys.delete(q.delkey)
      });
    }

    if ("keylist" in q) {
      return res.json({ success: true, keys: [...keys] });
    }

    return res.json({ success: false, error: "no admin action" });
  }

  // -------- USER AUTH --------
  if (!q.key) {
    return res.status(400).json({ success: false, error: "missing key" });
  }

  if (!keys.has(q.key)) {
    return res.status(403).json({ success: false, error: "invalid key" });
  }

  const type = q.type?.toLowerCase();
  const term =
    q.term || q.number || q.mobile || q.vehicle_no ||
    q.pan || q.imei || q.ifsc;

  if (!type || !term) {
    return res.status(400).json({
      success: false,
      error: "missing type or term",
      supported: Object.keys(apiUrls)
    });
  }

  if (!apiUrls[type]) {
    return res.status(400).json({
      success: false,
      error: "unknown type"
    });
  }

  // -------- RATE LIMIT (1 req/sec per key) --------
  const rateKey = "rate:" + q.key;
  const last = cache.get(rateKey);

  if (last && Date.now() - last.time < 1000) {
    return res.status(429).json({ success: false, error: "too fast" });
  }
  cache.set(rateKey, { time: Date.now() });

  // -------- FETCH --------
  try {
    const result = await proxyFetch(apiUrls[type], term, q.key);

    return res.json({
      success: true,
      owner: "@velvierhackzone",
      type,
      term,
      result,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

// ================== TEST ==================
export async function test(req, res) {
  res.json({
    status: "API WORKING",
    version: "2.1",
    demo_key: "FUCKDEMOO",
    admin_key: "MRWEIRDO",
    types: Object.keys(apiUrls)
  });
}
