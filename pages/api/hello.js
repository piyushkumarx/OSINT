// ================== CONFIG ==================
const ADMIN_KEY = "MRWEIRDO"; // admin key (hardcoded as you want)
const keys = new Set(["FUCKDEMOO"]); // demo user key

// ================== API URLS ==================
const apiUrls = {
  number: [
    "https://osintx.site/api/api.php?key=suryansh&num=",
    "https://num-search-ae.drsudo.workers.dev/api/num?key=iinl&num="
    
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
const CACHE_TIME = 5 * 60 * 1000; // 5 min

// ================== CLEAN DATA ==================
function cleanData(data) {
  if (!data || typeof data !== "object") return data;

  const bannedKeys = [
    "credit", "credit_by", "developer", "powered_by",
    "ads", "ad", "promo", "promotion", "sponsored",
    "credit_to", "credits", "developer_info", "powered",
    "api_by", "api_owner", "copyright", "_source"
  ];

  // For array responses
  if (Array.isArray(data)) {
    return data.map(item => cleanData(item));
  }

  const obj = {};
  for (const key in data) {
    const keyLower = key.toLowerCase();
    
    // Check if this key should be skipped
    let shouldSkip = false;
    for (const banned of bannedKeys) {
      if (keyLower === banned.toLowerCase()) {
        shouldSkip = true;
        break;
      }
    }
    
    if (shouldSkip) {
      continue;
    }
    
    // Keep all other keys including address
    if (typeof data[key] === "object" && data[key] !== null) {
      obj[key] = cleanData(data[key]);
    } else {
      obj[key] = data[key];
    }
  }
  return obj;
}

// ================== FETCH LOGIC ==================
async function proxyFetch(urls, term, userKey) {
  const cacheKey = urls.join("|") + ":" + term;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.time < CACHE_TIME) {
    return cached.data;
  }

  // Special handling for Aadhaar Family API
  if (urls === apiUrls.aadharrfamily) {
    try {
      const url = `https://osintx.site/family.php?term=${encodeURIComponent(term)}`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json,text/html,*/*",
          "Accept-Language": "en-US,en;q=0.9"
        },
        signal: controller.signal
      });

      clearTimeout(timeout);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        // Try to find JSON in the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0]);
          } catch {
            const arrayMatch = text.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
              try {
                data = JSON.parse(arrayMatch[0]);
              } catch {
                data = { raw_response: text.slice(0, 300) };
              }
            } else {
              data = { raw_response: text.slice(0, 300) };
            }
          }
        } else {
          data = { raw_response: text.slice(0, 300) };
        }
      }

      const cleanedData = cleanData(data);
      cache.set(cacheKey, { data: cleanedData, time: Date.now() });
      return cleanedData;

    } catch (e) {
      return { error: `Aadhaar Family API failed: ${e.message}` };
    }
  }

  // Special handling for UPI API
  if (urls === apiUrls.upi) {
    try {
      const url = `https://osintx.site/upi.php?vpa=${encodeURIComponent(term)}`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json,text/html,*/*",
          "Accept-Language": "en-US,en;q=0.9"
        },
        signal: controller.signal
      });

      clearTimeout(timeout);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0]);
          } catch {
            const arrayMatch = text.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
              try {
                data = JSON.parse(arrayMatch[0]);
              } catch {
                data = { raw_response: text.slice(0, 300) };
              }
            } else {
              data = { raw_response: text.slice(0, 300) };
            }
          }
        } else {
          data = { raw_response: text.slice(0, 300) };
        }
      }

      const cleanedData = cleanData(data);
      cache.set(cacheKey, { data: cleanedData, time: Date.now() });
      return cleanedData;

    } catch (e) {
      return { error: `UPI API failed: ${e.message}` };
    }
  }

  // Special handling for vehicle to number API
  if (urls === apiUrls.vehicletonumber) {
    try {
      // Extract registration number and key if provided
      const regNumber = term.split('&')[0];
      const url = `https://osintx.site/vehicle-owner.php?reg=${encodeURIComponent(regNumber)}&key=suryansh`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json,text/html,*/*",
          "Accept-Language": "en-US,en;q=0.9"
        },
        signal: controller.signal
      });

      clearTimeout(timeout);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0]);
          } catch {
            const arrayMatch = text.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
              try {
                data = JSON.parse(arrayMatch[0]);
              } catch {
                data = { raw_response: text.slice(0, 300) };
              }
            } else {
              data = { raw_response: text.slice(0, 300) };
            }
          }
        } else {
          data = { raw_response: text.slice(0, 300) };
        }
      }

      const cleanedData = cleanData(data);
      cache.set(cacheKey, { data: cleanedData, time: Date.now() });
      return cleanedData;

    } catch (e) {
      return { error: `Vehicle to Number API failed: ${e.message}` };
    }
  }

  // Try ALL APIs for number type
  if (urls === apiUrls.number) {
    const allResults = [];
    const errors = [];
    
    // API 1: https://num-search-ae.drsudo.workers.dev/api/num?key=iinl&num=
    try {
      const url1 = `https://num-search-ae.drsudo.workers.dev/api/num?key=iinl&num=${encodeURIComponent(term)}`;
      
      const controller1 = new AbortController();
      const timeout1 = setTimeout(() => controller1.abort(), 10000);

      const res1 = await fetch(url1, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json,text/html,*/*",
          "Accept-Language": "en-US,en;q=0.9"
        },
        signal: controller1.signal
      });

      clearTimeout(timeout1);
      
      if (!res1.ok) {
        throw new Error(`HTTP ${res1.status}: ${res1.statusText}`);
      }
      
      const text1 = await res1.text();
      let data1;

      try {
        data1 = JSON.parse(text1);
      } catch (e) {
        // Try to find JSON in the response
        const jsonMatch = text1.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            data1 = JSON.parse(jsonMatch[0]);
          } catch {
            const arrayMatch = text1.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
              try {
                data1 = JSON.parse(arrayMatch[0]);
              } catch {
                data1 = { raw_response: text1.slice(0, 300) };
              }
            } else {
              data1 = { raw_response: text1.slice(0, 300) };
            }
          }
        } else {
          data1 = { raw_response: text1.slice(0, 300) };
        }
      }

      if (data1 && typeof data1 === 'object') {
        // Add source identifier
        if (typeof data1 === 'object' && !Array.isArray(data1)) {
          data1._source = "num-search-ae.drsudo";
        }
        
        const cleaned1 = cleanData(data1);
        
        if (Array.isArray(cleaned1)) {
          for (const item of cleaned1) {
            if (item && typeof item === 'object') {
              allResults.push(item);
            }
          }
        } else if (Object.keys(cleaned1).length > 0) {
          allResults.push(cleaned1);
        }
      }

    } catch (e) {
      errors.push({ api: "num-search-ae API", error: e.message });
    }

    // API 2: https://num-to-email-all-info-api.vercel.app/?mobile=
    try {
      const url2 = `https://num-to-email-all-info-api.vercel.app/?mobile=${encodeURIComponent(term)}&key=GOKU`;
      
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 10000);

      const res2 = await fetch(url2, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json,text/html,*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://vercel.com/"
        },
        signal: controller2.signal
      });

      clearTimeout(timeout2);
      
      if (!res2.ok) {
        throw new Error(`HTTP ${res2.status}: ${res2.statusText}`);
      }
      
      const text2 = await res2.text();
      let data2;

      try {
        data2 = JSON.parse(text2);
      } catch (e) {
        const jsonMatch = text2.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            data2 = JSON.parse(jsonMatch[0]);
          } catch {
            const arrayMatch = text2.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
              try {
                data2 = JSON.parse(arrayMatch[0]);
              } catch {
                data2 = { raw_response: text2.slice(0, 300) };
              }
            } else {
              data2 = { raw_response: text2.slice(0, 300) };
            }
          }
        } else {
          data2 = { raw_response: text2.slice(0, 300) };
        }
      }

      if (data2 && typeof data2 === 'object') {
        // Add source identifier
        if (typeof data2 === 'object' && !Array.isArray(data2)) {
          data2._source = "num-to-email-all-info-api";
        }
        
        const cleaned2 = cleanData(data2);
        
        if (Array.isArray(cleaned2)) {
          for (const item of cleaned2) {
            if (item && typeof item === 'object') {
              allResults.push(item);
            }
          }
        } else if (Object.keys(cleaned2).length > 0) {
          allResults.push(cleaned2);
        }
      }

    } catch (e) {
      errors.push({ api: "num-to-email-all-info API", error: e.message });
    }

    // API 3: https://vishal-number-info.22web.org/information.php?number=
    try {
      const url3 = `https://vishal-number-info.22web.org/information.php?number=${encodeURIComponent(term)}&api_key=vishal_Hacker&i=1`;
      
      const controller3 = new AbortController();
      const timeout3 = setTimeout(() => controller3.abort(), 10000);

      const res3 = await fetch(url3, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json,text/html,*/*",
          "Accept-Language": "en-US,en;q=0.9"
        },
        signal: controller3.signal
      });

      clearTimeout(timeout3);
      
      if (!res3.ok) {
        throw new Error(`HTTP ${res3.status}: ${res3.statusText}`);
      }
      
      const text3 = await res3.text();
      let data3;

      try {
        data3 = JSON.parse(text3);
      } catch (e) {
        const jsonMatch = text3.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            data3 = JSON.parse(jsonMatch[0]);
          } catch {
            const arrayMatch = text3.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
              try {
                data3 = JSON.parse(arrayMatch[0]);
              } catch {
                data3 = { raw_response: text3.slice(0, 300) };
              }
            } else {
              data3 = { raw_response: text3.slice(0, 300) };
            }
          }
        } else {
          data3 = { raw_response: text3.slice(0, 300) };
        }
      }

      if (data3 && typeof data3 === 'object') {
        // Add source identifier
        if (typeof data3 === 'object' && !Array.isArray(data3)) {
          data3._source = "vishal-number-info";
        }
        
        const cleaned3 = cleanData(data3);
        
        if (Array.isArray(cleaned3)) {
          for (const item of cleaned3) {
            if (item && typeof item === 'object') {
              allResults.push(item);
            }
          }
        } else if (Object.keys(cleaned3).length > 0) {
          allResults.push(cleaned3);
        }
      }

    } catch (e) {
      errors.push({ api: "vishal-number-info API", error: e.message });
    }

    // If we got results, cache and return ALL of them
    if (allResults.length > 0) {
      cache.set(cacheKey, { data: allResults, time: Date.now() });
      return allResults;
    }
    
    // If no results, return error
    return { 
      error: "No data found from any API", 
      errors,
      note: "Tried all 3 sources but no valid data received"
    };
  }

  // Original logic for other APIs
  const results = [];
  const errors = [];

  for (const baseUrl of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

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
    q.pan || q.imei || q.ifsc || q.aadhar || q.vpa;

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
    version: "2.3",
    demo_key: "FUCKDEMOO",
    admin_key: "MRWEIRDO",
    types: Object.keys(apiUrls),
    new_features: [
      "All 3 number APIs working",
      "Aadhaar Family API added",
      "UPI Info API added",
      "Vehicle to Number API updated"
    ],
    number_apis: [
      "https://num-search-ae.drsudo.workers.dev/api/num?key=iinl&num=",
      "https://num-to-email-all-info-api.vercel.app/?mobile=",
      "https://vishal-number-info.22web.org/information.php?number="
    ]
  });
}
