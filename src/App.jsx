require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://kotiopas.fi",
  "https://www.kotiopas.fi",
  "https://asuntoraportti.fi",
  "https://www.asuntoraportti.fi",
  "https://claude.ai",
  "null",
  /\.vercel\.app$/,
  /\.netlify\.app$/,
  /\.claude\.ai$/,
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const ok = ALLOWED_ORIGINS.some(o =>
      typeof o === "string" ? o === origin : o.test(origin)
    );
    if (!ok) console.log(`[CORS BLOCKED] origin: ${origin}`);
    cb(ok ? null : new Error("CORS blocked"), ok);
  }
}));

app.use(express.json());

// ── Headers ──────────────────────────────────────────────────────────────────
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fi-FI,fi;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
};

// ── Apufunktiot ──────────────────────────────────────────────────────────────
function parseFinnishNumber(str) {
  if (!str) return null;
  const cleaned = String(str)
    .replace(/\u00A0/g, " ")
    .replace(/[^\d,.\s-]/g, "")
    .replace(/\s/g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function buildDictionary($) {
  const dict = {};
  $("dt").each((_, dt) => {
    const label = $(dt).text().trim().toLowerCase();
    const dd = $(dt).next("dd");
    if (!label || !dd.length) return;
    const value = dd.text().trim().replace(/\s+/g, " ");
    if (!dict[label]) dict[label] = value;
  });
  return dict;
}

function lookup(dict, key) {
  if (dict[key]) return dict[key];
  const partial = Object.keys(dict).find(k => k.includes(key));
  return partial ? dict[partial] : null;
}

function detectPortal(url) {
  if (url.includes("etuovi")) return "etuovi";
  if (url.includes("oikotie")) return "oikotie";
  if (url.includes("kiinteistomaailma")) return "kiinteistomaailma";
  return "unknown";
}

// ── Parserit ─────────────────────────────────────────────────────────────────
function parseOikotie($) {
  const dict = buildDictionary($);
  const hinta = parseFinnishNumber(lookup(dict, "myyntihinta") || lookup(dict, "velaton hinta"));
  const koko = parseFinnishNumber(lookup(dict, "asuinpinta-ala") || lookup(dict, "pinta-ala"));
  const tontti = parseFinnishNumber(lookup(dict, "tontin pinta-ala") || lookup(dict, "tontin koko"));
  const huoneluku = parseFinnishNumber(lookup(dict, "huoneita"));
  const huoneetTeksti = lookup(dict, "huoneiston kokoonpano");
  const huoneetMatch = (huoneetTeksti || "").match(/(\d+h\+(?:k|kt|kk))/i);
  const vuosi = parseFinnishNumber(lookup(dict, "rakennusvuosi"));
  const kerros = lookup(dict, "kerros") || lookup(dict, "kerroksia");
  const hoitovastike = parseFinnishNumber(lookup(dict, "hoitovastike"));
  const rahoitusvastike = parseFinnishNumber(lookup(dict, "rahoitusvastike"));
  const yhtiovastikeTotal = parseFinnishNumber(lookup(dict, "yhtiövastike yhteensä"));
  const laina = parseFinnishNumber(lookup(dict, "lainaosuus") || lookup(dict, "yhtiölaina") || lookup(dict, "taloyhtiön lainat"));
  const kunto = lookup(dict, "kunto");
  const rakennustyyppi = lookup(dict, "rakennuksen tyyppi") || lookup(dict, "asuntotyyppi");
  const energialuokka = lookup(dict, "energialuokka");
  const tonttiTyyppi = lookup(dict, "tontin omistus");
  const lammitysJarjestelma = lookup(dict, "lämmitys");
  const sijainti = lookup(dict, "sijainti");
  const kaupunginosa = lookup(dict, "kaupunginosa");
  const kaupunki = lookup(dict, "kaupunki");
  const osoite = lookup(dict, "osoite");

  // Etsi postinumero useammasta paikasta. Käytetään joustavaa hakua —
  // numeron ennen pitää olla joko alku, välilyönti tai välimerkki.
  // Esim. "Lappeentie 18 C, 00950 Helsinki" → "00950"
  const ehdokkaat = [
    sijainti, osoite, kaupunginosa, kaupunki,
    $("h1").first().text(),
    $('meta[property="og:title"]').attr("content"),
    $('meta[name="description"]').attr("content"),
  ].filter(Boolean);
  let postinumero = null;
  const postinumeroRegex = /(?:^|[\s,;.\-])(\d{5})(?:[\s,;]|$)/;
  for (const teksti of ehdokkaat) {
    const m = String(teksti).match(postinumeroRegex);
    if (m) { postinumero = m[1]; break; }
  }
  // Viimeinen yritys: koko body-tekstistä
  if (!postinumero) {
    const bodyText = $("body").text().replace(/\s+/g, " ").slice(0, 5000);
    const m = bodyText.match(/(\d{5})\s+(?:Helsinki|Espoo|Vantaa|Tampere|Turku|Oulu|Jyväskylä|Kuopio|Lahti|Pori|Kouvola|Joensuu|Lappeenranta|Hämeenlinna|Vaasa|Seinäjoki|Rovaniemi|Mikkeli|Salo|Kotka|Porvoo|Hyvinkää|Lohja|Järvenpää|Rauma|Kerava|Kajaani|Imatra|Savonlinna|Riihimäki|Tuusula|Kirkkonummi|Nokia|Kaarina|Nurmijärvi|Ylöjärvi|Sipoo|Raisio|Kangasala|Lieto)/i);
    if (m) postinumero = m[1];
  }

  // Debug: jos postinumero ei löydy, tulosta mitä tekstejä yritettiin
  if (!postinumero) {
    console.log(`[DEBUG Oikotie] postinumero ei löytynyt. Ehdokkaat:`);
    ehdokkaat.forEach((t, i) => console.log(`  ${i}: ${String(t).slice(0, 150)}`));
  } else {
    console.log(`[DEBUG Oikotie] postinumero löytyi: ${postinumero}`);
  }

  const metaImg = $('meta[property="og:image"]').attr("content");
  const metaTitle = $('meta[property="og:title"]').attr("content");
  const headerLines = ($("h1").first().text() || metaTitle || "")
    .replace(/●/g, "•")
    .split("•")
    .map(s => s.trim())
    .filter(Boolean);
  const otsikko = headerLines[1] || headerLines[0] || null;

  return {
    portaali: "Oikotie",
    otsikko,
    sijainti: sijainti || [kaupunginosa, kaupunki].filter(Boolean).join(", ") || null,
    postinumero, kaupunginosa, kaupunki, hinta, koko, tontti,
    huoneet: huoneetMatch ? huoneetMatch[1] : (huoneluku ? `${huoneluku}h` : null),
    vuosi: vuosi ? String(vuosi) : null,
    kerros: typeof kerros === "string" ? kerros : null,
    hoitovastike, rahoitusvastike,
    yhtiovastike: yhtiovastikeTotal,
    laina, kunto, rakennustyyppi, energialuokka, tonttiTyyppi,
    lammitys: lammitysJarjestelma,
    kuva: metaImg || null,
  };
}

function parseEtuovi($) {
  const dict = buildDictionary($);
  const hinta = parseFinnishNumber(lookup(dict, "myyntihinta") || lookup(dict, "velaton hinta"));
  const koko = parseFinnishNumber(lookup(dict, "asuinpinta-ala") || lookup(dict, "pinta-ala"));
  const huoneet = lookup(dict, "huoneistoselitelmä") || lookup(dict, "huoneiston kokoonpano");
  const huoneetMatch = (huoneet || "").match(/(\d+h\+(?:k|kt|kk))/i);
  const vuosi = parseFinnishNumber(lookup(dict, "rakennusvuosi"));
  const kerros = lookup(dict, "kerros") || lookup(dict, "kerroksia");
  const hoitovastike = parseFinnishNumber(lookup(dict, "hoitovastike"));
  const rahoitusvastike = parseFinnishNumber(lookup(dict, "rahoitusvastike"));
  const laina = parseFinnishNumber(lookup(dict, "lainaosuus") || lookup(dict, "velkaosuus") || lookup(dict, "yhtiölaina"));
  const sijainti = lookup(dict, "osoite") || lookup(dict, "sijainti");
  const kaupunginosa = lookup(dict, "kaupunginosa");
  const kaupunki = lookup(dict, "kaupunki") || lookup(dict, "paikkakunta");
  const kunto = lookup(dict, "kunto");
  const rakennustyyppi = lookup(dict, "asuntotyyppi") || lookup(dict, "rakennuksen tyyppi");
  const postinumeroMatch = (sijainti || "").match(/\b(\d{5})\b/);
  const postinumero = postinumeroMatch ? postinumeroMatch[1] : null;
  const metaImg = $('meta[property="og:image"]').attr("content");
  const metaTitle = $('meta[property="og:title"]').attr("content");
  const otsikko = $("h1").first().text().trim() || metaTitle || null;

  return {
    portaali: "Etuovi", otsikko,
    sijainti: sijainti || [kaupunginosa, kaupunki].filter(Boolean).join(", ") || null,
    postinumero, kaupunginosa, kaupunki, hinta, koko,
    huoneet: huoneetMatch ? huoneetMatch[1] : null,
    vuosi: vuosi ? String(vuosi) : null,
    kerros: typeof kerros === "string" ? kerros : null,
    hoitovastike, rahoitusvastike, laina, kunto, rakennustyyppi,
    kuva: metaImg || null,
  };
}

function parseKiinteistomaailma($) {
  const dict = buildDictionary($);
  const hinta = parseFinnishNumber(lookup(dict, "myyntihinta") || lookup(dict, "velaton hinta"));
  const koko = parseFinnishNumber(lookup(dict, "asuinpinta-ala") || lookup(dict, "pinta-ala"));
  const huoneet = lookup(dict, "huoneiston kokoonpano") || lookup(dict, "huoneistoselitelmä");
  const huoneetMatch = (huoneet || "").match(/(\d+h\+(?:k|kt|kk))/i);
  const vuosi = parseFinnishNumber(lookup(dict, "rakennusvuosi"));
  const hoitovastike = parseFinnishNumber(lookup(dict, "hoitovastike"));
  const laina = parseFinnishNumber(lookup(dict, "lainaosuus") || lookup(dict, "yhtiölaina"));
  const sijainti = lookup(dict, "sijainti") || lookup(dict, "osoite");
  const postinumeroMatch = (sijainti || "").match(/\b(\d{5})\b/);
  const postinumero = postinumeroMatch ? postinumeroMatch[1] : null;
  const metaImg = $('meta[property="og:image"]').attr("content");
  const metaTitle = $('meta[property="og:title"]').attr("content");

  return {
    portaali: "Kiinteistömaailma",
    otsikko: $("h1").first().text().trim() || metaTitle || null,
    sijainti, postinumero, hinta, koko,
    huoneet: huoneetMatch ? huoneetMatch[1] : null,
    vuosi: vuosi ? String(vuosi) : null,
    hoitovastike, laina,
    kuva: metaImg || null,
  };
}

// ── Ilmoitusten haku ─────────────────────────────────────────────────────────
app.post("/api/hae-ilmoitus", async (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "Anna kelvollinen URL" });
  }
  const portaali = detectPortal(url);
  if (portaali === "unknown") {
    return res.status(400).json({ error: "Tuetut portaalit: Etuovi, Oikotie, Kiinteistomaailma" });
  }
  try {
    console.log(`[${new Date().toISOString()}] Haetaan: ${url}`);
    const response = await fetch(url, { headers: BROWSER_HEADERS, timeout: 15000 });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);

    let tiedot;
    if (portaali === "etuovi") tiedot = parseEtuovi($);
    else if (portaali === "oikotie") tiedot = parseOikotie($);
    else tiedot = parseKiinteistomaailma($);

    tiedot.url = url;
    tiedot.haettu = new Date().toISOString();
    console.log(`[OK] ${tiedot.portaali} | ${tiedot.otsikko || "?"} | hinta=${tiedot.hinta} koko=${tiedot.koko} postinumero=${tiedot.postinumero || "-"}`);
    res.json({ ok: true, tiedot });
  } catch (err) {
    console.error(`[VIRHE] ${err.message}`);
    res.status(500).json({ error: "Ilmoituksen haku epaonnistui", details: err.message });
  }
});

