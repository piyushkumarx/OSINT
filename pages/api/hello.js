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

// Helper to fetch from multiple URLs
async function proxyFetch(urls, term) {
  for (const url of urls) {
    try {
      const r = await fetch(url + encodeURIComponent(term));
      const ct = r.headers.get("content-type") || "";
      const body = await r.text();
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