// ── Tilastokeskus-integraatio ────────────────────────────────────────────────
// Taulukko 13mu: vanhojen osakeasuntojen neliöhinnat postinumeroittain, vuosittain
// PxWeb sallii alikansioiden poisjättämisen URL:ssa (uusi versio)
const STATFIN_URL = "https://pxdata.stat.fi/PXWeb/api/v1/fi/StatFin/statfin_ashi_pxt_13mu.px";

const tilastoCache = new Map();
const CACHE_MS = 24 * 60 * 60 * 1000;

function pickHouseType(huoneet, rakennustyyppi) {
  // Tarkista ensin rakennustyyppi — jos rivitalo/omakotitalo, käytä Rivitalot yhteensä
  const rt = String(rakennustyyppi || "").toLowerCase();
  if (rt.includes("rivitalo") || rt.includes("paritalo") || rt.includes("omakotitalo") || rt.includes("erillis")) {
    return ["Rivitalot yhteensä"];
  }
  // Kerrostalo: valitse huoneluvun mukaan
  if (!huoneet) return ["Kerrostalo kaksiot", "Kerrostalo kolmiot+"];
  const h = String(huoneet).toLowerCase();
  if (h.includes("1h")) return ["Kerrostalo yksiöt"];
  if (h.includes("2h")) return ["Kerrostalo kaksiot"];
  if (h.includes("3h") || h.includes("4h") || h.includes("5h") || h.includes("6h")) return ["Kerrostalo kolmiot+"];
  return ["Kerrostalo kaksiot", "Kerrostalo kolmiot+"];
}

async function fetchTilastokeskus(postinumero, talotyypit) {
  const cacheKey = `${postinumero}|${talotyypit.join(",")}`;
  const cached = tilastoCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    console.log(`[CACHE] hit ${cacheKey}`);
    return cached.data;
  }

  const vuodet = ["2020", "2021", "2022", "2023", "2024"];

  const query = {
    query: [
      { code: "Vuosi", selection: { filter: "item", values: vuodet } },
      { code: "Postinumero", selection: { filter: "item", values: [postinumero] } },
      { code: "Talotyyppi", selection: { filter: "item", values: talotyypit } },
      { code: "Tiedot", selection: { filter: "all", values: ["*"] } },
    ],
    response: { format: "json-stat2" },
  };

  console.log(`[TILASTO] haetaan postinumero=${postinumero} talotyypit=${talotyypit.join(",")}`);
  console.log(`[TILASTO] URL: ${STATFIN_URL}`);
  console.log(`[TILASTO] query: ${JSON.stringify(query)}`);

  const response = await fetch(STATFIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(query),
    timeout: 12000,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`[TILASTO VIRHE] HTTP ${response.status} body: ${text}`);
    // HTTP 400 Tilastokeskuksessa tarkoittaa yleensä että pyydetyllä
    // kombinaatiolla (postinumero + talotyyppi) ei ole julkaistua dataa
    // (salassapitosääntö: alle 6 kauppaa/vuosi → ei julkisteta)
    if (response.status === 400) {
      const err = new Error("Ei julkaistua dataa tällä postinumerolla ja talotyypillä");
      err.code = "NO_DATA";
      throw err;
    }
    throw new Error(`Tilastokeskus HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  tilastoCache.set(cacheKey, { data, expires: Date.now() + CACHE_MS });
  return data;
}

function parseJsonStat(stat) {
  if (!stat || !stat.value || !stat.dimension) {
    return { vuodet: [], huom: "Datan rakenne odottamaton" };
  }
  const dims = ["Vuosi", "Postinumero", "Talotyyppi", "Tiedot"];
  for (const d of dims) {
    if (!stat.dimension[d] || !stat.dimension[d].category) {
      return { vuodet: [], huom: `Dimensio ${d} puuttuu` };
    }
  }

  const indexOf = d => stat.dimension[d].category.index;
  const labelOf = d => stat.dimension[d].category.label;
  const sizeOf = d => Object.keys(stat.dimension[d].category.index).length;

  const vuosiKoodit = Object.keys(indexOf("Vuosi")).sort((a,b) => indexOf("Vuosi")[a] - indexOf("Vuosi")[b]);
  const taloKoodit = Object.keys(indexOf("Talotyyppi"));
  const tietoKoodit = Object.keys(indexOf("Tiedot"));
  const postinumeroKoodit = Object.keys(indexOf("Postinumero"));

  const sizes = dims.map(sizeOf);
  const idx = (iV, iP, iT, iD) => iV * sizes[1] * sizes[2] * sizes[3] + iP * sizes[2] * sizes[3] + iT * sizes[3] + iD;

  // Tunnista Tiedot-kentät labelista (koodit voivat vaihdella, ei kovakoodata)
  const tietoLabels = labelOf("Tiedot");
  let hintaTietoKoodi = null;
  let lkmTietoKoodi = null;
  for (const tk of tietoKoodit) {
    const lbl = (tietoLabels[tk] || "").toLowerCase();
    if (lbl.includes("neliöhinta") || lbl.includes("hinta")) hintaTietoKoodi = tk;
    else if (lbl.includes("lukumäärä") || lbl.includes("kauppo")) lkmTietoKoodi = tk;
  }
  // Fallback: jos labelista ei tunnista, oleta ensimmäinen = hinta, toinen = lkm
  if (!hintaTietoKoodi && tietoKoodit.length > 0) hintaTietoKoodi = tietoKoodit[0];
  if (!lkmTietoKoodi && tietoKoodit.length > 1) lkmTietoKoodi = tietoKoodit[1];

  const iHinta = indexOf("Tiedot")[hintaTietoKoodi];
  const iLkm = lkmTietoKoodi != null ? indexOf("Tiedot")[lkmTietoKoodi] : null;

  const tulos = vuosiKoodit.map(v => {
    const iV = indexOf("Vuosi")[v];
    const hinnat = [];
    const lkmt = [];
    for (const tk of taloKoodit) {
      const iT = indexOf("Talotyyppi")[tk];
      const iP = 0;
      const h = stat.value[idx(iV, iP, iT, iHinta)];
      const lkm = iLkm != null ? stat.value[idx(iV, iP, iT, iLkm)] : null;
      if (typeof h === "number" && Number.isFinite(h)) hinnat.push(h);
      if (typeof lkm === "number" && Number.isFinite(lkm)) lkmt.push(lkm);
    }
    const keskiHinta = hinnat.length > 0 ? Math.round(hinnat.reduce((a,b)=>a+b,0) / hinnat.length) : null;
    const yhteensaKauppoja = lkmt.length > 0 ? lkmt.reduce((a,b)=>a+b,0) : null;
    return {
      vuosi: v.replace(/\*/, ""),
      keskiHinta,
      kauppojaYhteensa: yhteensaKauppoja,
      ennakkotieto: v.includes("*"),
    };
  }).filter(x => x.keskiHinta !== null);

  return {
    vuodet: tulos,
    postinumero: postinumeroKoodit[0] || null,
    postinumeroNimi: labelOf("Postinumero")[postinumeroKoodit[0]] || null,
    talotyypit: taloKoodit.map(t => labelOf("Talotyyppi")[t]),
    lahde: "Tilastokeskus / StatFin / Vanhojen osakeasuntojen neliöhinnat postinumeroittain (taulukko 13mu)",
    haettu: new Date().toISOString(),
  };
}

app.post("/api/hinta-tilasto", async (req, res) => {
  const { postinumero, huoneet, rakennustyyppi } = req.body;

  if (!postinumero || !/^\d{5}$/.test(postinumero)) {
    return res.status(400).json({
      error: "Anna 5-numeroinen postinumero",
    });
  }

  // Talotyyppi-listat yritysjärjestyksessä
  const ensisijainen = pickHouseType(huoneet, rakennustyyppi);
  // Fallbackit: jos ensisijainen on rivitalo, kokeile kerrostaloa, ja päinvastoin
  const onRivitalo = ensisijainen[0] === "Rivitalot yhteensä";
  const yritykset = onRivitalo
    ? [ensisijainen, ["Kerrostalo kaksiot", "Kerrostalo kolmiot+"]]
    : [ensisijainen, ["Rivitalot yhteensä"]];

  try {
    let kooste = null;
    let kaytetty = null;
    for (const talotyypit of yritykset) {
      try {
        const stat = await fetchTilastokeskus(postinumero, talotyypit);
        const k = parseJsonStat(stat);
        if (k.vuodet.length > 0) {
          kooste = k;
          kaytetty = talotyypit;
          break;
        }
      } catch (innerErr) {
        console.log(`[TILASTO] kokeilu ${talotyypit.join(",")} epäonnistui: ${innerErr.message}`);
        // Jatka seuraavaan yritykseen
      }
    }

    if (!kooste) {
      return res.json({
        ok: true,
        loytyi: false,
        viesti: "Tilastokeskus ei julkaise hintatietoja tälle postinumerolle — alueelta tehdään liian vähän vuosittaisia kauppoja (salassapitosääntö, alle ~6 kauppaa/vuosi).",
        postinumero,
      });
    }

    console.log(`[OK TILASTO] ${postinumero} | ${kooste.vuodet.length} vuotta | ${kaytetty.join(",")}`);
    res.json({ ok: true, loytyi: true, ...kooste });
  } catch (err) {
    console.error(`[VIRHE TILASTO] ${err.message}`);
    res.status(500).json({
      error: "Tilastokeskuksen tietojen haku epäonnistui",
      details: err.message,
    });
  }
});

// ── Liidi-endpoint (Brevo CRM) ───────────────────────────────────────────────
app.post("/api/liidi", async (req, res) => {
  try {
    const { nimi, puhelin, email, asunto, hinta, tyyppi, lisatieto, gdpr } = req.body || {};

    // Validointi
    if (!nimi || !puhelin) {
      return res.status(400).json({ ok: false, error: "Nimi ja puhelin ovat pakollisia" });
    }
    if (!gdpr) {
      return res.status(400).json({ ok: false, error: "Tietosuojakaytanto pitaa hyvaksya" });
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error("[LIIDI] BREVO_API_KEY puuttuu Renderin ymparistomuuttujista!");
      return res.status(500).json({ ok: false, error: "Server-konfiguraatio puutteellinen" });
    }

    // Jaa nimi etunimi/sukunimi
    const nimiOsat = String(nimi).trim().split(/\s+/);
    const etunimi = nimiOsat[0] || "";
    const sukunimi = nimiOsat.slice(1).join(" ") || "";

    // Email: jos asiakas ei antanut, generoidaan placeholder Brevoon
    // (Brevo vaatii sahkopostin kontaktille)
    const kontaktiEmail = email && email.includes("@")
      ? email.trim().toLowerCase()
      : `puh-${String(puhelin).replace(/\D/g, "")}@asuntoraportti.fi`;

    // Liidin tyyppi: "valittaja-pyynto", "arvio-pyynto", jne.
    const liidiTyyppi = tyyppi || "yhteydenotto";

    // Brevo-rakenne
    const brevoData = {
      email: kontaktiEmail,
      attributes: {
        FIRSTNAME: etunimi,
        LASTNAME: sukunimi,
        SMS: puhelin,
        ASUNTO: asunto || "",
        HINTA: hinta ? Number(hinta) : null,
        LIIDI_TYYPPI: liidiTyyppi,
        LISATIETO: lisatieto || "",
        LAHDE: "asuntoraportti.fi",
        LUOTU: new Date().toISOString(),
      },
      updateEnabled: true,  // Päivittää, jos kontakti on jo olemassa
    };

    console.log(`[LIIDI] Uusi liidi: ${etunimi} ${sukunimi} (${liidiTyyppi})`);

    // Lahetä Brevoon
    const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(brevoData),
    });

    const brevoBody = await brevoResponse.text();
    let brevoJson = null;
    try { brevoJson = JSON.parse(brevoBody); } catch (e) { /* not JSON */ }

    if (!brevoResponse.ok) {
      console.error(`[LIIDI] Brevo-virhe ${brevoResponse.status}:`, brevoBody);
      // 400 + duplicate_parameter on OK - kontakti on jo olemassa, päivitettiin
      const isDuplicate = brevoJson && brevoJson.code === "duplicate_parameter";
      if (!isDuplicate) {
        return res.status(502).json({
          ok: false,
          error: "Liidin lahetys CRM:aan epaonnistui",
          detail: brevoJson?.message || brevoBody,
        });
      }
    }

    console.log(`[LIIDI OK] Tallennettu Brevoon: ${kontaktiEmail}`);
    return res.json({
      ok: true,
      message: "Kiitos yhteydenotostasi! Otamme yhteytta 24h kuluessa.",
    });

  } catch (err) {
    console.error("[LIIDI] Virhe:", err);
    return res.status(500).json({ ok: false, error: "Sisainen virhe" });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_, res) => {
  res.json({ status: "ok", version: "1.4.0", time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\nAsuntoraportti backend kaynnissa portissa ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
