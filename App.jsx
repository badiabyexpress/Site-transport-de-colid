import React, { useState, useEffect, useMemo, useRef } from "react";
import { Package, Truck, Users, DollarSign, LayoutDashboard, Settings, Search, Plus, LogOut, MapPin, Plane, Ship, CheckCircle2, Clock, AlertTriangle, X, User, Lock, Shield, ChevronRight, ChevronLeft, Printer, Trash2, MessageCircle, Camera, Navigation, Globe, Sparkles, Download, RefreshCw, PenTool, ShieldCheck, Receipt, FileStack, Sun, Moon, Menu } from "lucide-react";
import { storage, subscribeToChanges } from "./lib/storage.js";


/* ---------- design tokens ----------
Navy #0A2647 · Red #C8102E · White #FFFFFF · Ice var(--surface2) · Slate var(--muted)
Display: 'Space Grotesk' | Body: 'Inter'
------------------------------------- */
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap";

/* ---------- dark theme tokens ----------
BG      var(--bg)  page background
SURFACE var(--surface)  card background
SURFACE2 #1A2338 raised / hover surface
BORDER  #232C42  hairline borders
TEXT    var(--text)  primary text
MUTED   #8592AD  secondary text
BLUE    #3D63FF  primary action
RED     #E23F52  alerts / brand accent
GREEN   #2FAE73  positive
AMBER   #E0A63A  warning
------------------------------------- */
const BG = "var(--bg)", SURFACE = "var(--surface)", SURFACE2 = "var(--surface2)", BORDER = "var(--border)";
const TEXT = "var(--text)", MUTED = "var(--muted)", BLUE = "#3D63FF", RED = "#E23F52", GREEN = "#2FAE73", AMBER = "#E0A63A";
const FLAGS = { FR: "🇫🇷", BE: "🇧🇪", CA: "🇨🇦", US: "🇺🇸", US2: "🇺🇸", MA: "🇲🇦", GN: "🇬🇳", DE: "🇩🇪", IT: "🇮🇹", ES: "🇪🇸", SN: "🇸🇳" };

const COUNTRIES = [
  { code: "GN", name: "Guinée", city: "Conakry", air: 0, sea: 0, delayAir: 0, delaySea: 0, currency: "GNF" },
  { code: "FR", name: "France", city: "Paris", air: 12, sea: 6, delayAir: 4, delaySea: 35, currency: "EUR" },
  { code: "BE", name: "Belgique", city: "Bruxelles", air: 13, sea: 6.5, delayAir: 5, delaySea: 37, currency: "EUR" },
  { code: "DE", name: "Allemagne", city: "Berlin", air: 12.5, sea: 6.2, delayAir: 4, delaySea: 35, currency: "EUR" },
  { code: "IT", name: "Italie", city: "Milan", air: 13, sea: 6.5, delayAir: 5, delaySea: 36, currency: "EUR" },
  { code: "ES", name: "Espagne", city: "Madrid", air: 12.5, sea: 6.3, delayAir: 5, delaySea: 36, currency: "EUR" },
  { code: "CA", name: "Canada", city: "Montréal", air: 15, sea: 8, delayAir: 6, delaySea: 42, currency: "CAD" },
  { code: "US", name: "États-Unis", city: "New York", air: 16, sea: 8.5, delayAir: 6, delaySea: 40, currency: "USD" },
  { code: "US2", name: "États-Unis", city: "Atlanta", air: 15.5, sea: 8, delayAir: 6, delaySea: 40, currency: "USD" },
  { code: "MA", name: "Maroc", city: "Casablanca", air: 10, sea: 5, delayAir: 3, delaySea: 20, currency: "MAD" },
  { code: "SN", name: "Sénégal", city: "Dakar", air: 8, sea: 4, delayAir: 2, delaySea: 10, currency: "XOF" },
];
const CURRENCIES = { EUR: 1, USD: 1.08, CAD: 1.47, GNF: 9500, MAD: 10.9, XOF: 655.957, GBP: 0.86 };
function allowedCountries(session) {
  if (!session || session.role === "Administrateur" || !session.paysAutorises || session.paysAutorises.length === 0) return COUNTRIES;
  return COUNTRIES.filter((c) => c.code === "GN" || session.paysAutorises.includes(c.code));
}
function routeLabel(pays, direction) {
  const c = COUNTRIES.find((x) => x.code === pays);
  if (!c) return "";
  return direction === "import" ? `${c.city} → Conakry` : `Conakry → ${c.city}`;
}
function loyaltyDiscount(previousCount) {
  if (previousCount >= 11) return 12;
  if (previousCount >= 6) return 8;
  if (previousCount >= 3) return 5;
  return 0;
}
const STATUSES = ["Enregistré", "En transit", "Arrivé", "En douane", "En livraison", "Livré"];
const STATUS_STYLE = {
  "Enregistré": { bg: "var(--surface2)", fg: "#AEB9D6", icon: Package },
  "En transit": { bg: "#16233F", fg: "#5B8DEF", icon: Plane },
  "Arrivé": { bg: "#2B2313", fg: "#E0A63A", icon: MapPin },
  "En douane": { bg: "#2B1620", fg: "#E23F52", icon: AlertTriangle },
  "En livraison": { bg: "#12261D", fg: "#2FAE73", icon: Truck },
  "Livré": { bg: "#0F2A1C", fg: "#3ECB84", icon: CheckCircle2 },
  "Annulé": { bg: "#2B1620", fg: "#E23F52", icon: X },
};
const ROLES = ["Administrateur", "Agent", "Comptable", "Chauffeur"];

const PERMISSIONS_SCHEMA = [
  { group: "COLIS", permissions: [
    { key: "colis.voir_propres", label: "Voir ses propres colis" },
    { key: "colis.voir_tous", label: "Voir tous les colis" },
    { key: "colis.creer", label: "Créer un colis" },
    { key: "colis.modifier", label: "Modifier un colis" },
    { key: "colis.changer_statut", label: "Changer le statut" },
    { key: "colis.annuler", label: "Annuler un colis" },
    { key: "colis.enregistrer_paiement", label: "Enregistrer un paiement" },
    { key: "colis.supprimer", label: "Supprimer un colis" },
  ]},
  { group: "BORDEREAUX", permissions: [
    { key: "bordereaux.consulter", label: "Consulter les bordereaux" },
    { key: "bordereaux.creer", label: "Créer un bordereau" },
    { key: "bordereaux.modifier", label: "Modifier un bordereau (ajouter/retirer des colis)" },
    { key: "bordereaux.valider", label: "Marquer un bordereau comme reçu" },
  ]},
  { group: "FACTURES", permissions: [
    { key: "factures.consulter", label: "Consulter les factures" },
    { key: "factures.creer", label: "Générer une facture" },
    { key: "factures.modifier", label: "Encaisser / modifier un paiement" },
  ]},
  { group: "CLIENTS", permissions: [
    { key: "clients.consulter", label: "Consulter les clients" },
  ]},
  { group: "COMPTABILITÉ", permissions: [
    { key: "compta.consulter", label: "Consulter la comptabilité" },
    { key: "compta.gerer_depenses", label: "Ajouter / modifier / supprimer une dépense" },
    { key: "compta.charges_fixes", label: "Gérer les charges fixes (salaires, loyers...)" },
    { key: "compta.marges", label: "Consulter les marges et bénéfices" },
  ]},
  { group: "STATISTIQUES", permissions: [
    { key: "stats.globales", label: "Voir les statistiques globales (toutes agences)" },
    { key: "stats.personnelles", label: "Voir ses propres statistiques" },
    { key: "stats.exporter", label: "Exporter les données (CSV / sauvegarde)" },
  ]},
  { group: "CONFIGURATION", permissions: [
    { key: "config.acceder", label: "Accéder à la configuration" },
    { key: "config.tarifs", label: "Modifier les tarifs, devises et commissions" },
    { key: "config.categories", label: "Gérer les catégories de produits" },
  ]},
  { group: "UTILISATEURS", permissions: [
    { key: "users.consulter", label: "Consulter les utilisateurs" },
    { key: "users.gerer", label: "Créer / modifier / supprimer un utilisateur" },
    { key: "users.permissions", label: "Gérer les permissions des autres comptes" },
  ]},
  { group: "ASSISTANT IA", permissions: [
    { key: "ia.utiliser", label: "Utiliser l'assistant IA" },
  ]},
];

const ROLE_DEFAULT_PERMISSIONS = {
  "Administrateur": PERMISSIONS_SCHEMA.flatMap((g) => g.permissions.map((p) => p.key)),
  "Agent": ["colis.voir_propres", "colis.voir_tous", "colis.creer", "colis.modifier", "colis.changer_statut", "colis.enregistrer_paiement", "bordereaux.consulter", "bordereaux.creer", "bordereaux.modifier", "bordereaux.valider", "factures.consulter", "factures.creer", "factures.modifier", "paiements.voir_propres", "clients.consulter", "stats.personnelles", "ia.utiliser"],
  "Comptable": ["colis.voir_tous", "factures.consulter", "factures.creer", "factures.modifier", "clients.consulter", "bordereaux.consulter", "compta.consulter", "compta.gerer_depenses", "compta.charges_fixes", "compta.marges", "stats.globales", "stats.exporter"],
  "Chauffeur": ["colis.voir_propres", "colis.changer_statut", "stats.personnelles"],
};

function effectivePermission(user, key) {
  if (!user) return false;
  if (user.permissionsOverride && Object.prototype.hasOwnProperty.call(user.permissionsOverride, key)) return user.permissionsOverride[key];
  return (ROLE_DEFAULT_PERMISSIONS[user.role] || []).includes(key);
}

const T = {
  fr: { dashboard: "Tableau de bord", colis: "Colis", tarif: "Tarification", clients: "Clients", admin: "Configuration", ia: "Assistant IA", logout: "Déconnexion", newColis: "Nouveau colis", search: "Rechercher", createAccount: "Créer un compte", bordereaux: "Bordereaux", paiements: "Paiements & Factures" },
  en: { dashboard: "Dashboard", colis: "Parcels", tarif: "Pricing", clients: "Clients", admin: "Settings", ia: "AI Assistant", logout: "Log out", newColis: "New parcel", search: "Search", createAccount: "Create account", bordereaux: "Waybills", paiements: "Payments & Invoices" },
  ar: { dashboard: "لوحة القيادة", colis: "الطرود", tarif: "التسعير", clients: "العملاء", admin: "الإعدادات", ia: "مساعد الذكاء الاصطناعي", logout: "تسجيل الخروج", newColis: "طرد جديد", search: "بحث", createAccount: "إنشاء حساب", bordereaux: "بيانات الشحن", paiements: "المدفوعات والفواتير" },
};

function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return "h" + h.toString(16);
}
function genTracking() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `BDE-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
}
function genOtp() { return String(Math.floor(100000 + Math.random() * 900000)); }
let LIVE_RATES = { ...CURRENCIES };
function fmt(n, cur) {
  const v = n * (LIVE_RATES[cur] || CURRENCIES[cur] || 1);
  const decimals = cur === "GNF" || cur === "XOF" ? 0 : 2;
  return `${v.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${cur}`;
}
/** Comme fmt(), mais renvoie juste le nombre converti (sans suffixe de devise) — utile pour préremplir un champ modifiable. */
function fmtRaw(n, cur) {
  const v = n * (LIVE_RATES[cur] || CURRENCIES[cur] || 1);
  const decimals = cur === "GNF" || cur === "XOF" ? 0 : 2;
  return +v.toFixed(decimals);
}
/** Formate un montant déjà exprimé en GNF (ex: prix de catégorie, valeur déclarée saisie directement) sans reconversion. */
function fmtGNF(n) {
  return `${Math.round(n || 0).toLocaleString("fr-FR")} GNF`;
}
/** Calcule en direct l'équivalent GNF d'une catégorie à partir du taux de change actuel — se met à jour automatiquement si le taux change. */
function catPriceGNF(cat) {
  if (!cat) return 0;
  const montant = Number(cat.montant ?? cat.prixGNF ?? 0);
  const devise = cat.deviseSaisie || "GNF";
  if (devise === "GNF") return montant;
  const eurBase = montant / (LIVE_RATES[devise] || CURRENCIES[devise] || 1);
  return Math.round(eurBase * (LIVE_RATES.GNF || CURRENCIES.GNF));
}
/** Calcule la commission d'agence gagnée sur un colis, en EUR, selon les taux (globaux ou par catégorie). */
function calcCommission(colis, commissionConfig, categories) {
  const cfg = commissionConfig || { parKg: 2, parUnite: 5 };
  if (!colis.produits || colis.produits.length === 0) {
    return (Number(colis.poids) || 0) * cfg.parKg;
  }
  return colis.produits.reduce((total, p) => {
    const cat = (categories || []).find((c) => c.nom === p.categorie);
    const isKg = cat ? cat.type === "kg" : true;
    const rate = cat && cat.commissionRate != null ? cat.commissionRate : (isKg ? cfg.parKg : cfg.parUnite);
    const base = isKg ? (Number(p.poids) || 0) : (Number(p.quantite) || 1);
    return total + rate * base;
  }, 0);
}
/** Ajoute une entrée au journal d'activité global (les 500 dernières actions sont conservées). */
function pushActivity(data, session, action, detail) {
  const entry = { id: `log${Date.now()}${Math.random().toString(36).slice(2,5)}`, action, detail, date: new Date().toISOString(), utilisateur: `${session.prenom} ${session.nom}`, role: session.role };
  return [entry, ...(data.activityLog || [])].slice(0, 500);
}
function waLink(phone, msg) { return `https://wa.me/${(phone || "").replace(/[^\d]/g, "")}?text=${encodeURIComponent(msg)}`; }

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}
async function loadJsPDF() {
  if (!window.jspdf) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  return window.jspdf;
}
/**
 * Ouvre le PDF dans un nouvel onglet plutôt que de forcer un téléchargement direct :
 * les téléchargements déclenchés par JS sont souvent bloqués silencieusement dans les
 * environnements en iframe (aucune erreur visible), alors que l'ouverture d'un onglet
 * est généralement autorisée. L'utilisateur peut ensuite l'enregistrer depuis le navigateur.
 */
function openPdf(doc, filename) {
  try {
    const blobUrl = doc.output("bloburl");
    const w = window.open(blobUrl, "_blank");
    if (!w) throw new Error("popup bloqué");
  } catch (e) {
    console.error("Ouverture en onglet impossible, tentative de téléchargement direct.", e);
    doc.save(filename);
  }
}
async function ensureAutoTable() {
  if (window.jspdf?.jsPDF?.API?.autoTable) return true;
  try {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js");
    return true;
  } catch (e) {
    console.error("autoTable indisponible, tableau manuel utilisé à la place.", e);
    return false;
  }
}
async function ensureQRCodeLib() {
  if (window.QRCode) return true;
  try { await loadScript("https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"); return true; }
  catch (e) { console.error("Librairie QR indisponible.", e); return false; }
}
/** Génère un QR code entièrement côté navigateur (aucun appel réseau vers un service tiers). */
async function generateQRDataUrl(text, size = 200) {
  const ok = await ensureQRCodeLib();
  if (!ok) throw new Error("Librairie QR non chargée");
  const holder = document.createElement("div");
  holder.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
  document.body.appendChild(holder);
  try {
    new window.QRCode(holder, { text, width: size, height: size, correctLevel: window.QRCode.CorrectLevel.M });
    await new Promise((r) => setTimeout(r, 60)); // laisse le temps au canvas de se dessiner
    const canvas = holder.querySelector("canvas");
    const img = holder.querySelector("img");
    const dataUrl = canvas ? canvas.toDataURL("image/png") : img?.src;
    if (!dataUrl) throw new Error("QR non généré");
    return dataUrl;
  } finally {
    document.body.removeChild(holder);
  }
}

function defaultSeed() {
  const emojis = { "Vêtements": "👕", "Électronique": "📱", "Documents": "📄", "Alimentaire": "🍎", "Cosmétiques": "💄", "Autre": "📦" };
  return {
    users: [{ id: "u1", prenom: "Ibrahima", nom: "Ba-Diaby", email: "contact@badiaby-express.com", telephone: "+224620000000", identifiant: "admin", motdepasse: hash("admin123"), role: "Administrateur", twoFA: false }],
    colis: [], lang: "fr",
    exchangeRates: { ...CURRENCIES },
    categories: ["Vêtements", "Électronique", "Documents", "Alimentaire", "Cosmétiques", "Autre"].map((nom, i) => ({
      id: `cat-${i}`, nom, description: "", emoji: emojis[nom] || "📦", type: "kg",
      montant: { "Vêtements": 15000, "Électronique": 25000, "Documents": 5000, "Alimentaire": 12000, "Cosmétiques": 18000, "Autre": 15000 }[nom],
      deviseSaisie: "GNF", visibiliteColis: true, visibiliteFactures: true, paysLimite: null, parDefaut: nom === "Autre", ordre: i, motsCles: [],
      commissionRate: null, // EUR/kg ou EUR/unité ; null = utilise le taux général
    })),
    sites: [
      { id: "site-bambeto", nom: "Bambeto", adresse: "Bambeto, Conakry", horaires: "Lun–Sam 8h–18h", paiements: "Espèces, Orange Money", stockage: "Retrait sous 7 jours" },
      { id: "site-madina", nom: "Madina", adresse: "Madina, Conakry", horaires: "Lun–Sam 8h–18h", paiements: "Espèces, Orange Money", stockage: "Retrait sous 7 jours" },
    ],
    commissionConfig: { parKg: 2, parUnite: 5 }, // EUR — modifiable par l'Administrateur uniquement
  };
}
async function loadData() {
  try {
    const r = await storage.get("bde-data", true);
    return JSON.parse(r.value);
  } catch (e) {
    const seed = defaultSeed();
    try { await storage.set("bde-data", JSON.stringify(seed), true); }
    catch (e2) { console.error("Stockage indisponible, poursuite en mode local sans sauvegarde.", e2); }
    return seed;
  }
}
async function saveData(data) {
  try { await storage.set("bde-data", JSON.stringify(data), true); } catch (e) { console.error(e); }
}

/** QR code affiché à l'écran, généré localement, avec repli visuel en cas d'échec. */
function QRCodeImg({ value, size = 70 }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    generateQRDataUrl(value, size * 3).then((url) => { if (!cancelled) setSrc(url); }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [value, size]);
  if (failed) return <div style={{ width: size, height: size, background: "var(--surface2)", borderRadius: 6, display: "grid", placeItems: "center", fontSize: 9, color: "var(--muted)", textAlign: "center" }}>QR indisponible</div>;
  if (!src) return <div style={{ width: size, height: size, background: "var(--surface2)", borderRadius: 6 }} />;
  return <img src={src} alt="QR" width={size} height={size} style={{ background: "#fff", borderRadius: 6, padding: 4 }} />;
}

function Barcode({ value }) {
  return (
    <div style={{ height: 40, background: "var(--surface)", padding: "4px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 1 }}>
      {value.split("").map((ch, i) => (
        <div key={i} style={{ width: (ch.charCodeAt(0) % 3) + 1, height: 28 + (ch.charCodeAt(0) % 8), background: "#0A2647" }} />
      ))}
    </div>
  );
}

/** Détecte si l'écran est de taille mobile, et se met à jour de façon fiable — y compris dans un
 * aperçu intégré (iframe) où l'événement "resize" classique du navigateur ne se déclenche pas toujours. */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 900 : false));
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 900); }
    check(); // s'assure que la valeur est correcte dès que la mise en page finale est prête, pas seulement au tout premier rendu
    window.addEventListener("resize", check);
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(check);
      ro.observe(document.documentElement);
    }
    return () => { window.removeEventListener("resize", check); if (ro) ro.disconnect(); };
  }, []);
  return isMobile;
}

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [session, setSession] = useState(null);
  const [view, setView] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [lang, setLang] = useState("fr");
  const [theme, setTheme] = useState("dark");
  const [collapsed, setCollapsed] = useState(false);
  const [adminResetKey, setAdminResetKey] = useState(0);
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let settled = false;
    loadData()
      .then((d) => { settled = true; setData(d); setLang(d.lang || "fr"); setTheme(d.theme || "dark"); if (d.exchangeRates) LIVE_RATES = { ...CURRENCIES, ...d.exchangeRates }; setLoading(false); })
      .catch((e) => { settled = true; console.error("Échec du chargement, démarrage en mode local.", e); setOffline(true); setData(defaultSeed()); setLoading(false); });
    const timeout = setTimeout(() => {
      if (!settled) { console.error("Délai de chargement dépassé, démarrage en mode local."); setOffline(true); setData(defaultSeed()); setLoading(false); }
    }, 7000);
    return () => clearTimeout(timeout);
  }, []);

  function persist(next) { setData(next); if (next.exchangeRates) LIVE_RATES = { ...CURRENCIES, ...next.exchangeRates }; if (!offline) saveData(next); }
  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 2800); }
  function setLanguage(l) { setLang(l); persist({ ...data, lang: l }); }
  function toggleTheme() { const next = theme === "dark" ? "light" : "dark"; setTheme(next); persist({ ...data, theme: next }); }
  const t = T[lang];
  const rtl = lang === "ar";

  if (loading) {
    return <Shell rtl={false} theme={theme}><div style={{ display: "grid", placeItems: "center", height: "100vh", color: "var(--text)", fontFamily: "'Space Grotesk',sans-serif" }}>Chargement de Ba-Diaby Express…</div></Shell>;
  }
  if (!session) {
    return <Shell rtl={false} theme={theme}><Login users={data.users} onLogin={(u) => {
      const normalized = { prenom: "", nom: "", email: "", telephone: "", twoFA: false, ...u };
      setSession(normalized);
      try { persist({ ...data, users: (data.users || []).map((x) => (x.id === u.id ? normalized : x)) }); }
      catch (ex) { console.error("Migration du compte impossible :", ex); }
    }} offline={offline} theme={theme} onToggleTheme={toggleTheme} /></Shell>;
  }

  const canAdmin = session.role === "Administrateur";
  const canOps = session.role === "Administrateur" || session.role === "Agent";
  const canFinance = session.role === "Administrateur" || session.role === "Comptable";
  const perm = (key) => effectivePermission(session, key);

  const nav = [
    { key: "dashboard", label: t.dashboard, icon: LayoutDashboard, show: true },
    { key: "colis", label: t.colis, icon: Package, show: perm("colis.voir_propres") || perm("colis.voir_tous") },
    { key: "clients", label: t.clients, icon: Users, show: perm("clients.consulter") },
    { key: "bordereaux", label: t.bordereaux, icon: FileStack, show: perm("bordereaux.consulter") },
    { key: "paiements", label: t.paiements, icon: Receipt, show: perm("factures.consulter") },
    { key: "comptabilite", label: "Comptabilité", icon: DollarSign, show: perm("compta.consulter") },
    { key: "ia", label: t.ia, icon: Sparkles, show: perm("ia.utiliser") },
    { key: "admin", label: t.admin, icon: Settings, show: perm("config.acceder") },
  ].filter((n) => n.show);

  return (
    <Shell rtl={rtl} theme={theme}>
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--surface2)" }}>
        {isMobile && mobileNavOpen && (
          <div onClick={() => setMobileNavOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
        )}
        <aside style={{
          width: isMobile ? 240 : (collapsed ? 72 : 240),
          transition: isMobile ? "transform 0.2s ease" : "width 0.18s ease",
          background: "#0A2647", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0,
          position: isMobile ? "fixed" : "relative", insetInlineStart: 0, top: 0, bottom: 0, zIndex: 41,
          transform: isMobile ? (mobileNavOpen ? "translateX(0)" : (rtl ? "translateX(100%)" : "translateX(-100%)")) : "none",
        }}>
          {!isMobile && (
            <button onClick={() => setCollapsed((c) => !c)} title={collapsed ? "Déplier le menu" : "Replier le menu"} style={{
              position: "absolute", top: 22, insetInlineEnd: -12, width: 24, height: 24, borderRadius: "50%",
              background: "#E23F52", border: "2px solid var(--surface2)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", zIndex: 5,
            }}>
              {(collapsed && !rtl) || (!collapsed && rtl) ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>
          )}
          {isMobile && (
            <button onClick={() => setMobileNavOpen(false)} style={{ position: "absolute", top: 18, insetInlineEnd: 14, width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", zIndex: 5 }}>
              <X size={16} />
            </button>
          )}
          <div style={{ padding: (collapsed && !isMobile) ? "22px 10px" : "22px 20px", borderBottom: "1px solid rgba(255,255,255,0.12)", overflow: "hidden" }}>
            {(collapsed && !isMobile) ? (
              data.branding?.logo ? <img src={data.branding.logo} alt="logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", margin: "0 auto", display: "block" }} /> : <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, textAlign: "center" }}>BD</div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {data.branding?.logo && <img src={data.branding.logo} alt="logo" style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover" }} />}
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, whiteSpace: "nowrap" }}>
                    {data.branding?.nom ? data.branding.nom : <>BA-DIABY <span style={{ color: "#E7455A" }}>EXPRESS</span></>}
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3, whiteSpace: "nowrap" }}>{data.branding?.tagline || "Gestion des colis · Conakry ⇄ Monde"}</div>
              </>
            )}
          </div>
          <nav style={{ padding: 12, display: "flex", flexDirection: "column", gap: 3, flex: 1, overflowY: "auto" }}>
            {nav.map((n) => (
              <button key={n.key} onClick={() => { setView(n.key); if (n.key === "admin") setAdminResetKey((k) => k + 1); setMobileNavOpen(false); }} title={(collapsed && !isMobile) ? n.label : undefined} style={{
                display: "flex", alignItems: "center", gap: 10, padding: (collapsed && !isMobile) ? "10px 0" : "10px 12px", justifyContent: (collapsed && !isMobile) ? "center" : "flex-start",
                borderRadius: 8, background: view === n.key ? "#E23F52" : "transparent", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, textAlign: "start",
              }}>
                <n.icon size={17} /> {!(collapsed && !isMobile) && n.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: (collapsed && !isMobile) ? "14px 8px" : 14, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            {!(collapsed && !isMobile) && (
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {["fr", "en", "ar"].map((l) => (
                  <button key={l} onClick={() => setLanguage(l)} style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", background: lang === l ? "#E23F52" : "transparent", color: "#fff", fontSize: 11, cursor: "pointer" }}>{l.toUpperCase()}</button>
                ))}
              </div>
            )}
            <button onClick={toggleTheme} title={theme === "dark" ? "Mode clair" : "Mode sombre"} style={{
              display: "flex", alignItems: "center", justifyContent: (collapsed && !isMobile) ? "center" : "flex-start", gap: 8, width: "100%",
              padding: "7px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", fontSize: 12, cursor: "pointer", marginBottom: (collapsed && !isMobile) ? 10 : 12,
            }}>
              {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />} {!(collapsed && !isMobile) && (theme === "dark" ? "Mode sombre" : "Mode clair")}
            </button>
            {!(collapsed && !isMobile) && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{session.prenom} {session.nom}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 10 }}>{session.role}</div>
              </>
            )}
            <button onClick={() => setSession(null)} title={(collapsed && !isMobile) ? t.logout : undefined} style={{ display: "flex", alignItems: "center", justifyContent: (collapsed && !isMobile) ? "center" : "flex-start", gap: 8, width: "100%", fontSize: 13, color: "#E7455A", background: "none", border: "none", cursor: "pointer" }}>
              <LogOut size={15} /> {!(collapsed && !isMobile) && t.logout}
            </button>
          </div>
        </aside>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {isMobile && (
            <div style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#0A2647", color: "#fff" }}>
              <button onClick={() => setMobileNavOpen(true)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, width: 34, height: 34, display: "grid", placeItems: "center", color: "#fff", cursor: "pointer", flexShrink: 0 }}>
                <Menu size={18} />
              </button>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {nav.find((n) => n.key === view)?.label || (data.branding?.nom || "BA-DIABY EXPRESS")}
              </div>
            </div>
          )}
          <main style={{ flex: 1, padding: isMobile ? "16px 14px" : "28px 32px", overflowY: "auto", minWidth: 0 }}>
            {view === "dashboard" && <Dashboard data={data} session={session} onNavigate={setView} />}
            {view === "colis" && <ColisView data={data} persist={persist} session={session} notify={notify} t={t} />}
            {view === "clients" && <Clients data={data} />}
            {view === "bordereaux" && <BordereauxPage data={data} persist={persist} session={session} notify={notify} />}
            {view === "paiements" && <PaiementsPage data={data} notify={notify} />}
            {view === "comptabilite" && <ComptabilitePage data={data} persist={persist} session={session} notify={notify} />}
            {view === "ia" && <AiAssistant data={data} />}
            {view === "admin" && perm("config.acceder") && <ConfigurationHub key={adminResetKey} data={data} persist={persist} session={session} notify={notify} onNavigateApp={setView} offline={offline} />}
          </main>
        </div>
      </div>
      {toast && <div style={{ position: "fixed", bottom: 24, insetInlineEnd: 24, insetInlineStart: isMobile ? 24 : "auto", background: "#0A2647", color: "#fff", padding: "12px 18px", borderRadius: 10, fontSize: 13.5, boxShadow: "0 8px 24px rgba(10,38,71,0.3)", textAlign: "center" }}>{toast}</div>}
    </Shell>
  );
}

function Shell({ children, rtl, theme }) {
  return (
    <div dir={rtl ? "rtl" : "ltr"} data-theme={theme || "dark"}>
      <style>{`
        @import url('${FONT_LINK}');
        * { box-sizing: border-box; }
        :root, [data-theme="dark"] {
          --bg: #0A0F1C; --surface: #131A2B; --surface2: #1B2438; --border: #242E47; --text: #F1F4FA; --muted: #8A97B5;
        }
        [data-theme="light"] {
          --bg: #F3F5FA; --surface: #FFFFFF; --surface2: #EEF1F8; --border: #DCE2F0; --text: #101828; --muted: #5B6B82;
        }
        body { margin: 0; background: var(--bg); }
        input, select, button { font-family: 'Inter', sans-serif; }
        input, select { color: var(--text); }
        ::placeholder { color: #55628A; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 8px; }

        /* --- Adaptation mobile --- */
        /* Tout conteneur qui contient directement une table devient défilable horizontalement,
           pour que les tableaux ne débordent jamais de l'écran sur mobile. */
        div:has(> table) { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { min-width: 560px; }
        @media (max-width: 768px) {
          /* Empêche le zoom automatique sur iOS quand on touche un champ (nécessite 16px minimum) */
          input, select, textarea { font-size: 16px !important; }
          /* Les grilles à 2 colonnes fixes passent à 1 colonne sur petit écran */
          .responsive-grid-2 { grid-template-columns: 1fr !important; }
          /* Les cartes de statistiques restent lisibles */
          h1 { font-size: 20px !important; }
        }
      `}</style>
      {children}
    </div>
  );
}

function Login({ users, onLogin, offline, theme, onToggleTheme }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");

  function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const list = users || [];
      const u = list.find((x) => x.identifiant === id.trim() && (x.motdepasse === hash(pw) || x.motdepasse === pw));
      if (!u) { setErr("Identifiant ou mot de passe incorrect."); return; }
      const migrated = u.motdepasse === pw ? { ...u, motdepasse: hash(pw) } : u;
      if (u.twoFA) { const code = genOtp(); setOtp(code); setPending(migrated); }
      else onLogin(migrated);
    } catch (ex) {
      console.error(ex);
      setErr("Erreur technique : " + ex.message);
    }
  }
  function verifyOtp(e) {
    e.preventDefault();
    if (otpInput === otp) onLogin(pending);
    else setErr("Code de vérification incorrect.");
  }

  if (pending) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#0A2647 0%,#0A2647 55%,#C8102E 250%)" }}>
        <div style={{ width: "min(92vw, 380px)", background: "var(--surface)", borderRadius: 16, padding: "34px 32px", boxShadow: "0 24px 60px rgba(10,38,71,0.35)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><ShieldCheck size={18} color="#E23F52" /><div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: "var(--text)" }}>Double authentification</div></div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>Démo : aucune passerelle SMS n'étant connectée, votre code de vérification est affiché ci-dessous.</div>
          <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "12px 16px", textAlign: "center", fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, letterSpacing: 4, color: "var(--text)", marginBottom: 14 }}>{otp}</div>
          <div>
            <input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && verifyOtp(e)} placeholder="Entrez le code à 6 chiffres" style={{ ...inputStyle, marginBottom: 10, textAlign: "center" }} />
            {err && <div style={{ color: "#E23F52", fontSize: 12.5, marginBottom: 8 }}>{err}</div>}
            <button type="button" onClick={verifyOtp} style={{ width: "100%", background: "#E23F52", color: "#fff", border: "none", borderRadius: 9, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Vérifier</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#0A2647 0%,#0A2647 55%,#C8102E 250%)" }}>
      <div style={{ width: "min(92vw, 380px)", background: "var(--surface)", borderRadius: 16, padding: "34px 32px", boxShadow: "0 24px 60px rgba(10,38,71,0.35)", position: "relative" }}>
        {onToggleTheme && (
          <button onClick={onToggleTheme} title="Changer de thème" style={{ position: "absolute", top: 18, insetInlineEnd: 18, width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", cursor: "pointer", display: "grid", placeItems: "center" }}>
            {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        )}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: "var(--text)" }}>BA-DIABY <span style={{ color: "#E23F52" }}>EXPRESS</span></div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>Plateforme de gestion logistique</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ fontSize: 12.5, color: "var(--text)", fontWeight: 600 }}>Identifiant</label>
          <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 9, padding: "9px 12px", gap: 8 }}>
            <User size={15} color="var(--muted)" />
            <input value={id} onChange={(e) => setId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit(e)} placeholder="admin" style={{ border: "none", outline: "none", flex: 1, fontSize: 14 }} />
          </div>
          <label style={{ fontSize: 12.5, color: "var(--text)", fontWeight: 600 }}>Mot de passe</label>
          <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 9, padding: "9px 12px", gap: 8 }}>
            <Lock size={15} color="var(--muted)" />
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit(e)} placeholder="••••••••" style={{ border: "none", outline: "none", flex: 1, fontSize: 14 }} />
          </div>
          {err && <div style={{ color: "#E23F52", fontSize: 12.5 }}>{err}</div>}
          <button type="button" onClick={submit} style={{ marginTop: 6, background: "#E23F52", color: "#fff", border: "none", borderRadius: 9, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Se connecter</button>
        </div>
        <div style={{ marginTop: 16, fontSize: 11.5, color: "var(--muted)", textAlign: "center" }}>Compte de démonstration : admin / admin123</div>
        <div style={{ marginTop: 6, fontSize: 10, color: "#C8D3E2", textAlign: "center" }}>Comptes chargés : {(users || []).length}</div>
        {offline && (
          <div style={{ marginTop: 14, background: "#2B1620", color: "#E23F52", borderRadius: 8, padding: "9px 12px", fontSize: 11.5, textAlign: "center" }}>
            Mode local : le stockage n'a pas répondu, vos données ne seront pas sauvegardées entre deux sessions.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tint, trend, trendColor, outline }) {
  return (
    <div style={{ background: SURFACE, borderRadius: 14, padding: "18px 20px", flex: 1, minWidth: 180, border: `1.5px solid ${outline || BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12.5, color: MUTED, fontWeight: 600 }}>{label}</div>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: tint, display: "grid", placeItems: "center" }}><Icon size={16} color="#fff" /></div>
      </div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: TEXT, marginTop: 10 }}>{value}</div>
      {trend && <div style={{ fontSize: 11.5, color: trendColor || GREEN, marginTop: 6, fontWeight: 600 }}>{trend}</div>}
    </div>
  );
}

function Dashboard({ data, session, onNavigate }) {
  const colis = data.colis;
  const total = colis.length;
  const now = new Date();
  const thisMonth = colis.filter((c) => { const d = new Date(c.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  const enTransit = colis.filter((c) => c.status === "En transit").length;
  const aExpedier = colis.filter((c) => c.status === "Enregistré").length;
  const ca = colis.reduce((s, c) => s + c.prix, 0);
  const encaisse = colis.reduce((s, c) => s + c.paye, 0);
  const parPays = COUNTRIES.map((p) => ({ ...p, count: colis.filter((c) => c.pays === p.code).length }));
  const recent = [...colis].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const parAgence = (data.sites || []).map((s) => ({ nom: s.nom, count: colis.filter((c) => (c.site || "Bambeto") === s.nom).length, ca: colis.filter((c) => (c.site || "Bambeto") === s.nom).reduce((sum, c) => sum + c.prix, 0) }));

  const quickActions = [
    { label: "Nouveau Colis", desc: "Créer une étiquette pour un client", icon: Plus, tint: "#E23F52", view: "colis" },
    { label: "Générer un bordereau", desc: "Expéditions maritimes ou aériennes", icon: FileStack, tint: "#3D63FF", view: "bordereaux" },
    { label: "Rechercher un colis", desc: "Par numéro de suivi ou nom", icon: Search, tint: "#2FAE73", view: "colis" },
    { label: "Consulter les paiements", desc: "Transactions et factures", icon: Receipt, tint: "#E0A63A", view: "paiements" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)", fontSize: 24, margin: 0 }}>Bonjour, {(session?.prenom || "").toUpperCase() || "—"}</h1>
          <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "4px 0 0" }}>Voici un aperçu de votre activité logistique</p>
          <p style={{ color: "var(--muted)", fontSize: 12.5, margin: "4px 0 0" }}>📍 Envoi de GUINÉE vers plusieurs destinations 🇬🇳</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => onNavigate("admin")} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Settings size={14} /> Configuration</button>
          <button onClick={() => onNavigate("colis")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#E23F52", color: "#fff", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}><Plus size={14} /> Nouveau Colis</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Volume total" value={total} icon={Package} tint="#3D63FF" trend={`+${thisMonth} ce mois`} trendColor="#3ECB84" />
        <StatCard label="Revenus" value={fmt(ca, "EUR")} icon={DollarSign} tint="#3ECB84" trend={`${fmt(encaisse, "EUR")} encaissés`} trendColor="#3ECB84" outline="#1E4430" />
        <StatCard label="En transit" value={enTransit} icon={Plane} tint="#5B8DEF" trend="Actuellement en cours" trendColor="var(--muted)" />
        <StatCard label="À expédier" value={aExpedier} icon={AlertTriangle} tint="#E23F52" trend={aExpedier > 0 ? "Nécessite action" : "Rien en attente"} trendColor={aExpedier > 0 ? "#E23F52" : "var(--muted)"} />
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14.5 }}>Opérations fréquentes</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {quickActions.map((a) => (
            <button key={a.label} onClick={() => onNavigate(a.view)} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", cursor: "pointer", textAlign: "start" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: a.tint, display: "grid", placeItems: "center", flexShrink: 0 }}><a.icon size={17} color="#fff" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{a.label}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{a.desc}</div>
              </div>
              <ChevronRight size={16} color="var(--muted)" />
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14.5, marginBottom: 12 }}>Répartition par destination</div>
        {parPays.map((p) => (
          <div key={p.code} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 130, fontSize: 13, color: "var(--text)" }}>{FLAGS[p.code]} {p.name}</div>
            <div style={{ flex: 1, height: 8, background: "var(--surface2)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${total ? (p.count / total) * 100 : 0}%`, height: "100%", background: "#E23F52" }} />
            </div>
            <div style={{ width: 24, textAlign: "right", fontSize: 13, color: "var(--muted)" }}>{p.count}</div>
          </div>
        ))}
        {total === 0 && <div style={{ color: "var(--muted)", fontSize: 13 }}>Aucun colis enregistré pour le moment.</div>}
      </div>

      {parAgence.length > 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14.5, marginBottom: 12 }}>Statistiques par agence</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            {parAgence.map((a) => (
              <div key={a.nom} style={{ background: "var(--surface2)", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{a.nom}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "'Space Grotesk',sans-serif", marginTop: 4 }}>{a.count}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>colis · {fmt(a.ca, "EUR")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14.5 }}>Activité récente</div>
          {total > 0 && <button onClick={() => onNavigate("colis")} style={{ background: "none", border: "none", color: "#5B8DEF", fontSize: 12.5, cursor: "pointer" }}>Voir tout</button>}
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--muted)", fontSize: 13 }}>
            Aucune activité pour le moment.<br />Les nouveaux colis apparaîtront ici.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {recent.map((c) => {
              const st = STATUS_STYLE[c.status];
              return (
                <div key={c.tracking} onClick={() => onNavigate("colis")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px", borderBottom: "1px solid var(--surface2)", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{c.tracking} · {c.destinataire}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{routeLabel(c.pays, c.direction)}</div>
                  </div>
                  <span style={{ background: st.bg, color: st.fg, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{c.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function calcPrice(countryCode, poids, volume, mode) {
  const c = COUNTRIES.find((x) => x.code === countryCode);
  if (!c) return 0;
  const rate = mode === "air" ? c.air : c.sea;
  const volKg = Math.max(Number(poids) || 0, (Number(volume) || 0) * 167);
  return +(5 + volKg * rate).toFixed(2);
}

function ConfigurationHub({ data, persist, session, notify, onNavigateApp, offline }) {
  const [sub, setSub] = useState(null);
  const back = () => setSub(null);

  if (sub === "site") return <SiteVitrinePage data={data} persist={persist} notify={notify} onBack={back} />;
  if (sub === "routes") return <RoutesTarifsPage data={data} persist={persist} session={session} notify={notify} onBack={back} />;
  if (sub === "devises") return <GestionDevisesPage data={data} persist={persist} session={session} notify={notify} onBack={back} />;
  if (sub === "commissions") return <CommissionsPage data={data} persist={persist} session={session} notify={notify} onBack={back} />;
  if (sub === "categories") return <CategoriesProduitsPage data={data} persist={persist} session={session} notify={notify} onBack={back} />;
  if (sub === "sites") return <SitesOperationPage data={data} persist={persist} notify={notify} onBack={back} />;
  if (sub === "notifications") return <NotificationsPage data={data} persist={persist} notify={notify} onBack={back} />;
  if (sub === "mira") return <MiraKnowledgePage data={data} persist={persist} notify={notify} onBack={back} />;
  if (sub === "paiement") return <PaiementConfigPage data={data} persist={persist} notify={notify} onBack={back} />;
  if (sub === "branding") return <BrandingPage data={data} persist={persist} notify={notify} onBack={back} />;
  if (sub === "users") return <UtilisateursPage data={data} persist={persist} notify={notify} onBack={back} session={session} />;
  if (sub === "systeme") return <ParametresSystemePage data={data} persist={persist} notify={notify} onBack={back} offline={offline} />;
  if (sub === "journal") return <JournalActivitePage data={data} onBack={back} />;

  const Card = ({ icon: Icon, tint, title, desc, onClick }) => (
    <button onClick={onClick} style={{ display: "flex", gap: 14, textAlign: "start", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 18, cursor: "pointer" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: tint, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon size={18} color="#fff" /></div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>{desc}</div>
      </div>
    </button>
  );
  const SectionLabel = ({ children, badge }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "22px 0 10px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.5 }}>{children}</div>
      {badge && <span style={{ background: "#3D63FF", color: "#fff", fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 5 }}>{badge}</span>}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)", fontSize: 24, margin: 0 }}>Configuration</h1>
          <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "4px 0 0" }}>Gérez les paramètres globaux de votre plateforme logistique.</p>
        </div>
        <button onClick={() => onNavigateApp("dashboard")} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "9px 14px", color: "var(--text)", fontSize: 12.5, cursor: "pointer", flexShrink: 0 }}>
          <LayoutDashboard size={14} /> Retour Dashboard
        </button>
      </div>

      <SectionLabel badge="NOUVEAU">CANAUX DE VENTE</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
        <Card icon={Globe} tint="#3D63FF" title="Site Vitrine Public" desc="Personnalisez votre page d'accueil, activez le tracking public et configurez votre nom de domaine." onClick={() => setSub("site")} />
      </div>

      <SectionLabel>COMMERCIAL &amp; LOGISTIQUE</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        <Card icon={DollarSign} tint="#8B5CF6" title="Routes &amp; Tarifs" desc="Gérer les taux de change, prix par kg et destinations." onClick={() => setSub("routes")} />
        <Card icon={RefreshCw} tint="#0EA5E9" title="Gestion des devises" desc="Un taux par devise, partagé automatiquement par tous les pays concernés." onClick={() => setSub("devises")} />
        <Card icon={Users} tint="#2FAE73" title="Commissions par Agence" desc="Définissez combien chaque agence gagne par kg et par unité vendue." onClick={() => setSub("commissions")} />
        <Card icon={Receipt} tint="#E0794E" title="Catégories de Produits" desc="Configuration des types de marchandises et taxes." onClick={() => setSub("categories")} />
        <Card icon={MapPin} tint="#2FAE73" title="Sites d'opération" desc="Gérez vos points d'enregistrement et de retrait, et les informations affichées sur le ticket d'envoi (horaires, paiements, stockage...)." onClick={() => setSub("sites")} />
        <Card icon={AlertTriangle} tint="#3ECB84" title="Notifications" desc="Gérez les notifications WhatsApp automatiques et contrôlez les évènements." onClick={() => setSub("notifications")} />
        <Card icon={Sparkles} tint="#6366F1" title="Connaissances de Mira" desc="Donnez à l'IA les infos de votre entreprise pour des réponses plus utiles à vos clients." onClick={() => setSub("mira")} />
        <Card icon={Receipt} tint="#5B8DEF" title="Paiement" desc="Configurez vos numéros pour accepter les paiements de vos clients." onClick={() => setSub("paiement")} />
      </div>

      <SectionLabel>ADMINISTRATION</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        <Card icon={ShieldCheck} tint="#E23F52" title="Branding &amp; Identité" desc="Logo, textes légaux et personnalisation de l'identité." onClick={() => setSub("branding")} />
        <Card icon={Users} tint="#6366F1" title="Gestion Utilisateurs" desc="Accès, rôles et permissions de l'équipe." onClick={() => setSub("users")} />
        <Card icon={Settings} tint="#6B7280" title="Paramètres Système" desc="Options avancées de la plateforme." onClick={() => setSub("systeme")} />
        <Card icon={FileStack} tint="#5B8DEF" title="Journal d'activité" desc="Historique complet des actions effectuées par les utilisateurs." onClick={() => setSub("journal")} />
      </div>
    </div>
  );
}


function ConfigPageHeader({ title, desc, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 22 }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px", color: "var(--text)", fontSize: 12.5, cursor: "pointer", flexShrink: 0, marginTop: 2 }}>
        <ChevronLeft size={14} /> Configuration
      </button>
      <div>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)", fontSize: 22, margin: 0 }}>{title}</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 0" }}>{desc}</p>
      </div>
    </div>
  );
}

function RoutesTarifsPage({ data, persist, session, notify, onBack }) {
  const [pays, setPays] = useState("FR");
  const [poids, setPoids] = useState("5");
  const [mode, setMode] = useState("air");
  const [cur, setCur] = useState("EUR");
  const prix = calcPrice(pays, poids, "", mode);
  const dest = COUNTRIES.find((c) => c.code === pays);

  return (
    <div>
      <ConfigPageHeader title="Routes & Tarifs" desc="Simulateur de tarif d'expédition par destination et mode de transport." onBack={onBack} />

      <div style={{ background: "linear-gradient(135deg, #131A6B, #0A1740)", borderRadius: 14, padding: "20px 22px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700, color: "#fff" }}>Routes & Tarifs</div>
          <div style={{ fontSize: 12.5, color: "#B8C2E0", marginTop: 4 }}>Les taux de change sont désormais gérés par devise, pas par route — voir "Gestion des devises".</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#fff" }}>
          Module Maritime : <strong style={{ color: "#FF8A9B" }}>DÉSACTIVÉ</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ background: "var(--surface)", borderRadius: 14, padding: 22, width: "min(92vw, 340px)", border: "1px solid var(--border)" }}>
          <Field label="Pays de destination"><select value={pays} onChange={(e) => setPays(e.target.value)} style={inputStyle}>{COUNTRIES.filter(c => c.code !== "GN").map((c) => <option key={c.code} value={c.code}>{FLAGS[c.code]} {c.name} — {c.city}</option>)}</select></Field>
          <Field label="Poids (kg)"><input value={poids} onChange={(e) => setPoids(e.target.value)} style={inputStyle} /></Field>
          <Field label="Mode de transport">
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setMode("air")} style={{ ...toggleBtn, ...(mode === "air" ? toggleActive : {}) }}><Plane size={14} /> Aérien</button>
              <button disabled title="Voie maritime temporairement indisponible" style={{ ...toggleBtn, opacity: 0.4, cursor: "not-allowed" }}><Ship size={14} /> Maritime</button>
            </div>
          </Field>
          <Field label="Devise d'affichage"><select value={cur} onChange={(e) => setCur(e.target.value)} style={inputStyle}>{Object.keys(data?.exchangeRates || CURRENCIES).map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
        </div>
        <div style={{ background: "#0A2647", borderRadius: 14, padding: 26, width: 260, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Tarif estimé</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 30, fontWeight: 700, marginTop: 6, color: "#fff" }}>{fmt(prix, cur)}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8, textAlign: "center" }}>Conakry → {dest?.city} · {mode === "air" ? "Aérien" : "Maritime"} · devise {dest?.currency}</div>
        </div>
      </div>
    </div>
  );
}

function CommissionsPage({ data, persist, session, notify, onBack }) {
  const isAdmin = session?.role === "Administrateur";
  const cfg = data.commissionConfig || { parKg: 2, parUnite: 5 };
  const categories = data.categories || [];
  const [parKg, setParKg] = useState(String(cfg.parKg));
  const [parUnite, setParUnite] = useState(String(cfg.parUnite));
  const [catEdits, setCatEdits] = useState({});

  function saveGeneral() {
    const k = Number(String(parKg).replace(",", "."));
    const u = Number(String(parUnite).replace(",", "."));
    if (isNaN(k) || isNaN(u) || k < 0 || u < 0) return;
    persist({ ...data, commissionConfig: { parKg: k, parUnite: u }, activityLog: pushActivity(data, session, "Taux de commission modifié", `${k} €/kg, ${u} €/unité`) });
    notify?.("Taux de commission mis à jour pour toutes les agences");
  }
  function saveCategoryRate(cat) {
    const raw = catEdits[cat.id];
    if (raw === undefined) return;
    const n = raw.trim() === "" ? null : Number(String(raw).replace(",", "."));
    if (n !== null && (isNaN(n) || n < 0)) return;
    persist({ ...data, categories: categories.map((c) => (c.id === cat.id ? { ...c, commissionRate: n } : c)) });
    setCatEdits((e) => { const n2 = { ...e }; delete n2[cat.id]; return n2; });
    notify?.(`Commission personnalisée mise à jour pour "${cat.nom}"`);
  }

  // Aperçu : simulateur simple
  const [simPoids, setSimPoids] = useState("5");
  const simCommission = (Number(simPoids) || 0) * (Number(parKg) || 0);

  return (
    <div>
      <ConfigPageHeader title="Commissions par Agence" desc="Combien chaque agence gagne sur chaque colis traité — modifiable uniquement par l'Administrateur." onBack={onBack} />

      {!isAdmin && (
        <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: "var(--muted)", marginBottom: 18, maxWidth: 560 }}>
          🔒 Seul un Administrateur peut modifier ces taux. Vous consultez les valeurs actuelles.
        </div>
      )}

      <div style={{ background: "var(--surface)", borderRadius: 14, padding: 22, maxWidth: 460, border: "1px solid var(--border)", marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 4 }}>Taux généraux</div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, marginBottom: 16 }}>S'appliquent à toutes les catégories, sauf si une catégorie a son propre taux ci-dessous.</p>
        <Field label="Commission par kg (produits facturés au poids)">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input value={parKg} onChange={(e) => setParKg(e.target.value)} disabled={!isAdmin} style={{ ...inputStyle, opacity: isAdmin ? 1 : 0.6 }} />
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>€ / kg</span>
          </div>
        </Field>
        <Field label="Commission par unité (produits facturés à l'unité)">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input value={parUnite} onChange={(e) => setParUnite(e.target.value)} disabled={!isAdmin} style={{ ...inputStyle, opacity: isAdmin ? 1 : 0.6 }} />
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>€ / unité</span>
          </div>
        </Field>
        {isAdmin && <button onClick={saveGeneral} style={{ background: "#3D63FF", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>}
      </div>

      <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden", maxWidth: 640, marginBottom: 20 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>Taux personnalisés par catégorie</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Laissez vide pour utiliser le taux général.</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--surface2)" }}>
              <th style={{ padding: "10px 16px", fontSize: 10.5, color: "var(--muted)", fontWeight: 700 }}>CATÉGORIE</th>
              <th style={{ padding: "10px 16px", fontSize: 10.5, color: "var(--muted)", fontWeight: 700 }}>UNITÉ</th>
              <th style={{ padding: "10px 16px", fontSize: 10.5, color: "var(--muted)", fontWeight: 700 }}>TAUX PERSONNALISÉ</th>
              <th style={{ padding: "10px 16px", fontSize: 10.5, color: "var(--muted)", fontWeight: 700, textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--text)" }}>{c.emoji} {c.nom}</td>
                <td style={{ padding: "10px 16px", fontSize: 12.5, color: "var(--muted)" }}>{c.type === "kg" ? "€/kg" : "€/unité"}</td>
                <td style={{ padding: "10px 16px" }}>
                  {isAdmin ? (
                    <input
                      value={catEdits[c.id] !== undefined ? catEdits[c.id] : (c.commissionRate ?? "")}
                      onChange={(e) => setCatEdits((s) => ({ ...s, [c.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && saveCategoryRate(c)}
                      placeholder={`défaut : ${c.type === "kg" ? parKg : parUnite}`}
                      style={{ ...inputStyle, width: 120 }}
                    />
                  ) : (
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>{c.commissionRate != null ? `${c.commissionRate} €` : "taux général"}</span>
                  )}
                </td>
                <td style={{ padding: "10px 16px", textAlign: "right" }}>
                  {isAdmin && catEdits[c.id] !== undefined && <button onClick={() => saveCategoryRate(c)} style={{ background: "#3ECB84", color: "#0A2647", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, border: "1px solid var(--border)", maxWidth: 320 }}>
        <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 12 }}>Exemple rapide</div>
        <Field label="Poids simulé (kg)"><input value={simPoids} onChange={(e) => setSimPoids(e.target.value)} style={inputStyle} /></Field>
        <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontWeight: 700, color: "var(--text)", textAlign: "center" }}>
          L'agence gagne {fmt(simCommission, "EUR")}
        </div>
      </div>
    </div>
  );
}

function GestionDevisesPage({ data, persist, session, notify, onBack }) {
  const isAdmin = session?.role === "Administrateur";
  const rates = data?.exchangeRates || CURRENCIES;
  const [edits, setEdits] = useState({});
  const [testAmount, setTestAmount] = useState("100");
  const [testFrom, setTestFrom] = useState("EUR");
  const [testTo, setTestTo] = useState("GNF");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  const currenciesList = Object.keys(rates).filter((c) => c !== "GNF"); // GNF est la devise de référence Guinée, toujours affichée séparément

  function countriesFor(cur) {
    return COUNTRIES.filter((c) => c.currency === cur);
  }

  function save(cur) {
    const raw = edits[cur];
    if (raw === undefined) return;
    const cleaned = String(raw).replace(/\s/g, "").replace(",", ".");
    const n = Number(cleaned); // n = combien de GNF pour 1 unité de `cur`
    if (isNaN(n) || n <= 0) return;
    // Le système interne exprime tous les taux relativement à 1 EUR (EUR reste toujours la base = 1).
    // Éditer "EUR → GNF" fixe donc directement le taux GNF de référence.
    // Éditer une autre devise recalcule son propre taux pour que son équivalent en GNF corresponde à la valeur saisie.
    const gnfPerEur = cur === "EUR" ? n : (rates.GNF || CURRENCIES.GNF);
    const merged = cur === "EUR" ? { ...rates, GNF: n } : { ...rates, [cur]: gnfPerEur / n };
    persist({ ...data, exchangeRates: merged, activityLog: pushActivity(data, session, "Taux de change modifié", `1 ${cur} = ${n.toLocaleString("fr-FR")} GNF`) });
    setEdits((e) => { const n2 = { ...e }; delete n2[cur]; return n2; });
    notify?.(`Taux ${cur} → GNF mis à jour : tous les pays en ${cur} sont synchronisés automatiquement`);
  }

  function testConversion() {
    const amount = Number(String(testAmount).replace(",", ".")) || 0;
    const eurBase = amount / (LIVE_RATES[testFrom] || 1);
    const result = eurBase * (LIVE_RATES[testTo] || 1);
    return result;
  }

  function synchroniser() {
    setSyncing(true);
    // Force la relecture des taux en vigueur dans LIVE_RATES et republie les données pour rafraîchir tous les affichages (colis, catégories, frais).
    LIVE_RATES = { ...CURRENCIES, ...rates };
    persist({ ...data });
    const nbPays = COUNTRIES.filter((c) => c.code !== "GN").length;
    const nbCategories = (data.categories || []).length;
    setTimeout(() => {
      setSyncing(false);
      setSyncMsg(`Synchronisation terminée : ${nbPays} pays et ${nbCategories} catégories mis à jour selon les taux actuels.`);
      notify?.("Toutes les données ont été synchronisées");
    }, 500);
  }

  return (
    <div>
      <ConfigPageHeader title="Gestion des devises" desc="Un seul taux par devise — tous les pays qui la partagent sont mis à jour automatiquement." onBack={onBack} />

      <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden", marginBottom: 22, maxWidth: 640 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: "12px 16px", fontSize: 10.5, color: "var(--muted)", fontWeight: 700, letterSpacing: 0.5 }}>DEVISE</th>
              <th style={{ padding: "12px 16px", fontSize: 10.5, color: "var(--muted)", fontWeight: 700, letterSpacing: 0.5 }}>PAYS CONCERNÉS</th>
              <th style={{ padding: "12px 16px", fontSize: 10.5, color: "var(--muted)", fontWeight: 700, letterSpacing: 0.5 }}>TAUX (1 {`{DEV}`} → GNF)</th>
              <th style={{ padding: "12px 16px", fontSize: 10.5, color: "var(--muted)", fontWeight: 700, letterSpacing: 0.5, textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: "1px solid var(--border)", background: "var(--surface2)" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--text)" }}>{FLAGS.GN} GNF</td>
              <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--muted)" }}>Guinée (devise de référence)</td>
              <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted)" }}>—</td>
              <td></td>
            </tr>
            {currenciesList.map((cur) => {
              const paysListe = countriesFor(cur);
              const gnfRate = (rates.GNF || CURRENCIES.GNF) / (rates[cur] || 1); // 1 unité de `cur` en GNF
              return (
                <tr key={cur} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--text)" }}>{cur}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--muted)" }}>
                    {paysListe.length > 0 ? paysListe.map((c) => `${FLAGS[c.code]} ${c.name}`).join(", ") : "Aucun pays associé pour l'instant"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {isAdmin ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          value={edits[cur] !== undefined ? edits[cur] : gnfRate.toLocaleString("fr-FR", { maximumFractionDigits: 4 })}
                          onChange={(e) => setEdits((s) => ({ ...s, [cur]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && save(cur)}
                          style={{ ...inputStyle, width: 130 }}
                        />
                        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>GNF</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--text)" }}>{gnfRate.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} GNF</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    {isAdmin && edits[cur] !== undefined && (
                      <button onClick={() => save(cur)} style={{ background: "#3ECB84", color: "#0A2647", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, border: "1px solid var(--border)", width: "min(92vw, 320px)" }}>
          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 12 }}>Tester la conversion</div>
          <Field label="Montant"><input value={testAmount} onChange={(e) => setTestAmount(e.target.value)} style={inputStyle} /></Field>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1 }}><Field label="De"><select value={testFrom} onChange={(e) => setTestFrom(e.target.value)} style={inputStyle}>{Object.keys(rates).map((c) => <option key={c} value={c}>{c}</option>)}</select></Field></div>
            <div style={{ flex: 1 }}><Field label="Vers"><select value={testTo} onChange={(e) => setTestTo(e.target.value)} style={inputStyle}>{Object.keys(rates).map((c) => <option key={c} value={c}>{c}</option>)}</select></Field></div>
          </div>
          <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 12px", fontSize: 15, fontWeight: 700, color: "var(--text)", textAlign: "center" }}>
            {testAmount || 0} {testFrom} = {testConversion().toLocaleString("fr-FR", { maximumFractionDigits: 2 })} {testTo}
          </div>
        </div>

        {isAdmin && (
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, border: "1px solid var(--border)", width: "min(92vw, 320px)" }}>
            <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 8 }}>Synchronisation</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Recalcule immédiatement les prix de catégories, frais d'expédition et montants affichés selon les taux actuels.</div>
            <button onClick={synchroniser} disabled={syncing} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#3D63FF", color: "#fff", border: "none", borderRadius: 9, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {syncing ? <RefreshCw size={15} /> : <RefreshCw size={15} />} {syncing ? "Synchronisation…" : "Synchroniser toutes les données"}
            </button>
            {syncMsg && <div style={{ marginTop: 12, background: "#12261D", color: "#3ECB84", borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>✓ {syncMsg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function emptyCategory() {
  return { id: `cat-${Date.now()}`, nom: "", description: "", emoji: "📦", type: "unite", prix: "0", devise: "GNF", visibiliteColis: true, visibiliteFactures: true, paysLimite: null, parDefaut: false, ordre: 0, motsCles: [] };
}

function CategoriesProduitsPage({ data, persist, session, notify, onBack }) {
  const isAdmin = session?.role === "Administrateur";
  const categories = data?.categories || [];
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null); // category being created/edited (raw form state)
  const [motsClesText, setMotsClesText] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);

  const filtered = categories.filter((c) => !query || c.nom.toLowerCase().includes(query.toLowerCase()) || c.description?.toLowerCase().includes(query.toLowerCase()) || c.motsCles?.some((k) => k.toLowerCase().includes(query.toLowerCase())));

  function openNew() {
    setForm(emptyCategory());
    setMotsClesText("");
    setSaved(false);
  }
  function openEdit(cat) {
    setForm({ ...cat, prix: String(cat.montant ?? cat.prixGNF ?? 0), devise: cat.deviseSaisie || "GNF" });
    setMotsClesText((cat.motsCles || []).join(", "));
    setSaved(false);
  }

  function confirmPrix() {
    if (isNaN(Number(form.prix)) || Number(form.prix) < 0) return;
    setSaved(true);
    notify?.(`Montant confirmé : ${form.prix} ${form.devise} — équivalent actuel ${fmtGNF(catPriceGNF({ montant: form.prix, deviseSaisie: form.devise }))}, se recalculera automatiquement si le taux change`);
  }

  function saveCategory() {
    if (!form.nom.trim()) return;
    const motsCles = motsClesText.split(",").map((k) => k.trim()).filter(Boolean);
    const exists = categories.some((c) => c.id === form.id);
    const payload = { ...form, montant: Number(form.prix) || 0, deviseSaisie: form.devise, motsCles };
    delete payload.prix; delete payload.devise; delete payload.prixGNF;
    const next = exists ? categories.map((c) => (c.id === form.id ? payload : c)) : [...categories, payload];
    persist({ ...data, categories: next });
    notify?.(exists ? "Catégorie mise à jour" : "Catégorie créée");
    setForm(null);
  }
  function removeCategory(id) {
    persist({ ...data, categories: categories.filter((c) => c.id !== id) });
  }
  function testDetection() {
    const q = testInput.toLowerCase();
    const match = categories.find((c) => c.motsCles?.some((k) => q.includes(k.toLowerCase())));
    setTestResult(match ? match.nom : "Aucune catégorie détectée");
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <ConfigPageHeader title="Gestion des Catégories de Produits" desc="Configurez les catégories et leurs tarifs pour votre entreprise." onBack={onBack} />
        {isAdmin && !form && <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 6, background: "#3D63FF", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}><Plus size={16} /> Nouvelle Catégorie</button>}
      </div>

      {!form && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px", marginBottom: 18, maxWidth: 420 }}>
          <Search size={15} color="var(--muted)" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par nom, description ou mots-clés..." style={{ border: "none", outline: "none", background: "none", flex: 1, fontSize: 13.5, color: "var(--text)" }} />
        </div>
      )}

      {form ? (
        <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", maxWidth: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 15 }}>{categories.some((c) => c.id === form.id) ? "Modifier la catégorie" : "Nouvelle catégorie"}</div>
            {saved && <span style={{ background: "#12261D", color: "#3ECB84", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Prix confirmé ✓</span>}
          </div>

          <div style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.5, marginBottom: 10 }}>INFORMATIONS DE BASE</div>
            <Field label="Nom de la catégorie *"><input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle} placeholder="ex: Électronique Premium" /></Field>
            <Field label="Description"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} placeholder="Description détaillée" /></Field>
            <Field label="Emoji"><input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} style={{ ...inputStyle, width: 70 }} /></Field>

            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.5, margin: "18px 0 10px" }}>TARIFICATION</div>
            <Field label="Type de tarification *">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                <option value="unite">Par unité</option>
                <option value="kg">Par kg</option>
              </select>
            </Field>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Field label="Prix *"><input value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} style={inputStyle} /></Field>
              </div>
              <div style={{ width: 110 }}>
                <Field label="Devise"><select value={form.devise} onChange={(e) => setForm({ ...form, devise: e.target.value })} style={inputStyle}>{Object.keys(data?.exchangeRates || CURRENCIES).map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
              </div>
              <button onClick={confirmPrix} style={{ marginBottom: 14, background: "#3ECB84", color: "#0A2647", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Confirmer</button>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: -8, marginBottom: 14 }}>
              ⚠️ Prix recalculé en direct selon le taux actuel{Number(form.prix) > 0 ? ` — équivalent : ${fmtGNF(catPriceGNF({ montant: form.prix, deviseSaisie: form.devise }))}` : " — cliquez sur Confirmer pour valider la saisie"}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.5, margin: "18px 0 10px" }}>PORTÉE D'APPLICATION</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Visibilité par contexte</div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13, color: "var(--text)" }}>
              <input type="checkbox" checked={form.visibiliteColis} onChange={(e) => setForm({ ...form, visibiliteColis: e.target.checked })} /> Création de colis
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, cursor: "pointer", fontSize: 13, color: "var(--text)" }}>
              <input type="checkbox" checked={form.visibiliteFactures} onChange={(e) => setForm({ ...form, visibiliteFactures: e.target.checked })} /> Factures commerciales
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13, color: "var(--text)" }}>
              <input type="checkbox" checked={!!form.paysLimite} onChange={(e) => setForm({ ...form, paysLimite: e.target.checked ? "FR" : null })} />
              <span>Limiter à un pays spécifique<br /><span style={{ fontSize: 11, color: "var(--muted)" }}>Par défaut universelle, activez pour un pays unique</span></span>
            </label>
            {form.paysLimite && (
              <select value={form.paysLimite} onChange={(e) => setForm({ ...form, paysLimite: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }}>
                {COUNTRIES.filter((c) => c.code !== "GN").map((c) => <option key={c.code} value={c.code}>{FLAGS[c.code]} {c.name}</option>)}
              </select>
            )}

            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.5, margin: "18px 0 10px" }}>OPTIONS AVANCÉES</div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer", fontSize: 13, color: "var(--text)" }}>
              <input type="checkbox" checked={form.parDefaut} onChange={(e) => setForm({ ...form, parDefaut: e.target.checked })} /> Catégorie par défaut
            </label>
            <Field label="Ordre d'affichage"><input value={form.ordre} onChange={(e) => setForm({ ...form, ordre: e.target.value })} style={inputStyle} /></Field>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", margin: "18px 0 8px", display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={13} /> Mots-clés de détection automatique</div>
            <textarea value={motsClesText} onChange={(e) => setMotsClesText(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} placeholder="iphone, samsung, galaxy, smartphone, téléphone, mobile" />
            <div style={{ fontSize: 11, color: "var(--muted)", margin: "6px 0 14px" }}>Séparez les mots-clés par des virgules pour la détection automatique.</div>

            <Field label="Test de détection"><input value={testInput} onChange={(e) => setTestInput(e.target.value)} style={inputStyle} placeholder="ex: iPhone 15 Pro Max" /></Field>
            <button onClick={testDetection} style={{ width: "100%", background: "#3D63FF", color: "#fff", border: "none", borderRadius: 9, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Tester</button>
            {testResult && <div style={{ marginTop: 10, fontSize: 12.5, color: testResult === "Aucune catégorie détectée" ? "#E0A63A" : "#3ECB84" }}>{testResult === "Aucune catégorie détectée" ? testResult : `Catégorie détectée : ${testResult}`}</div>}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{form.emoji}</span>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{form.nom || "Nom de la catégorie"}</div><div style={{ fontSize: 11.5, color: "var(--muted)" }}>{fmtGNF(catPriceGNF({ montant: form.prix, deviseSaisie: form.devise }))}/{form.type === "kg" ? "kg" : "unité"}</div></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setForm(null)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>Annuler</button>
              <button onClick={saveCategory} style={{ background: "#3D63FF", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{categories.some((c) => c.id === form.id) ? "Enregistrer" : "Créer"}</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {filtered.sort((a, b) => (a.ordre || 0) - (b.ordre || 0)).map((c) => (
            <div key={c.id} style={{ background: "var(--surface)", borderRadius: 14, padding: 18, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{c.emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{c.nom}{c.parDefaut && <span style={{ marginLeft: 6, fontSize: 10, color: "#5B8DEF" }}>défaut</span>}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{fmtGNF(catPriceGNF(c))}/{c.type === "kg" ? "kg" : "unité"} <span style={{ fontSize: 10, opacity: 0.7 }}>({c.montant} {c.deviseSaisie})</span></div>
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(c)} style={{ background: "none", border: "none", color: "#5B8DEF", cursor: "pointer" }}><Settings size={14} /></button>
                    <button onClick={() => removeCategory(c.id)} style={{ background: "none", border: "none", color: "#E23F52", cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              {c.description && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>{c.description}</div>}
              {c.paysLimite && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{FLAGS[c.paysLimite]} Limité à {COUNTRIES.find((x) => x.code === c.paysLimite)?.name}</div>}
              {c.motsCles?.length > 0 && <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 6 }}>🔑 {c.motsCles.slice(0, 4).join(", ")}{c.motsCles.length > 4 ? "…" : ""}</div>}
            </div>
          ))}
          {filtered.length === 0 && <div style={{ color: "var(--muted)", fontSize: 13 }}>Aucune catégorie ne correspond à votre recherche.</div>}
        </div>
      )}
    </div>
  );
}

const inputStyle = { width: "100%", border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "9px 11px", fontSize: 13.5, outline: "none", color: TEXT, background: SURFACE2 };
const toggleBtn = { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1.5px solid ${BORDER}`, background: SURFACE2, borderRadius: 8, padding: "9px 0", fontSize: 13, cursor: "pointer", color: MUTED };
const toggleActive = { background: BLUE, color: "#fff", borderColor: BLUE };

function Field({ label, children }) {
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>{label}</div>{children}</div>;
}

function ColisView({ data, persist, session, notify, t }) {
  const [showForm, setShowForm] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const isChauffeur = session.role === "Chauffeur";
  const peutCreer = effectivePermission(session, "colis.creer");
  const list = data.colis
    .filter((c) => (isChauffeur ? c.status === "En livraison" : true))
    .filter((c) => !query || c.tracking.toLowerCase().includes(query.toLowerCase()) || c.destinataire.toLowerCase().includes(query.toLowerCase()));

  function logActivity(action, detail) { return pushActivity(data, session, action, detail); }
  function addColis(colis) {
    persist({ ...data, colis: [colis, ...data.colis], activityLog: logActivity("Colis créé", `${colis.tracking} — ${colis.destinataire}`) });
    notify(`Colis ${colis.tracking} enregistré`);
    setShowForm(false);
  }
  function updateColis(tracking, patch) {
    const next = { ...data, colis: data.colis.map((c) => (c.tracking === tracking ? { ...c, ...patch } : c)) };
    persist(next);
    setSelected(next.colis.find((c) => c.tracking === tracking));
  }
  function advance(tracking) {
    const current = data.colis.find((c) => c.tracking === tracking);
    if (!current) return;
    const idx = STATUSES.indexOf(current.status);
    const nextStatus = STATUSES[Math.min(idx + 1, STATUSES.length - 1)];
    const next = { ...data, colis: data.colis.map((c) => {
      if (c.tracking !== tracking) return c;
      return { ...c, status: nextStatus, historique: [...c.historique, {
        status: nextStatus, date: new Date().toISOString(),
        utilisateur: `${session.prenom} ${session.nom}`, agence: c.site || "Bambeto",
      }] };
    }) };
    next.activityLog = logActivity("Changement de statut", `${tracking} → ${nextStatus}`);
    persist(next);
    notify("Statut mis à jour — pensez à notifier le client via WhatsApp");
    setSelected(next.colis.find((c) => c.tracking === tracking));
  }
  function annuler(tracking, motif) {
    const next = { ...data, colis: data.colis.map((c) => {
      if (c.tracking !== tracking) return c;
      return { ...c, status: "Annulé", historique: [...c.historique, {
        status: "Annulé", date: new Date().toISOString(),
        utilisateur: `${session.prenom} ${session.nom}`, agence: c.site || "Bambeto", motif,
      }] };
    }) };
    next.activityLog = logActivity("Colis annulé", `${tracking}${motif ? ` — ${motif}` : ""}`);
    persist(next);
    notify("Colis annulé");
    setSelected(next.colis.find((c) => c.tracking === tracking));
  }
  function remove(tracking) { persist({ ...data, colis: data.colis.filter((c) => c.tracking !== tracking), activityLog: logActivity("Colis supprimé", tracking) }); setSelected(null); }
  function encaisser(tracking, montant, mode, montantSaisi, deviseSaisie, details) {
    const next = { ...data, colis: data.colis.map((c) => {
      if (c.tracking !== tracking) return c;
      const paye = +(c.paye + montant).toFixed(2);
      const reste = Math.max(+(c.prix - paye).toFixed(2), 0);
      const paiement = { id: `pay${Date.now()}`, montant, montantSaisi, deviseSaisie, mode, date: new Date().toISOString(), par: `${session.prenom} ${session.nom}`, reference: details?.reference || "", numeroPayeur: details?.numeroPayeur || "", numeroReceveur: details?.numeroReceveur || "" };
      return { ...c, paye, reste, paiements: [...(c.paiements || []), paiement] };
    }) };
    next.activityLog = logActivity("Paiement encaissé", `${tracking} — ${montantSaisi} ${deviseSaisie} (${mode})${details?.reference ? ` réf. ${details.reference}` : ""}`);
    persist(next);
    notify("Paiement encaissé");
    setSelected(next.colis.find((c) => c.tracking === tracking));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)", fontSize: 24, margin: 0 }}>{t.colis}</h1>
          <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "4px 0 0" }}>{isChauffeur ? "Vos livraisons en cours" : "Enregistrement et suivi des expéditions"}</p>
        </div>
        {peutCreer && (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowAi(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: 9, padding: "10px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}><Sparkles size={16} color="#8B5CF6" /> Créer par IA</button>
            <button onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#E23F52", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}><Plus size={16} /> {t.newColis}</button>
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 9, padding: "8px 12px", marginBottom: 18, maxWidth: 380 }}>
        <Search size={15} color="var(--muted)" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`${t.search}...`} style={{ border: "none", outline: "none", flex: 1, fontSize: 13.5 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
        {list.map((c) => <TicketCard key={c.tracking} colis={c} onOpen={() => setSelected(c)} />)}
        {list.length === 0 && <div style={{ color: "var(--muted)", fontSize: 13.5 }}>Aucun colis à afficher.</div>}
      </div>
      {showForm && <ColisForm onClose={() => setShowForm(false)} onSave={addColis} existingColis={data.colis} categories={data.categories || []} session={session} sites={data.sites} />}
      {showAi && <AiColisModal onClose={() => setShowAi(false)} onCreate={addColis} data={data} />}
      {selected && <ColisDetail colis={selected} onClose={() => setSelected(null)} onAdvance={() => advance(selected.tracking)} onDelete={() => remove(selected.tracking)} onCancel={(motif) => annuler(selected.tracking, motif)} onUpdate={(patch) => updateColis(selected.tracking, patch)} onEncaisser={(montant, mode, montantSaisi, deviseSaisie, details) => encaisser(selected.tracking, montant, mode, montantSaisi, deviseSaisie, details)} canManage={!isChauffeur} isAdmin={session.role === "Administrateur"} isChauffeur={isChauffeur} data={data} session={session} />}
    </div>
  );
}

function genBordereauNumero(bordereaux) {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const seq = String(1000 + (bordereaux || []).length).slice(-4);
  return `BR${ymd}BAD-${seq}`;
}

function BordereauxPage({ data, persist, session, notify }) {
  const [mode, setMode] = useState("liste"); // liste | creation | detail
  const [selectedId, setSelectedId] = useState(null);
  const bordereaux = data.bordereaux || [];
  const selected = bordereaux.find((b) => b.id === selectedId);

  function openDetail(id) { setSelectedId(id); setMode("detail"); }
  function creerBordereau(numero, pays, direction, colisTrackings) {
    const b = { id: `bord-${Date.now()}`, numero, pays, direction, colisTrackings, statut: "En cours", dateCreation: new Date().toISOString(), dateModif: new Date().toISOString() };
    persist({ ...data, bordereaux: [b, ...bordereaux], activityLog: pushActivity(data, session, "Bordereau créé", `${numero} — ${colisTrackings.length} colis`) });
    notify?.(`Bordereau ${numero} créé`);
    setSelectedId(b.id); setMode("detail");
  }
  function updateBordereau(id, patch) {
    persist({ ...data, bordereaux: bordereaux.map((b) => (b.id === id ? { ...b, ...patch, dateModif: new Date().toISOString() } : b)) });
  }
  function marquerRecu(id) {
    updateBordereau(id, { statut: "Reçu" });
    notify?.("Bordereau marqué comme reçu");
  }

  if (mode === "creation") return <BordereauCreation data={data} onCancel={() => setMode("liste")} onCreate={creerBordereau} />;
  if (mode === "detail" && selected) return <BordereauDetail bordereau={selected} data={data} persist={persist} session={session} notify={notify} onBack={() => setMode("liste")} onUpdate={(patch) => updateBordereau(selected.id, patch)} onMarquerRecu={() => marquerRecu(selected.id)} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)", fontSize: 24, margin: 0 }}>Bordereaux</h1>
          <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "4px 0 0" }}>Choisissez précisément quels colis expédier dans chaque bordereau.</p>
        </div>
        {effectivePermission(session, "bordereaux.creer") && <button onClick={() => setMode("creation")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#E23F52", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}><Plus size={16} /> Nouveau bordereau</button>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {bordereaux.map((b) => {
          const colisInclus = data.colis.filter((c) => b.colisTrackings.includes(c.tracking));
          const poids = colisInclus.reduce((s, c) => s + c.poids, 0);
          const montant = colisInclus.reduce((s, c) => s + c.prix, 0);
          const country = COUNTRIES.find((c) => c.code === b.pays);
          return (
            <button key={b.id} onClick={() => openDetail(b.id)} style={{ textAlign: "start", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{b.numero}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{routeLabel(b.pays, b.direction)} · {b.colisTrackings.length} colis · {poids.toFixed(1)} kg</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{fmt(montant, "EUR")}</div>
                <span style={{ background: b.statut === "Reçu" ? "#0F2A1C" : "#16233F", color: b.statut === "Reçu" ? "#3ECB84" : "#5B8DEF", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{b.statut}</span>
              </div>
            </button>
          );
        })}
        {bordereaux.length === 0 && <div style={{ color: "var(--muted)", fontSize: 13 }}>Aucun bordereau créé pour le moment.</div>}
      </div>
    </div>
  );
}

function BordereauCreation({ data, onCancel, onCreate }) {
  const [pays, setPays] = useState("FR");
  const [direction, setDirection] = useState("export");
  const [selectedTrackings, setSelectedTrackings] = useState([]);
  const country = COUNTRIES.find((c) => c.code === pays);

  const dejaInclus = new Set((data.bordereaux || []).filter((b) => b.statut !== "Reçu").flatMap((b) => b.colisTrackings));
  const eligibles = data.colis.filter((c) => c.pays === pays && (c.direction || "export") === direction && c.status !== "Livré" && c.status !== "Annulé" && !dejaInclus.has(c.tracking));

  function toggle(tracking) {
    setSelectedTrackings((list) => (list.includes(tracking) ? list.filter((t) => t !== tracking) : [...list, tracking]));
  }
  function toutSelectionner() { setSelectedTrackings(eligibles.map((c) => c.tracking)); }
  function creer() {
    if (selectedTrackings.length === 0) return;
    onCreate(genBordereauNumero(data.bordereaux || []), pays, direction, selectedTrackings);
  }

  return (
    <div>
      <ConfigPageHeader title="Nouveau bordereau" desc="Sélectionnez la route puis choisissez précisément les colis à expédier." onBack={onCancel} />
      <div style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ width: 260 }}>
          <Field label="Pays"><select value={pays} onChange={(e) => { setPays(e.target.value); setSelectedTrackings([]); }} style={inputStyle}>{COUNTRIES.filter((c) => c.code !== "GN").map((c) => <option key={c.code} value={c.code}>{FLAGS[c.code]} {c.name}</option>)}</select></Field>
        </div>
        <div style={{ width: 260 }}>
          <Field label="Sens">
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setDirection("export"); setSelectedTrackings([]); }} style={{ ...toggleBtn, ...(direction === "export" ? toggleActive : {}) }}>Conakry → {country?.city}</button>
              <button onClick={() => { setDirection("import"); setSelectedTrackings([]); }} style={{ ...toggleBtn, ...(direction === "import" ? toggleActive : {}) }}>{country?.city} → Conakry</button>
            </div>
          </Field>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{selectedTrackings.length} / {eligibles.length} colis sélectionnés</div>
        <button onClick={toutSelectionner} style={{ background: "none", border: "none", color: "#5B8DEF", fontSize: 12.5, cursor: "pointer" }}>Tout sélectionner</button>
      </div>

      <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden", marginBottom: 18 }}>
        {eligibles.length === 0 ? (
          <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Aucun colis en attente sur cette route (ou déjà inclus dans un autre bordereau en cours).</div>
        ) : eligibles.map((c) => (
          <label key={c.tracking} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: "1px solid var(--border)", cursor: "pointer" }}>
            <input type="checkbox" checked={selectedTrackings.includes(c.tracking)} onChange={() => toggle(c.tracking)} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.tracking} — {c.destinataire}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{c.status} · {c.poids} kg</div>
            </div>
            <div style={{ fontSize: 13, color: "var(--text)" }}>{fmt(c.prix, "EUR")}</div>
          </label>
        ))}
      </div>

      <button onClick={creer} disabled={selectedTrackings.length === 0} style={{ background: selectedTrackings.length ? "#E23F52" : "var(--surface2)", color: selectedTrackings.length ? "#fff" : "var(--muted)", border: "none", borderRadius: 9, padding: "11px 22px", fontSize: 13.5, fontWeight: 700, cursor: selectedTrackings.length ? "pointer" : "not-allowed" }}>
        Créer le bordereau ({selectedTrackings.length} colis)
      </button>
    </div>
  );
}

function BordereauDetail({ bordereau, data, persist, session, notify, onBack, onUpdate, onMarquerRecu }) {
  const [modification, setModification] = useState(false);
  const [genPdf, setGenPdf] = useState(false);
  const [depenseForm, setDepenseForm] = useState(null);
  const country = COUNTRIES.find((c) => c.code === bordereau.pays);
  const colisInclus = data.colis.filter((c) => bordereau.colisTrackings.includes(c.tracking));
  const poids = colisInclus.reduce((s, c) => s + c.poids, 0);
  const montant = colisInclus.reduce((s, c) => s + c.prix, 0);

  const dejaInclusAilleurs = new Set((data.bordereaux || []).filter((b) => b.id !== bordereau.id && b.statut !== "Reçu").flatMap((b) => b.colisTrackings));
  const ajoutables = data.colis.filter((c) => c.pays === bordereau.pays && (c.direction || "export") === bordereau.direction && c.status !== "Livré" && c.status !== "Annulé" && !bordereau.colisTrackings.includes(c.tracking) && !dejaInclusAilleurs.has(c.tracking));

  function retirer(tracking) { onUpdate({ colisTrackings: bordereau.colisTrackings.filter((t) => t !== tracking) }); }
  function ajouter(tracking) { onUpdate({ colisTrackings: [...bordereau.colisTrackings, tracking] }); }

  async function telechargerPdf() {
    setGenPdf(true);
    try { await downloadRouteManifest(colisInclus, country, bordereau.direction); }
    catch (e) { console.error(e); notify?.("Échec de génération du PDF"); }
    setGenPdf(false);
  }
  function envoyerMail() {
    const sujet = `Bordereau ${bordereau.numero} — ${routeLabel(bordereau.pays, bordereau.direction)}`;
    const corps = `Bordereau ${bordereau.numero}\n${routeLabel(bordereau.pays, bordereau.direction)}\n${colisInclus.length} colis, ${poids.toFixed(1)} kg, ${fmt(montant, "EUR")}\n\n` + colisInclus.map((c) => `- ${c.tracking} · ${c.destinataire} · ${c.poids}kg`).join("\n");
    window.open(`mailto:?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`, "_blank");
  }
  function ajouterDepense() {
    if (!depenseForm?.nom || !depenseForm?.montant) return;
    const entry = { id: `dep${Date.now()}`, type: "Dépense", nom: `${depenseForm.nom} (${bordereau.numero})`, montant: Number(depenseForm.montant) || 0, date: new Date().toISOString() };
    persist({ ...data, depenses: [entry, ...(data.depenses || [])], activityLog: pushActivity(data, session, "Dépense liée à un bordereau", `${bordereau.numero} — ${entry.nom}`) });
    notify?.("Dépense ajoutée");
    setDepenseForm(null);
  }

  return (
    <div>
      <ConfigPageHeader title={`Bordereau ${bordereau.numero}`} desc={routeLabel(bordereau.pays, bordereau.direction)} onBack={onBack} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        {bordereau.statut !== "Reçu" && effectivePermission(session, "bordereaux.valider") && <button onClick={onMarquerRecu} style={{ background: "#3D63FF", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Marquer comme reçu</button>}
        <button onClick={telechargerPdf} disabled={genPdf} style={{ background: "var(--surface2)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: 9, padding: "10px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>{genPdf ? "Génération…" : "Télécharger PDF"}</button>
        <button onClick={envoyerMail} style={{ background: "var(--surface2)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: 9, padding: "10px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Envoyer un mail</button>
        <button onClick={() => setDepenseForm({ nom: "", montant: "" })} style={{ background: "var(--surface2)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: 9, padding: "10px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Ajouter une dépense</button>
        {effectivePermission(session, "bordereaux.modifier") && <button onClick={() => setModification((m) => !m)} style={{ background: "var(--surface2)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: 9, padding: "10px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>{modification ? "Terminer la modification" : "Modifier"}</button>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard label="Colis" value={colisInclus.length} icon={Package} tint="#3D63FF" />
        <StatCard label="Poids total" value={`${poids.toFixed(1)} kg`} icon={Truck} tint="#8B5CF6" />
        <StatCard label="Montant total" value={fmt(montant, "EUR")} icon={DollarSign} tint="#3ECB84" />
        <StatCard label="Statut" value={bordereau.statut} icon={CheckCircle2} tint={bordereau.statut === "Reçu" ? "#3ECB84" : "#5B8DEF"} />
      </div>

      <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 10 }}>Colis inclus ({colisInclus.length})</div>
      <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden", marginBottom: modification ? 18 : 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "var(--surface2)", textAlign: "left" }}>{["ID Colis", "Destinataire", "Statut", "Poids", "Prix", modification ? "" : null].filter(Boolean).map((h) => <th key={h} style={{ padding: "10px 14px", fontSize: 10.5, color: "var(--muted)", fontWeight: 700 }}>{h}</th>)}</tr></thead>
          <tbody>
            {colisInclus.map((c) => {
              const st = STATUS_STYLE[c.status];
              return (
                <tr key={c.tracking} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 14px", fontSize: 12.5, color: "var(--text)", fontWeight: 600 }}>{c.tracking}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12.5, color: "var(--text)" }}>{c.destinataire}</td>
                  <td style={{ padding: "10px 14px" }}><span style={{ background: st.bg, color: st.fg, padding: "3px 9px", borderRadius: 20, fontSize: 10.5, fontWeight: 700 }}>{c.status}</span></td>
                  <td style={{ padding: "10px 14px", fontSize: 12.5, color: "var(--muted)" }}>{c.poids} kg</td>
                  <td style={{ padding: "10px 14px", fontSize: 12.5, color: "var(--text)" }}>{fmt(c.prix, "EUR")}</td>
                  {modification && <td style={{ padding: "10px 14px", textAlign: "right" }}><button onClick={() => retirer(c.tracking)} style={{ background: "none", border: "none", color: "#E23F52", cursor: "pointer" }}><X size={14} /></button></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modification && (
        <div>
          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, margin: "18px 0 10px" }}>Ajouter un colis non expédié à ce bordereau</div>
          <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
            {ajoutables.length === 0 ? (
              <div style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>Aucun autre colis disponible sur cette route.</div>
            ) : ajoutables.map((c) => (
              <div key={c.tracking} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12.5, color: "var(--text)" }}>{c.tracking} — {c.destinataire} · {c.poids} kg</div>
                <button onClick={() => ajouter(c.tracking)} style={{ background: "#3ECB84", color: "#0A2647", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Ajouter</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {depenseForm && (
        <Modal onClose={() => setDepenseForm(null)} title="Ajouter une dépense liée à ce bordereau">
          <Field label="Libellé"><input value={depenseForm.nom} onChange={(e) => setDepenseForm({ ...depenseForm, nom: e.target.value })} style={inputStyle} placeholder="ex: Transport, douane..." /></Field>
          <Field label="Montant (GNF)"><input value={depenseForm.montant} onChange={(e) => setDepenseForm({ ...depenseForm, montant: e.target.value })} style={inputStyle} /></Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button onClick={() => setDepenseForm(null)} style={{ padding: "9px 16px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>Annuler</button>
            <button onClick={ajouterDepense} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "#E23F52", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TicketCard({ colis, onOpen }) {
  const st = STATUS_STYLE[colis.status];
  const Icon = st.icon;
  return (
    <div onClick={onOpen} style={{ background: "var(--surface)", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 10px rgba(10,38,71,0.07)", cursor: "pointer", border: "1px solid var(--surface2)" }}>
      <div style={{ background: "#0A2647", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#fff", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5 }}>{colis.tracking}</span>
        <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 10.5, padding: "3px 8px", borderRadius: 20 }}>{colis.mode === "air" ? "AÉRIEN" : "MARITIME"}</span>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{colis.destinataire}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{routeLabel(colis.pays, colis.direction)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, background: st.bg, color: st.fg, padding: "5px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, width: "fit-content" }}><Icon size={13} /> {colis.status}</div>
      </div>
    </div>
  );
}

const WIZARD_STEPS = [
  { key: "route", label: "Route", icon: Globe },
  { key: "expediteur", label: "Expéditeur", icon: User },
  { key: "destinataire", label: "Destinataire", icon: MapPin },
  { key: "produits", label: "Produits", icon: Package },
  { key: "frais", label: "Frais", icon: DollarSign },
  { key: "resume", label: "Résumé", icon: CheckCircle2 },
];

function StepIndicator({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
      {WIZARD_STEPS.map((s, i) => (
        <React.Fragment key={s.key}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center",
              background: i < step ? "#3D63FF" : i === step ? "#E23F52" : "var(--surface2)",
              border: i === step ? "2px solid #E23F52" : "none",
              color: i <= step ? "#fff" : "var(--muted)", fontSize: 12.5, fontWeight: 700,
            }}>{i < step ? <CheckCircle2 size={15} /> : <s.icon size={14} />}</div>
            <div style={{ fontSize: 10.5, color: i <= step ? "var(--text)" : "var(--muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{s.label}</div>
          </div>
          {i < WIZARD_STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? "#3D63FF" : "var(--surface2)", margin: "0 6px 18px" }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

/** Calcule la valeur (en GNF) d'une ligne produit : mode catalogue (catégorie) ou mode personnalisé (montant/devise/type saisis). */
function produitValeurGNF(p, categories) {
  const qty = Number(p.quantite) || 1;
  if (p.personnalise) {
    const montant = Number(p.montant) || 0;
    const devise = p.devise || "GNF";
    const montantGNF = devise === "GNF" ? montant : (montant / (LIVE_RATES[devise] || CURRENCIES[devise] || 1)) * (LIVE_RATES.GNF || CURRENCIES.GNF);
    return p.typePrix === "total" ? montantGNF : montantGNF * qty;
  }
  const cat = (categories || []).find((c) => c.nom === p.categorie);
  if (!cat) return 0;
  const rate = catPriceGNF(cat);
  return cat.type === "kg" ? rate * (Number(p.poids) || 0) : rate * qty;
}
function emptyProduit() { return { id: `p${Date.now()}${Math.random().toString(36).slice(2, 6)}`, nom: "", quantite: "1", poids: "", categorie: "", personnalise: false, montant: "", devise: "GNF", typePrix: "unitaire" }; }

function splitNom(full) {
  const parts = (full || "").trim().split(" ");
  if (parts.length <= 1) return { prenom: parts[0] || "", nom: "" };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

function ColisForm({ onClose, onSave, existingColis, categories, session, sites }) {
  const availableCountries = allowedCountries(session);
  const clientDirectory = useMemo(() => buildClientDirectory(existingColis || []), [existingColis]);
  const [step, setStep] = useState(0);
  const [expPrenom, setExpPrenom] = useState("");
  const [expNom, setExpNom] = useState("");
  const [expTelephone, setExpTelephone] = useState("");
  const [expEmail, setExpEmail] = useState("");
  const [expAdresse, setExpAdresse] = useState("");
  const [expPays, setExpPays] = useState("GN");
  const [expClientTrouve, setExpClientTrouve] = useState(null);
  const [destPrenom, setDestPrenom] = useState("");
  const [destNom, setDestNom] = useState("");
  const [destTelephone, setDestTelephone] = useState("");
  const [destEmail, setDestEmail] = useState("");
  const [destAdresse, setDestAdresse] = useState("");
  const [destVille, setDestVille] = useState("");
  const [destCodePostal, setDestCodePostal] = useState("");
  const [destPays, setDestPays] = useState(availableCountries.find((c) => c.code !== "GN")?.code || "FR");
  const [destClientTrouve, setDestClientTrouve] = useState(null);
  const [mode, setMode] = useState("air");
  const [produits, setProduits] = useState([emptyProduit()]);
  const [paye, setPaye] = useState("");
  const [rabaisMontant, setRabaisMontant] = useState("0");
  const [rabaisDevise, setRabaisDevise] = useState("GNF");
  const [agence, setAgence] = useState(sites?.[0]?.nom || "Bambeto");

  function chercherClient(tel, cote) {
    const clean = (tel || "").replace(/\s/g, "");
    if (clean.length < 6) { cote === "exp" ? setExpClientTrouve(null) : setDestClientTrouve(null); return; }
    const match = clientDirectory.find((c) => c.telephone.replace(/\s/g, "") === clean);
    if (!match) { cote === "exp" ? setExpClientTrouve(null) : setDestClientTrouve(null); return; }
    const { prenom, nom } = splitNom(match.nomComplet);
    if (cote === "exp") {
      setExpPrenom(prenom); setExpNom(nom); setExpEmail(match.email); setExpAdresse(match.adresse);
      if (match.pays && COUNTRIES.some((c) => c.code === match.pays)) setExpPays(match.pays);
      setExpClientTrouve(match);
    } else {
      setDestPrenom(prenom); setDestNom(nom); setDestEmail(match.email); setDestAdresse(match.adresse);
      setDestVille(match.ville || ""); setDestCodePostal(match.codePostal || "");
      if (match.pays && COUNTRIES.some((c) => c.code === match.pays)) setDestPays(match.pays);
      setDestClientTrouve(match);
    }
  }
  const [photos, setPhotos] = useState([]);
  const [err, setErr] = useState("");

  // one side is expected to be Guinée (home base); the other determines the applicable rate table
  const direction = destPays === "GN" ? "import" : "export";
  const pays = destPays === "GN" ? expPays : destPays;
  const dest = COUNTRIES.find((c) => c.code === pays) || COUNTRIES.find((c) => c.code === "FR");
  const expCountry = COUNTRIES.find((c) => c.code === expPays);
  const destCountry = COUNTRIES.find((c) => c.code === destPays);
  const poidsTotal = produits.reduce((s, p) => s + (Number(p.poids) || 0), 0);
  const valeurDeclaree = produits.reduce((s, p) => s + produitValeurGNF(p, categories), 0);
  // Le montant facturé provient directement de la somme des valeurs produits
  // (tarif de catégorie × poids/quantité, ou prix personnalisé) — pas d'un tarif générique par pays.
  const prixBrut = +(valeurDeclaree / (LIVE_RATES.GNF || CURRENCIES.GNF)).toFixed(2);
  const telephone = destTelephone;
  const previousCount = telephone ? (existingColis || []).filter((c) => c.telephone === telephone.trim()).length : 0;
  const discountLoyalty = loyaltyDiscount(previousCount);
  const prixApresFidelite = +(prixBrut * (1 - discountLoyalty / 100)).toFixed(2);
  const rabaisEUR = +((Number(rabaisMontant) || 0) / (LIVE_RATES[rabaisDevise] || CURRENCIES[rabaisDevise] || 1)).toFixed(2);
  const prix = Math.max(+(prixApresFidelite - rabaisEUR).toFixed(2), 0);
  const payeNum = Number(paye) || 0;
  const reste = Math.max(prix - payeNum, 0);
  const destCurrency = dest?.currency || "EUR";

  function updateProduit(id, patch) { setProduits((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p))); }
  function addProduit() { setProduits((list) => [...list, emptyProduit()]); }
  function removeProduit(id) { setProduits((list) => (list.length > 1 ? list.filter((p) => p.id !== id) : list)); }

  function addPhotos(e) {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement("canvas");
          const scale = Math.min(1, 500 / img.width);
          c.width = img.width * scale; c.height = img.height * scale;
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          setPhotos((p) => [...p, c.toDataURL("image/jpeg", 0.6)]);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }
  function removePhoto(i) { setPhotos((p) => p.filter((_, idx) => idx !== i)); }

  function next() {
    setErr("");
    if (step === 0 && expPays === destPays) { setErr("Le pays expéditeur et le pays destinataire doivent être différents."); return; }
    if (step === 1 && (!expPrenom || !expNom || !expTelephone)) { setErr("Merci de renseigner le prénom, le nom et le téléphone de l'expéditeur."); return; }
    if (step === 2 && (!destPrenom || !destNom || !destTelephone)) { setErr("Merci de renseigner le prénom, le nom et le téléphone du destinataire."); return; }
    if (step === 3 && produits.some((p) => !p.nom || !p.poids)) { setErr("Merci de renseigner au moins le nom et le poids de chaque produit."); return; }
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }
  function prev() { setErr(""); setStep((s) => Math.max(s - 1, 0)); }

  function submit(e) {
    e.preventDefault();
    if (!expNom || !destNom || !destTelephone) return;
    onSave({
      tracking: genTracking(),
      expediteur: `${expPrenom} ${expNom}`.trim(), expediteurTelephone: expTelephone, expediteurEmail: expEmail, expediteurAdresse: expAdresse, expediteurPays: expPays,
      destinataire: `${destPrenom} ${destNom}`.trim(), telephone: destTelephone, destinataireEmail: destEmail, destinataireAdresse: destAdresse, destinataireVille: destVille, destinataireCodePostal: destCodePostal, destinatairePays: destPays,
      pays, direction, mode, produits, poids: +poidsTotal.toFixed(2), volume: 0, valeurDeclaree, site: agence,
      prixBrut, discountLoyalty, rabaisMontant: Number(rabaisMontant) || 0, rabaisDevise, rabaisEUR, prix, paye: payeNum, reste, photos,
      paiements: payeNum > 0 ? [{ id: `pay${Date.now()}`, montant: payeNum, mode: "Espèces", date: new Date().toISOString(), par: "Enregistrement initial" }] : [],
      notesInternes: "",
      status: "Enregistré", historique: [{ status: "Enregistré", date: new Date().toISOString() }],
      createdAt: new Date().toISOString(), pod: null, signature: null, driverLoc: null,
    });
  }

  return (
    <Modal onClose={onClose} title="Nouveau Colis" wide>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>📍 Envoi de {expCountry?.name.toUpperCase()} {FLAGS[expPays]} vers {destCountry?.name.toUpperCase()} {FLAGS[destPays]}</div>
      <StepIndicator step={step} />
      <div>
        {step === 0 && (
          <div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 16 }}>Choisissez le pays d'expédition et le pays de destination — les tarifs et la devise seront calculés automatiquement.</div>
            {availableCountries.length < COUNTRIES.length && (
              <div style={{ fontSize: 11.5, color: "#E0A63A", marginBottom: 12 }}>Votre compte est limité à certaines destinations par votre administrateur.</div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "end" }}>
              <Field label="Pays expéditeur *">
                <select value={expPays} onChange={(e) => setExpPays(e.target.value)} style={inputStyle}>
                  {availableCountries.map((c) => <option key={c.code} value={c.code}>{FLAGS[c.code]} {c.name} ({c.city})</option>)}
                </select>
              </Field>
              <div style={{ paddingBottom: 10 }}><ChevronRight size={18} color="var(--muted)" /></div>
              <Field label="Pays destinataire *">
                <select value={destPays} onChange={(e) => setDestPays(e.target.value)} style={inputStyle}>
                  {availableCountries.map((c) => <option key={c.code} value={c.code}>{FLAGS[c.code]} {c.name} ({c.city})</option>)}
                </select>
              </Field>
            </div>
            <div style={{ marginTop: 16, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
              {FLAGS[expPays]} {expCountry?.city} <ChevronRight size={16} color="#E23F52" /> {FLAGS[destPays]} {destCountry?.city}
            </div>
          </div>
        )}
        {step === 1 && (
          <div>
            <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{FLAGS[expPays]}</span>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Expéditeur • {expCountry?.name.toUpperCase()}</div><div style={{ fontSize: 11.5, color: "var(--muted)" }}>Personne qui envoie le colis</div></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Téléphone * — tapez le numéro d'un client existant pour un remplissage automatique">
                  <input value={expTelephone} onChange={(e) => setExpTelephone(e.target.value)} onBlur={(e) => chercherClient(e.target.value, "exp")} style={inputStyle} placeholder="+224 ### ###" />
                </Field>
                {expClientTrouve && <div style={{ fontSize: 11.5, color: "#3ECB84", marginTop: -8, marginBottom: 12 }}>✓ Client reconnu — informations reprises de son dernier colis du {new Date(expClientTrouve.date).toLocaleDateString("fr-FR")}</div>}
              </div>
              <Field label="Prénom *"><input value={expPrenom} onChange={(e) => setExpPrenom(e.target.value)} style={inputStyle} placeholder="Prénom de l'expéditeur" autoFocus /></Field>
              <Field label="Nom *"><input value={expNom} onChange={(e) => setExpNom(e.target.value)} style={inputStyle} placeholder="Nom de l'expéditeur" /></Field>
              <Field label="Email (optionnel)"><input value={expEmail} onChange={(e) => setExpEmail(e.target.value)} style={inputStyle} placeholder="email@exemple.com" /></Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Adresse"><input value={expAdresse} onChange={(e) => setExpAdresse(e.target.value)} style={inputStyle} placeholder="Adresse complète de l'expéditeur" /></Field>
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <div style={{ background: "#12261D", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{FLAGS[destPays]}</span>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Destinataire • {destCountry?.name.toUpperCase()}</div><div style={{ fontSize: 11.5, color: "var(--muted)" }}>Personne qui recevra le colis</div></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Téléphone * — tapez le numéro d'un client existant pour un remplissage automatique">
                  <input value={destTelephone} onChange={(e) => setDestTelephone(e.target.value)} onBlur={(e) => chercherClient(e.target.value, "dest")} style={inputStyle} placeholder="Numéro WhatsApp" />
                </Field>
                {destClientTrouve && <div style={{ fontSize: 11.5, color: "#3ECB84", marginTop: -8, marginBottom: 12 }}>✓ Client reconnu — informations reprises de son dernier colis du {new Date(destClientTrouve.date).toLocaleDateString("fr-FR")}</div>}
              </div>
              <Field label="Prénom *"><input value={destPrenom} onChange={(e) => setDestPrenom(e.target.value)} style={inputStyle} placeholder="Prénom du destinataire" autoFocus /></Field>
              <Field label="Nom *"><input value={destNom} onChange={(e) => setDestNom(e.target.value)} style={inputStyle} placeholder="Nom du destinataire" /></Field>
              <Field label="Email (optionnel)"><input value={destEmail} onChange={(e) => setDestEmail(e.target.value)} style={inputStyle} placeholder="email@exemple.com" /></Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Adresse *"><input value={destAdresse} onChange={(e) => setDestAdresse(e.target.value)} style={inputStyle} placeholder="Adresse complète (rue, quartier, repère...)" /></Field>
              </div>
              <Field label="Ville"><input value={destVille} onChange={(e) => setDestVille(e.target.value)} style={inputStyle} placeholder="Paris" /></Field>
              <Field label="Code postal"><input value={destCodePostal} onChange={(e) => setDestCodePostal(e.target.value)} style={inputStyle} placeholder="75001" /></Field>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <div style={{ background: "#2B2313", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <Package size={18} color="#E0A63A" />
              <div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Contenu du colis</div><div style={{ fontSize: 11.5, color: "var(--muted)" }}>Détaillez chaque produit dans le colis</div></div>
            </div>
            {produits.map((p, idx) => (
              <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{idx + 1}. Produit</div>
                  {produits.length > 1 && <button type="button" onClick={() => removeProduit(p.id)} style={{ background: "none", border: "none", color: "#E23F52", cursor: "pointer" }}><Trash2 size={14} /></button>}
                </div>
                <Field label="Nom du produit *"><input value={p.nom} onChange={(e) => updateProduit(p.id, { nom: e.target.value })} style={inputStyle} placeholder="Rechercher ou saisir un produit..." /></Field>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                  <Field label="Quantité *"><input value={p.quantite} onChange={(e) => updateProduit(p.id, { quantite: e.target.value })} style={inputStyle} /></Field>
                  <Field label="Poids du colis (kg) *"><input value={p.poids} onChange={(e) => updateProduit(p.id, { poids: e.target.value })} style={inputStyle} /></Field>
                </div>
                <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: -8, marginBottom: 12 }}>Le poids est indépendant de la quantité — il représente le poids réel du colis, jamais multiplié.</div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12 }}>
                  <input type="checkbox" checked={p.personnalise} onChange={(e) => {
                    const patch = { personnalise: e.target.checked };
                    if (e.target.checked) { patch.prixModifiePar = `${session?.prenom || ""} ${session?.nom || ""}`.trim(); patch.prixModifieLe = new Date().toISOString(); }
                    updateProduit(p.id, patch);
                  }} />
                  <span style={{ fontSize: 12.5, color: "var(--text)", fontWeight: 600 }}>Utiliser un prix personnalisé</span>
                </label>

                {p.personnalise ? (
                  <div>
                    <div style={{ background: "#2B2313", color: "#E0A63A", borderRadius: 8, padding: "8px 12px", fontSize: 11.5, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertTriangle size={13} /> Prix personnalisé actif — le tarif de catégorie n'est pas utilisé pour ce produit.
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 10 }}>
                      <Field label="Montant *"><input value={p.montant} onChange={(e) => updateProduit(p.id, { montant: e.target.value, prixModifiePar: `${session?.prenom || ""} ${session?.nom || ""}`.trim(), prixModifieLe: new Date().toISOString() })} style={inputStyle} /></Field>
                      <Field label="Devise"><select value={p.devise} onChange={(e) => updateProduit(p.id, { devise: e.target.value })} style={inputStyle}>{["GNF", "EUR", "USD"].map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
                    </div>
                    <Field label="Type de prix">
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => updateProduit(p.id, { typePrix: "unitaire" })} style={{ ...toggleBtn, ...(p.typePrix === "unitaire" ? toggleActive : {}) }}>Unitaire (× quantité)</button>
                        <button type="button" onClick={() => updateProduit(p.id, { typePrix: "total" })} style={{ ...toggleBtn, ...(p.typePrix === "total" ? toggleActive : {}) }}>Total (fixe)</button>
                      </div>
                    </Field>
                    {p.prixModifiePar && <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 6 }}>Modifié par {p.prixModifiePar} le {new Date(p.prixModifieLe).toLocaleString("fr-FR")}</div>}
                  </div>
                ) : (
                  <Field label="Catégorie">
                    <select value={p.categorie} onChange={(e) => updateProduit(p.id, { categorie: e.target.value })} style={inputStyle}>
                      <option value="">-- Sélectionner une catégorie --</option>
                      {(categories || []).filter((c) => c.visibiliteColis !== false && (!c.paysLimite || c.paysLimite === pays)).map((c) => <option key={c.id} value={c.nom}>{c.emoji} {c.nom} ({fmtGNF(catPriceGNF(c))}{c.type === "kg" ? "/kg" : "/unité"})</option>)}
                    </select>
                  </Field>
                )}

                {(() => {
                  const val = produitValeurGNF(p, categories);
                  if (!val) return null;
                  return (
                    <div style={{ fontSize: 11.5, color: "#3ECB84", marginTop: 8 }}>
                      Valeur {p.personnalise ? "saisie" : "suggérée"} : {fmtGNF(val)} ≈ {fmt(val / (LIVE_RATES.GNF || 9500), destCurrency)}
                    </div>
                  );
                })()}
              </div>
            ))}
            <button type="button" onClick={addProduit} style={{ width: "100%", border: "1.5px dashed var(--border)", borderRadius: 10, padding: "12px 0", background: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer", marginBottom: 14 }}>+ Ajouter un produit</button>
            <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13, color: "var(--text)" }}>Poids total : <strong>{poidsTotal.toFixed(1)} kg</strong></div>
              <div style={{ fontSize: 13, color: "var(--text)" }}>Valeur déclarée : <strong>{fmtGNF(valeurDeclaree)}</strong></div>
            </div>
          </div>
        )}
        {step === 4 && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 14 }}>
              <Field label="Route (déterminée par expéditeur/destinataire)">
                <div style={{ ...inputStyle, display: "flex", alignItems: "center", background: "var(--surface2)", color: "var(--text)", fontWeight: 600 }}>
                  {FLAGS[expPays]} {expCountry?.city} <ChevronRight size={13} style={{ margin: "0 4px" }} /> {FLAGS[destPays]} {destCountry?.city}
                </div>
              </Field>
              <Field label="Mode de transport">
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setMode("air")} style={{ ...toggleBtn, ...(mode === "air" ? toggleActive : {}) }}><Plane size={14} /> Aérien</button>
                  <button type="button" disabled title="Voie maritime temporairement indisponible" style={{ ...toggleBtn, opacity: 0.4, cursor: "not-allowed" }}><Ship size={14} /> Maritime</button>
                </div>
              </Field>
              <Field label="Montant du rabais"><input value={rabaisMontant} onChange={(e) => setRabaisMontant(e.target.value)} style={inputStyle} placeholder="0" /></Field>
              <Field label="Devise du rabais">
                <select value={rabaisDevise} onChange={(e) => setRabaisDevise(e.target.value)} style={inputStyle}>
                  {[...new Set(["GNF", "EUR", expCountry?.currency, destCountry?.currency].filter(Boolean))].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Agence d'enregistrement">
                <select value={agence} onChange={(e) => setAgence(e.target.value)} style={inputStyle}>
                  {(sites && sites.length > 0 ? sites : [{ id: "x", nom: "Bambeto" }]).map((s) => <option key={s.id} value={s.nom}>{s.nom}</option>)}
                </select>
              </Field>
              <Field label="Montant payé à l'enregistrement (EUR)"><input value={paye} onChange={(e) => setPaye(e.target.value)} style={inputStyle} placeholder="0" /></Field>
            </div>
            {discountLoyalty > 0 && <div style={{ fontSize: 12, color: "#3ECB84", marginBottom: 10 }}>Remise fidélité automatique : -{discountLoyalty}% ({previousCount} envois précédents)</div>}
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 10 }}>FRAIS D'EXPÉDITION</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text)", marginBottom: 6 }}><span>Valeur des produits ({poidsTotal.toFixed(1)} kg · {mode === "air" ? "Aérien" : "Maritime"})</span><span>{fmt(prixBrut, "GNF")}</span></div>
              {discountLoyalty > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#3ECB84", marginBottom: 6 }}><span>Remise fidélité (-{discountLoyalty}%)</span><span>-{fmt(prixBrut - prixApresFidelite, "GNF")}</span></div>}
              {rabaisEUR > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#3ECB84", marginBottom: 6 }}><span>Rabais ({fmt(rabaisEUR, rabaisDevise)})</span><span>-{fmt(rabaisEUR, "GNF")}</span></div>}
              <div style={{ borderTop: "1px solid var(--border)", margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "var(--text)" }}><span>Total à payer</span><span>{fmt(prix, "GNF")}</span></div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", textAlign: "right" }}>≈ {fmt(prix, destCurrency)}</div>
            </div>
          </div>
        )}
        {step === 5 && (
          <div>
            <div style={{ background: "#12261D", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle2 size={18} color="#3ECB84" />
              <div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Résumé du colis</div><div style={{ fontSize: 11.5, color: "var(--muted)" }}>Vérifiez les informations avant création</div></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16, fontSize: 13, color: "var(--text)" }}>
              {FLAGS[expPays]} {expCountry?.name.toUpperCase()} <ChevronRight size={14} color="var(--muted)" /> {FLAGS[destPays]} {destCountry?.name.toUpperCase()}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>EXPÉDITEUR</div>
                <div style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 600 }}>{expPrenom} {expNom}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Tél : {expTelephone || "—"}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Adresse : {expAdresse || "—"}</div>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>DESTINATAIRE</div>
                <div style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 600 }}>{destPrenom} {destNom}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Tél : {destTelephone || "—"}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Adresse : {destAdresse || "—"}</div>
              </div>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>PRODUITS ({produits.length})</div>
              {produits.map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text)", marginBottom: 6 }}>
                  <span>x{p.quantite || 1} {p.nom || "Produit sans nom"}</span>
                  <span style={{ color: "var(--muted)" }}>{(Number(p.poids) || 0).toFixed(1)} kg · {fmtGNF(produitValeurGNF(p, categories))}{p.personnalise ? " (prix perso.)" : ""}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>FRAIS D'EXPÉDITION</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "var(--text)" }}><span>Total à payer</span><span>{fmt(prix, "GNF")}</span></div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", textAlign: "right", marginBottom: 6 }}>≈ {fmt(prix, destCurrency)}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: reste > 0 ? "#E23F52" : "#3ECB84" }}><span>Reste à payer</span><span>{fmt(reste, "EUR")}</span></div>
            </div>
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>PHOTOS (optionnel)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(80px,1fr))", gap: 10 }}>
                {photos.map((src, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={src} alt={`Photo ${i + 1}`} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, border: "1.5px solid var(--border)" }} />
                    <button type="button" onClick={() => removePhoto(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#E23F52", color: "#fff", border: "2px solid var(--surface)", cursor: "pointer", display: "grid", placeItems: "center" }}><X size={11} /></button>
                  </div>
                ))}
                <label style={{ height: 80, borderRadius: 8, border: "1.5px dashed var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: "var(--muted)", fontSize: 10.5, cursor: "pointer" }}>
                  <Camera size={16} /> Ajouter
                  <input type="file" accept="image/*" multiple onChange={addPhotos} style={{ display: "none" }} />
                </label>
              </div>
            </div>
          </div>
        )}

        {err && <div style={{ color: "#E23F52", fontSize: 12.5, marginTop: 12 }}>{err}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 22 }}>
          <button type="button" onClick={step === 0 ? onClose : prev} style={{ padding: "10px 18px", borderRadius: 9, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--muted)", fontSize: 13.5, cursor: "pointer" }}>
            {step === 0 ? "Annuler" : "Précédent"}
          </button>
          {step < WIZARD_STEPS.length - 1 ? (
            <button type="button" onClick={next} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 9, border: "none", background: "#3D63FF", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
              Suivant <ChevronRight size={15} />
            </button>
          ) : (
            <button type="button" onClick={submit} style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: "#E23F52", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
              Créer le colis
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

async function downloadRouteManifest(colisRoute, country, direction) {
  const jspdf = await loadJsPDF();
  const doc = new jspdf.jsPDF();
  const label = direction === "import" ? `${country.city} → Conakry` : `Conakry → ${country.city}`;
  doc.setFontSize(18); doc.setTextColor(10, 38, 71); doc.text("BA-DIABY EXPRESS", 14, 20);
  doc.setFontSize(10); doc.setTextColor(90, 100, 120); doc.text(`Bordereau d'envoi — Route ${label}`, 14, 27);
  doc.setFontSize(9); doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} · ${colisRoute.length} colis · Poids total : ${colisRoute.reduce((s, c) => s + c.poids, 0).toFixed(1)} kg`, 14, 33);
  doc.setDrawColor(200); doc.line(14, 37, 196, 37);

  const head = ["N° de suivi", "Destinataire", "Téléphone", "Mode", "Poids", "Statut", `Montant (${country.currency})`];
  const body = colisRoute.map((c) => [
    c.tracking, c.destinataire, c.telephone, c.mode === "air" ? "Aérien" : "Maritime",
    `${c.poids} kg`, c.status, fmt(c.prix, country.currency),
  ]);

  const hasAutoTable = await ensureAutoTable();
  let finalY = 42;
  if (hasAutoTable && doc.autoTable) {
    doc.autoTable({
      startY: 42, head: [head], body,
      headStyles: { fillColor: [10, 38, 71], fontSize: 8.5 },
      bodyStyles: { fontSize: 8.5, textColor: [30, 40, 55] },
      alternateRowStyles: { fillColor: [238, 243, 250] },
      margin: { left: 14, right: 14 },
    });
    finalY = doc.lastAutoTable.finalY || 50;
  } else {
    // manual fallback table if the autoTable plugin could not be loaded
    const colX = [14, 55, 90, 125, 148, 168, 185];
    doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.setFillColor(10, 38, 71);
    doc.rect(14, finalY, 182, 7, "F");
    head.forEach((h, i) => doc.text(h, colX[i] + 1, finalY + 5));
    finalY += 9;
    doc.setTextColor(30, 40, 55);
    body.forEach((row, i) => {
      if (finalY > 275) { doc.addPage(); finalY = 20; }
      if (i % 2 === 1) { doc.setFillColor(238, 243, 250); doc.rect(14, finalY - 4.5, 182, 6.5, "F"); }
      row.forEach((cell, j) => doc.text(String(cell).slice(0, 16), colX[j] + 1, finalY));
      finalY += 6.5;
    });
    finalY += 6;
  }

  const totalFacture = colisRoute.reduce((s, c) => s + c.prix, 0);
  const totalEncaisse = colisRoute.reduce((s, c) => s + c.paye, 0);
  const totalRestant = colisRoute.reduce((s, c) => s + c.reste, 0);
  doc.setFontSize(9); doc.setTextColor(10, 38, 71);
  doc.text(`Résumé paiements — Facturé : ${fmt(totalFacture, country.currency)}  ·  Encaissé : ${fmt(totalEncaisse, country.currency)}  ·  Reste à percevoir : ${fmt(totalRestant, country.currency)}`, 14, finalY + 8);

  doc.setFontSize(9); doc.setTextColor(90, 100, 120);
  doc.text("Signature de l'agent :", 14, finalY + 20);
  doc.text("Signature du transporteur :", 110, finalY + 20);
  openPdf(doc, `bordereau-${country.code}-${direction}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

async function downloadLabel(colis) {
  const jspdf = await loadJsPDF();
  const doc = new jspdf.jsPDF({ unit: "mm", format: "a6" }); // A6 standard = 105 x 148 mm
  const dest = COUNTRIES.find((c) => c.code === colis.pays);
  const qrData = await generateQRDataUrl(colis.tracking, 300);
  const paye = colis.reste <= 0;
  const W = 105, H = 148;
  const M = 5.5;

  const rule = (y) => { doc.setDrawColor(20, 20, 20); doc.setLineWidth(0.3); doc.line(0, y, W, y); };
  const rect = (x, y, w, h) => { doc.setDrawColor(20, 20, 20); doc.rect(x, y, w, h); };

  // Cadre extérieur
  doc.setDrawColor(20, 20, 20); doc.setLineWidth(0.6); doc.rect(0, 0, W, H);

  // En-tête : nom + mode de transport
  doc.setTextColor(20, 20, 20);
  doc.setFont(undefined, "bold"); doc.setFontSize(13);
  doc.text("BA-DIABY", M, 10);
  doc.text("EXPRESS", M, 16.5);
  doc.setFillColor(20, 20, 20); doc.roundedRect(69, 6, 30, 7.5, 3.75, 3.75, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(7.5); doc.setFont(undefined, "bold");
  doc.text(colis.mode === "air" ? "AÉRIEN" : "MARITIME", 84, 11, { align: "center" });
  rule(20);

  // Statut de paiement
  doc.setFillColor(...(paye ? [18, 38, 29] : [43, 22, 32]));
  doc.rect(0, 20, W, 7.5, "F");
  doc.setTextColor(...(paye ? [62, 203, 132] : [226, 63, 82]));
  doc.setFontSize(8.5); doc.setFont(undefined, "bold");
  doc.text(paye ? "✓ PAYÉ" : `✗ NON PAYÉ — reste ${fmt(colis.reste, "EUR")}`, M, 25.3);
  doc.setTextColor(20, 20, 20);
  rule(27.5);

  // Destinataire
  let y = 27.5;
  doc.setFontSize(7); doc.setFont(undefined, "bold"); doc.setTextColor(120, 120, 120);
  doc.text("DESTINATAIRE / TO", M, y + 5);
  doc.setTextColor(20, 20, 20); doc.setFontSize(11.5);
  const nomLines = doc.splitTextToSize(colis.destinataire.toUpperCase(), W - 2 * M);
  doc.text(nomLines, M, y + 11);
  y += 11 + nomLines.length * 4.8;
  doc.setFontSize(8.5); doc.setFont(undefined, "bold");
  doc.text(`${(dest?.name || "").toUpperCase()}   ${colis.telephone || ""}`, M, y);
  y += 5;
  doc.setFont(undefined, "normal"); doc.setFontSize(7.5); doc.setTextColor(80, 80, 80);
  if (colis.destinataireAdresse) {
    const addrLines = doc.splitTextToSize(colis.destinataireAdresse, W - 2 * M);
    doc.text(addrLines, M, y);
    y += addrLines.length * 3.8;
  }
  const villeCp = [colis.destinataireCodePostal, colis.destinataireVille].filter(Boolean).join(" ");
  if (villeCp) { doc.text(villeCp, M, y); y += 4; }
  if (colis.destinataireEmail) { doc.text(colis.destinataireEmail, M, y); y += 4; }
  y += 2.5;
  rule(y);

  // QR + code de suivi
  const qrTop = y + 4.5;
  doc.addImage(qrData, "PNG", M, qrTop, 27, 27);
  rect(M, qrTop, 27, 27);
  doc.setFontSize(7); doc.setFont(undefined, "bold"); doc.setTextColor(120, 120, 120);
  doc.text("CODE DE SUIVI", M + 32, qrTop + 7);
  doc.setTextColor(20, 20, 20); doc.setFontSize(13.5);
  doc.text(colis.tracking, M + 32, qrTop + 15);
  y = qrTop + 27 + 4.5;
  rule(y);

  // Code-barres (visuel, dérivé du tracking)
  const barTop = y + 4.5;
  let bx = M;
  for (let i = 0; i < colis.tracking.length * 3; i++) {
    const seed = colis.tracking.charCodeAt(i % colis.tracking.length) * (i + 1);
    const w = 0.35 + (seed % 3) * 0.3;
    if (seed % 4 !== 0) { doc.setFillColor(20, 20, 20); doc.rect(bx, barTop, w, 13, "F"); }
    bx += w + 0.35;
    if (bx > W - M) break;
  }
  doc.setFontSize(7.5); doc.setFont(undefined, "bold"); doc.setTextColor(20, 20, 20);
  doc.text(colis.tracking, W / 2, barTop + 17.5, { align: "center" });
  y = barTop + 21.5;
  rule(y);

  // Expéditeur
  doc.setFontSize(7); doc.setFont(undefined, "bold"); doc.setTextColor(120, 120, 120);
  doc.text("EXPÉDITEUR / FROM", M, y + 5);
  doc.setTextColor(20, 20, 20); doc.setFontSize(9.5);
  doc.text(colis.expediteur, M, y + 10.5);
  doc.setFontSize(8); doc.setFont(undefined, "normal");
  doc.text(colis.expediteurTelephone || "", W - M, y + 10.5, { align: "right" });
  y += 14;
  rule(y);

  // Poids / Articles / Date
  const articles = (colis.produits || []).reduce((s, p) => s + (Number(p.quantite) || 1), 0) || 1;
  const col = (x, w, label, value) => {
    doc.setFontSize(7); doc.setFont(undefined, "bold"); doc.setTextColor(120, 120, 120);
    doc.text(label, x + w / 2, y + 5, { align: "center" });
    doc.setFontSize(10); doc.setTextColor(20, 20, 20);
    doc.text(String(value), x + w / 2, y + 11, { align: "center" });
  };
  const colW = W / 3;
  col(0, colW, "POIDS", `${colis.poids} kg`);
  doc.setDrawColor(220); doc.line(colW, y, colW, y + 15); doc.line(colW * 2, y, colW * 2, y + 15);
  col(colW, colW, "ARTICLES", articles);
  col(colW * 2, colW, "DATE", new Date(colis.createdAt).toLocaleDateString("fr-FR"));
  y += 15;
  rule(y);

  // Référence / route
  doc.setFontSize(7); doc.setFont(undefined, "bold"); doc.setTextColor(120, 120, 120);
  doc.text("RÉF.", M, y + 5.5);
  doc.setTextColor(20, 20, 20); doc.setFontSize(9);
  doc.text(routeLabel(colis.pays, colis.direction).toUpperCase(), W - M, y + 5.5, { align: "right" });
  y += 8.5;
  rule(y);

  // Mentions légales (condensées pour tenir sur A6)
  doc.setFontSize(6.3); doc.setFont(undefined, "normal"); doc.setTextColor(90, 90, 90);
  const legal = [
    "Vérifier l'état du colis avant acceptation. Transport soumis aux CGV BA-DIABY EXPRESS.",
    "Support : contact@badiaby-express.com",
  ];
  let ly = y + 4.5;
  legal.forEach((l) => { const wrapped = doc.splitTextToSize(l, W - 2 * M); doc.text(wrapped, M, ly); ly += wrapped.length * 3.2; });

  rule(H - 8);
  doc.setFontSize(7); doc.setFont(undefined, "bold"); doc.setTextColor(20, 20, 20);
  doc.text("WWW.BA-DIABY-EXPRESS.COM", W / 2, H - 4, { align: "center" });

  openPdf(doc, `etiquette-${colis.tracking}.pdf`);
}

/** Reçu d'encaissement PDF pour un paiement précis — utile pour la comptabilité et le client. */
async function downloadRecu(colis, paiement) {
  const jspdf = await loadJsPDF();
  const doc = new jspdf.jsPDF({ unit: "mm", format: "a5" });
  doc.setFillColor(10, 38, 71); doc.rect(0, 0, 148, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont(undefined, "bold");
  doc.text("BA-DIABY EXPRESS", 10, 12);
  doc.setFontSize(9); doc.setFont(undefined, "normal"); doc.text("Reçu d'encaissement", 10, 18);

  doc.setTextColor(20, 20, 20);
  let y = 32;
  const line = (label, value) => { doc.setFontSize(9); doc.setTextColor(120, 120, 120); doc.text(label, 10, y); doc.setFontSize(11); doc.setTextColor(20, 20, 20); doc.text(String(value), 10, y + 6); y += 14; };
  line("Colis", `${colis.tracking} — ${colis.destinataire}`);
  line("Montant reçu", paiement.deviseSaisie ? fmt(paiement.montant, paiement.deviseSaisie) : fmt(paiement.montant, "EUR"));
  line("Mode de paiement", paiement.mode);
  if (paiement.reference) line("Référence de transaction", paiement.reference);
  if (paiement.numeroPayeur) line("Numéro du payeur", paiement.numeroPayeur);
  if (paiement.numeroReceveur) line("Numéro receveur (agence)", paiement.numeroReceveur);
  line("Date et heure", new Date(paiement.date).toLocaleString("fr-FR"));
  line("Encaissé par", paiement.par || "—");
  line("Reste à payer après ce paiement", fmt(colis.reste, "EUR"));

  doc.setDrawColor(200); doc.line(10, y, 138, y);
  doc.setFontSize(8); doc.setTextColor(120, 120, 120);
  doc.text("Ce reçu fait foi d'encaissement pour la comptabilité de Ba-Diaby Express.", 10, y + 8);
  openPdf(doc, `recu-${colis.tracking}-${paiement.id}.pdf`);
}

/** Bon de sortie PDF — preuve de remise du colis à la personne qui l'a récupéré. */
async function downloadBonSortie(colis) {
  if (!colis.bonSortie) return;
  const jspdf = await loadJsPDF();
  const doc = new jspdf.jsPDF({ unit: "mm", format: "a5" });
  doc.setFillColor(10, 38, 71); doc.rect(0, 0, 148, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont(undefined, "bold");
  doc.text("BA-DIABY EXPRESS", 10, 12);
  doc.setFontSize(9); doc.setFont(undefined, "normal"); doc.text("Bon de sortie", 10, 18);

  doc.setTextColor(20, 20, 20);
  let y = 32;
  const line = (label, value) => { doc.setFontSize(9); doc.setTextColor(120, 120, 120); doc.text(label, 10, y); doc.setFontSize(11); doc.setTextColor(20, 20, 20); doc.text(String(value || "—"), 10, y + 6); y += 14; };
  line("Colis", `${colis.tracking}`);
  line("Destinataire prévu", colis.destinataire);
  line("Récupéré par", colis.bonSortie.nom);
  line("Numéro de téléphone", colis.bonSortie.telephone);
  line("Pièce d'identité", colis.bonSortie.piece);
  line("Date de remise", colis.bonSortie.date ? new Date(colis.bonSortie.date).toLocaleDateString("fr-FR") : "—");
  line("Enregistré par", colis.bonSortie.enregistrePar);

  y += 10;
  doc.setFontSize(9); doc.setTextColor(90, 90, 90);
  doc.text("Signature de la personne qui récupère :", 10, y);
  doc.line(10, y + 14, 90, y + 14);

  doc.setDrawColor(200); doc.line(10, 128, 138, 128);
  doc.setFontSize(7.5); doc.setTextColor(120, 120, 120);
  doc.text("Ce document atteste la remise du colis. À conserver avec les pièces comptables.", 10, 134);
  openPdf(doc, `bon-de-sortie-${colis.tracking}.pdf`);
}

async function downloadInvoice(colis) {
  const jspdf = await loadJsPDF();
  const doc = new jspdf.jsPDF();
  doc.setFontSize(18); doc.setTextColor(10, 38, 71); doc.text("BA-DIABY EXPRESS", 14, 20);
  doc.setFontSize(10); doc.setTextColor(90, 100, 120); doc.text("Facture / Bordereau d'expédition", 14, 27);
  doc.setDrawColor(200); doc.line(14, 32, 196, 32);
  doc.setFontSize(11); doc.setTextColor(10, 38, 71);
  const dest = COUNTRIES.find((c) => c.code === colis.pays);
  const destCur = dest?.currency || "EUR";
  const rows = [
    ["N° de suivi", colis.tracking],
    ["Expéditeur", colis.expediteur],
    ["Destinataire", colis.destinataire],
    ["Téléphone", colis.telephone],
    ["Route", routeLabel(colis.pays, colis.direction)],
    ["Mode", colis.mode === "air" ? "Aérien" : "Maritime"],
    ["Poids", `${colis.poids} kg`],
    ["Statut", colis.status],
    ...((colis.discountLoyalty > 0 || colis.rabaisMontant > 0) ? [["Remise appliquée", `${colis.discountLoyalty > 0 ? `fidélité -${colis.discountLoyalty}% ` : ""}${colis.rabaisMontant > 0 ? `rabais ${colis.rabaisMontant.toLocaleString("fr-FR")} ${colis.rabaisDevise}` : ""} (brut ${fmt(colis.prixBrut || colis.prix, "EUR")})`]] : []),
    ["Montant total (Guinée)", fmt(colis.prix, "GNF")],
    [`Montant total (${destCur})`, fmt(colis.prix, destCur)],
    ["Montant payé", fmt(colis.paye, "EUR")],
    ["Reste à payer", fmt(colis.reste, "EUR")],
    ["Date", new Date(colis.createdAt).toLocaleDateString("fr-FR")],
  ];
  let y = 42;
  rows.forEach(([k, v]) => { doc.setTextColor(90, 100, 120); doc.text(k, 14, y); doc.setTextColor(10, 38, 71); doc.text(String(v), 80, y); y += 8; });
  openPdf(doc, `${colis.tracking}.pdf`);
}

function EditColisForm({ colis, onClose, onSave }) {
  const [expediteur, setExpediteur] = useState(colis.expediteur);
  const [destinataire, setDestinataire] = useState(colis.destinataire);
  const [telephone, setTelephone] = useState(colis.telephone);
  const [pays, setPays] = useState(colis.pays);
  const [direction, setDirection] = useState(colis.direction || "export");
  const [mode, setMode] = useState(colis.mode);
  const [poids, setPoids] = useState(String(colis.poids));
  const [volume, setVolume] = useState(String(colis.volume || ""));
  const [paye, setPaye] = useState(String(colis.paye || ""));
  const [rabaisMontant, setRabaisMontant] = useState(String(colis.rabaisMontant || 0));
  const [rabaisDevise, setRabaisDevise] = useState(colis.rabaisDevise || "GNF");
  const prixBrut = calcPrice(pays, poids, volume, mode);
  const discountLoyalty = colis.discountLoyalty || 0;
  const prixApresFidelite = +(prixBrut * (1 - discountLoyalty / 100)).toFixed(2);
  const rabaisEUR = +((Number(rabaisMontant) || 0) / (LIVE_RATES[rabaisDevise] || CURRENCIES[rabaisDevise] || 1)).toFixed(2);
  const prix = Math.max(+(prixApresFidelite - rabaisEUR).toFixed(2), 0);
  const payeNum = Number(paye) || 0;
  const reste = Math.max(prix - payeNum, 0);

  function submit(e) {
    e.preventDefault();
    if (!expediteur || !destinataire || !telephone) return;
    onSave({
      expediteur, destinataire, telephone, pays, direction, mode,
      poids: Number(poids) || 0, volume: Number(volume) || 0,
      prixBrut, discountLoyalty, rabaisMontant: Number(rabaisMontant) || 0, rabaisDevise, rabaisEUR, prix, paye: payeNum, reste,
    });
  }

  return (
    <Modal onClose={onClose} title={`Modifier le colis ${colis.tracking}`} wide>
      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <Field label="Expéditeur"><input value={expediteur} onChange={(e) => setExpediteur(e.target.value)} style={inputStyle} /></Field>
        <Field label="Destinataire"><input value={destinataire} onChange={(e) => setDestinataire(e.target.value)} style={inputStyle} /></Field>
        <Field label="Téléphone (WhatsApp)"><input value={telephone} onChange={(e) => setTelephone(e.target.value)} style={inputStyle} /></Field>
        <Field label="Destination"><select value={pays} onChange={(e) => setPays(e.target.value)} style={inputStyle}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name} — {c.city}</option>)}</select></Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Sens de la route">
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setDirection("export")} style={{ ...toggleBtn, ...(direction === "export" ? toggleActive : {}) }}>Conakry → {COUNTRIES.find(c=>c.code===pays)?.city}</button>
              <button type="button" onClick={() => setDirection("import")} style={{ ...toggleBtn, ...(direction === "import" ? toggleActive : {}) }}>{COUNTRIES.find(c=>c.code===pays)?.city} → Conakry</button>
            </div>
          </Field>
        </div>
        <Field label="Poids (kg)"><input value={poids} onChange={(e) => setPoids(e.target.value)} style={inputStyle} /></Field>
        <Field label="Volume (m³, optionnel)"><input value={volume} onChange={(e) => setVolume(e.target.value)} style={inputStyle} /></Field>
        <Field label="Mode de transport">
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setMode("air")} style={{ ...toggleBtn, ...(mode === "air" ? toggleActive : {}) }}><Plane size={14} /> Aérien</button>
            <button type="button" disabled title="Voie maritime temporairement indisponible" style={{ ...toggleBtn, opacity: 0.4, cursor: "not-allowed" }}><Ship size={14} /> Maritime</button>
          </div>
        </Field>
        <Field label="Montant du rabais"><input value={rabaisMontant} onChange={(e) => setRabaisMontant(e.target.value)} style={inputStyle} /></Field>
        <Field label="Devise du rabais">
          <select value={rabaisDevise} onChange={(e) => setRabaisDevise(e.target.value)} style={inputStyle}>
            {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Montant payé (EUR)"><input value={paye} onChange={(e) => setPaye(e.target.value)} style={inputStyle} /></Field>
        <div style={{ gridColumn: "1 / -1", background: "var(--surface2)", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, color: "var(--text)" }}>Total recalculé : <strong>{fmt(prix, "EUR")}</strong></div>
          <div style={{ fontSize: 13, color: reste > 0 ? "#E23F52" : "#3ECB84" }}>Reste à payer : <strong>{fmt(reste, "EUR")}</strong></div>
        </div>
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
          <button type="button" onClick={onClose} style={{ padding: "10px 18px", borderRadius: 9, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--muted)", fontSize: 13.5, cursor: "pointer" }}>Annuler</button>
          <button type="submit" style={{ padding: "10px 18px", borderRadius: 9, border: "none", background: "#E23F52", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Enregistrer les modifications</button>
        </div>
      </form>
    </Modal>
  );
}

function ColisDetail({ colis, onClose, onAdvance, onDelete, onCancel, onUpdate, onEncaisser, canManage, isAdmin, isChauffeur, data, session }) {
  const [cancelling, setCancelling] = useState(false);
  const [motif, setMotif] = useState("");
  const [editing, setEditing] = useState(false);
  const [payerOuvert, setPayerOuvert] = useState(false);
  const [montantPaye, setMontantPaye] = useState(String(colis.reste || ""));
  const [devisePaiement, setDevisePaiement] = useState("EUR");
  const [modePaiement, setModePaiement] = useState("Espèces");
  const [referenceTransaction, setReferenceTransaction] = useState("");
  const [numeroPayeur, setNumeroPayeur] = useState(colis.telephone || "");
  const [numeroReceveur, setNumeroReceveur] = useState("");
  const [recuState, setRecuState] = useState("idle");
  const [bonSortieOuvert, setBonSortieOuvert] = useState(false);
  const [recupNom, setRecupNom] = useState(colis.destinataire || "");
  const [recupTel, setRecupTel] = useState(colis.telephone || "");
  const [recupPiece, setRecupPiece] = useState("");
  const [recupDate, setRecupDate] = useState(new Date().toISOString().slice(0, 10));
  const [bonSortieState, setBonSortieState] = useState("idle");
  const isLast = STATUSES.indexOf(colis.status) === STATUSES.length - 1;
  const [loc, setLoc] = useState(colis.driverLoc);
  const sigRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [labelState, setLabelState] = useState("idle");
  const [invoiceState, setInvoiceState] = useState("idle");

  async function handleDownloadLabel() {
    setLabelState("loading");
    try { await downloadLabel(colis); setLabelState("idle"); }
    catch (e) { console.error(e); setLabelState("error"); }
  }
  async function handleDownloadInvoice() {
    setInvoiceState("loading");
    try { await downloadInvoice(colis); setInvoiceState("idle"); }
    catch (e) { console.error(e); setInvoiceState("error"); }
  }
  async function handleDownloadRecu(paiement) {
    setRecuState(paiement.id);
    try { await downloadRecu(colis, paiement); setRecuState("idle"); }
    catch (e) { console.error(e); setRecuState("error"); }
  }
  function validerEncaissement() {
    const n = Number(String(montantPaye).replace(",", "."));
    if (isNaN(n) || n <= 0) return;
    // convertit le montant saisi (dans devisePaiement) vers l'équivalent EUR, notre unité de référence interne
    const montantEUR = +(n / (LIVE_RATES[devisePaiement] || CURRENCIES[devisePaiement] || 1)).toFixed(2);
    onEncaisser(montantEUR, modePaiement, n, devisePaiement, { reference: referenceTransaction, numeroPayeur, numeroReceveur });
    setPayerOuvert(false);
    setMontantPaye(""); setReferenceTransaction("");
  }
  function validerBonSortie() {
    if (!recupNom.trim() || !recupTel.trim()) return;
    onUpdate({ bonSortie: { nom: recupNom, telephone: recupTel, piece: recupPiece, date: recupDate, enregistrePar: `${session?.prenom || ""} ${session?.nom || ""}`.trim(), creeLe: new Date().toISOString() } });
    setBonSortieOuvert(false);
  }
  async function telechargerBonSortie() {
    setBonSortieState("loading");
    try { await downloadBonSortie(colis); setBonSortieState("idle"); }
    catch (e) { console.error(e); setBonSortieState("error"); }
  }

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const l = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLoc(l); onUpdate({ driverLoc: l });
    }, () => {});
  }
  function startDraw(e) { setDrawing(true); draw(e); }
  function draw(e) {
    if (!drawing && e.type !== "mousedown" && e.type !== "touchstart") return;
    const canvas = sigRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0A2647"; ctx.beginPath(); ctx.arc(x, y, 1.5, 0, 7); ctx.fill();
  }
  function endDraw() {
    setDrawing(false);
    const canvas = sigRef.current;
    if (canvas) onUpdate({ signature: canvas.toDataURL() });
  }
  function capturePhoto(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const scale = Math.min(1, 500 / img.width);
        c.width = img.width * scale; c.height = img.height * scale;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        onUpdate({ pod: c.toDataURL("image/jpeg", 0.6) });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  const destCurrency = COUNTRIES.find((c) => c.code === colis.pays)?.currency || "EUR";
  const expCurrency = COUNTRIES.find((c) => c.code === (colis.expediteurPays || "GN"))?.currency || "GNF";
  const destCliCurrency = COUNTRIES.find((c) => c.code === (colis.destinatairePays || colis.pays))?.currency || destCurrency;
  const devisesAffichees = [...new Set(["GNF", expCurrency, destCliCurrency])];
  const statutPaiement = colis.reste <= 0 ? "Payé" : colis.paye > 0 ? "Partiellement payé" : "Non payé";
  const statutColor = colis.reste <= 0 ? "#3ECB84" : colis.paye > 0 ? "#E0A63A" : "#E23F52";

  return (
    <Modal onClose={onClose} title="Détail du colis" wide>
      <div style={{ background: "#0A2647", borderRadius: 14, padding: "20px 22px", color: "#fff", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div><div style={{ fontSize: 11, color: "var(--muted)" }}>N° DE SUIVI</div><div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700 }}>{colis.tracking}</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "var(--muted)" }}>ROUTE</div><div style={{ fontSize: 15, fontWeight: 700 }}>{routeLabel(colis.pays, colis.direction)}</div></div>
        </div>
        <div style={{ borderTop: "1.5px dashed rgba(255,255,255,0.3)", margin: "16px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
          <QRCodeImg value={colis.tracking} size={70} />
          <Barcode value={colis.tracking} />
          <span style={{ fontSize: 10.5, color: "var(--muted)" }}>{colis.mode === "air" ? "AÉRIEN" : "MARITIME"}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 18 }}>
        <Info label="Expéditeur" value={colis.expediteur} /><Info label="Destinataire" value={colis.destinataire} />
        <Info label="Téléphone" value={colis.telephone} /><Info label="Poids / Volume" value={`${colis.poids} kg${colis.volume ? ` · ${colis.volume} m³` : ""}`} />
        <Info label={`Montant total (Guinée)`} value={fmt(colis.prix, "GNF")} /><Info label={`Montant total (${destCurrency})`} value={fmt(colis.prix, destCurrency)} />
        {(colis.discountLoyalty > 0 || colis.rabaisMontant > 0) && <Info label="Remise appliquée" value={`${colis.discountLoyalty > 0 ? `fidélité -${colis.discountLoyalty}%` : ""}${colis.discountLoyalty > 0 && colis.rabaisMontant > 0 ? " + " : ""}${colis.rabaisMontant > 0 ? `rabais ${colis.rabaisMontant.toLocaleString("fr-FR")} ${colis.rabaisDevise}` : ""} (prix brut ${fmt(colis.prixBrut || colis.prix, "EUR")})`} />}
      </div>

      <div style={{ background: "var(--surface)", border: `1.5px solid ${statutColor}`, borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Paiements</div>
          <span style={{ background: statutColor, color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{statutPaiement}</span>
        </div>
        {colis.reste > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>RESTE À PAYER — TOUJOURS RECALCULÉ SELON LE TAUX DU JOUR</div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {devisesAffichees.map((cur) => (
                <div key={cur} style={{ fontSize: 18, fontWeight: 700, color: statutColor, fontFamily: "'Space Grotesk',sans-serif" }}>{fmt(colis.reste, cur)}</div>
              ))}
            </div>
          </div>
        )}
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Payé : {fmt(colis.paye, "EUR")} sur {fmt(colis.prix, "EUR")}</div>

        {colis.reste > 0 && effectivePermission(session, "colis.enregistrer_paiement") && (
          payerOuvert ? (
            <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 6 }}>
                <Field label="Montant reçu">
                  <input value={montantPaye} onChange={(e) => setMontantPaye(e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Devise du paiement">
                  <select value={devisePaiement} onChange={(e) => { setDevisePaiement(e.target.value); setMontantPaye(String(fmtRaw(colis.reste, e.target.value))); }} style={inputStyle}>
                    {devisesAffichees.map((cur) => <option key={cur} value={cur}>{cur}</option>)}
                  </select>
                </Field>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 10 }}>
                Reste à payer dans cette devise : {fmt(colis.reste, devisePaiement)} — équivalent au taux du jour.
              </div>
              <Field label="Mode de paiement">
                <select value={modePaiement} onChange={(e) => {
                  setModePaiement(e.target.value);
                  const cfg = data?.paymentConfig || {};
                  if (e.target.value === "Orange Money") setNumeroReceveur(cfg.orangeMoney || "");
                  else if (e.target.value === "MTN Money") setNumeroReceveur(cfg.mtnMoney || "");
                  else setNumeroReceveur("");
                }} style={inputStyle}>
                  {["Espèces", "Orange Money", "MTN Money", "Carte bancaire", "Virement"].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              {(modePaiement === "Orange Money" || modePaiement === "MTN Money" || modePaiement === "Virement") && (
                <div style={{ background: "var(--surface)", borderRadius: 8, padding: 12, marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>DÉTAILS DE LA TRANSACTION (optionnel mais recommandé)</div>
                  <Field label="Référence de la transaction"><input value={referenceTransaction} onChange={(e) => setReferenceTransaction(e.target.value)} style={inputStyle} placeholder="ex: MP240726.1234.A56789" /></Field>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                    <Field label="Numéro qui a payé"><input value={numeroPayeur} onChange={(e) => setNumeroPayeur(e.target.value)} style={inputStyle} /></Field>
                    <Field label="Numéro qui a reçu"><input value={numeroReceveur} onChange={(e) => setNumeroReceveur(e.target.value)} style={inputStyle} /></Field>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button onClick={() => setPayerOuvert(false)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12.5, cursor: "pointer" }}>Annuler</button>
                <button onClick={validerEncaissement} style={{ background: "#3ECB84", color: "#0A2647", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Valider l'encaissement</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setDevisePaiement("EUR"); setMontantPaye(String(colis.reste)); setPayerOuvert(true); }} style={{ width: "100%", background: "#3ECB84", color: "#0A2647", border: "none", borderRadius: 9, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Encaisser</button>
          )
        )}

        {colis.paiements && colis.paiements.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>HISTORIQUE DES PAIEMENTS</div>
            {colis.paiements.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: 12, color: "var(--text)", marginBottom: 8 }}>
                <div>
                  <div>{p.deviseSaisie ? fmt(p.montant, p.deviseSaisie) : fmt(p.montant, "EUR")}{p.deviseSaisie && p.deviseSaisie !== "EUR" ? ` (≈ ${fmt(p.montant, "EUR")})` : ""} · {p.mode}</div>
                  {p.reference && <div style={{ fontSize: 10.5, color: "var(--muted)" }}>Réf. {p.reference}{p.numeroPayeur ? ` · payeur ${p.numeroPayeur}` : ""}{p.numeroReceveur ? ` · reçu sur ${p.numeroReceveur}` : ""}</div>}
                  <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{new Date(p.date).toLocaleDateString("fr-FR")}{p.par ? ` · ${p.par}` : ""}</div>
                </div>
                <button onClick={() => handleDownloadRecu(p)} disabled={recuState === p.id} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--muted)", cursor: "pointer", fontSize: 10.5, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <Download size={11} /> {recuState === p.id ? "…" : "Reçu"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: colis.bonSortie ? 10 : 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Bon de sortie</div>
          {!colis.bonSortie && canManage && <button onClick={() => setBonSortieOuvert(true)} style={{ background: "#3D63FF", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Enregistrer la remise</button>}
        </div>
        {colis.bonSortie && (
          <div>
            <div style={{ fontSize: 12, color: "var(--text)" }}>Récupéré par <strong>{colis.bonSortie.nom}</strong> · {colis.bonSortie.telephone}</div>
            {colis.bonSortie.piece && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>Pièce d'identité : {colis.bonSortie.piece}</div>}
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>Le {new Date(colis.bonSortie.date).toLocaleDateString("fr-FR")} · enregistré par {colis.bonSortie.enregistrePar}</div>
            <button onClick={telechargerBonSortie} disabled={bonSortieState === "loading"} style={{ ...smallBtn, marginTop: 10 }}><Download size={13} /> {bonSortieState === "loading" ? "Génération…" : "Télécharger le bon de sortie"}</button>
            {bonSortieState === "error" && <span style={{ fontSize: 11, color: "#E23F52", marginLeft: 8 }}>Échec — réessayez</span>}
          </div>
        )}
        {!colis.bonSortie && <div style={{ fontSize: 12, color: "var(--muted)" }}>Aucune remise enregistrée pour ce colis.</div>}
      </div>

      {colis.photos && colis.photos.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Photos du colis</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))", gap: 10 }}>
            {colis.photos.map((src, i) => (
              <img key={i} src={src} alt={`Photo ${i + 1}`} style={{ width: "100%", height: 96, objectFit: "cover", borderRadius: 8, border: "1.5px solid var(--border)" }} />
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Historique de suivi</div>
        {colis.historique.map((h, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 10, paddingBottom: 8, borderBottom: i < colis.historique.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: h.status === "Annulé" ? "#E23F52" : "#3ECB84" }} />
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{h.status}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{new Date(h.date).toLocaleString("fr-FR")}</div>
            </div>
            {(h.utilisateur || h.agence) && (
              <div style={{ fontSize: 11, color: "var(--muted)", marginLeft: 18 }}>
                {h.utilisateur && `par ${h.utilisateur}`}{h.agence && ` · agence ${h.agence}`}{h.motif && ` · motif : ${h.motif}`}
              </div>
            )}
          </div>
        ))}
      </div>

      {isChauffeur && (
        <div style={{ background: "var(--surface2)", borderRadius: 12, padding: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Outils chauffeur</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <button onClick={locate} style={smallBtn}><Navigation size={13} /> Localiser ma position</button>
            <a href={loc ? `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}` : "#"} target="_blank" rel="noreferrer" style={{ ...smallBtn, textDecoration: "none", pointerEvents: loc ? "auto" : "none", opacity: loc ? 1 : 0.5 }}><MapPin size={13} /> Ouvrir la navigation</a>
            <label style={{ ...smallBtn, cursor: "pointer" }}><Camera size={13} /> Photo de livraison<input type="file" accept="image/*" onChange={capturePhoto} style={{ display: "none" }} /></label>
          </div>
          {loc && <iframe title="carte" style={{ width: "100%", height: 160, border: "none", borderRadius: 8, marginBottom: 12 }} src={`https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng-0.01},${loc.lat-0.01},${loc.lng+0.01},${loc.lat+0.01}&marker=${loc.lat},${loc.lng}`} />}
          {colis.pod && <img src={colis.pod} alt="Preuve de livraison" style={{ width: "100%", borderRadius: 8, marginBottom: 12 }} />}
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><PenTool size={13} /> Signature du destinataire</div>
          <canvas ref={sigRef} width={520} height={100} style={{ width: "100%", height: 100, background: "#F4F6FB", borderRadius: 8, border: "1.5px solid var(--border)", touchAction: "none" }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={() => drawing && endDraw()}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 14 }}>
          {isAdmin && <button onClick={() => setEditing(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--text)", fontSize: 13, cursor: "pointer" }}><Settings size={14} /> Modifier</button>}
          {effectivePermission(session, "colis.supprimer") && <button onClick={onDelete} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#E23F52", fontSize: 13, cursor: "pointer" }}><Trash2 size={14} /> Supprimer</button>}
          {effectivePermission(session, "colis.annuler") && colis.status !== "Annulé" && colis.status !== "Livré" && <button onClick={() => setCancelling(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#E0A63A", fontSize: 13, cursor: "pointer" }}><AlertTriangle size={14} /> Annuler le colis</button>}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href={waLink(colis.telephone, `Bonjour ${colis.destinataire}, votre colis Ba-Diaby Express (${colis.tracking}) est actuellement : ${colis.status}. Suivez-le à tout moment en nous contactant.`)} target="_blank" rel="noreferrer" style={{ ...smallBtn, textDecoration: "none", background: "#3ECB84", color: "#fff", borderColor: "#3ECB84" }}><MessageCircle size={13} /> Notifier WhatsApp</a>
          <button onClick={handleDownloadLabel} disabled={labelState === "loading"} style={smallBtn}><Printer size={13} /> {labelState === "loading" ? "Génération…" : "Étiquette QR"}</button>
          {labelState === "error" && <span style={{ fontSize: 11, color: "#E23F52", alignSelf: "center" }}>Échec — réessayez</span>}
          <button onClick={handleDownloadInvoice} disabled={invoiceState === "loading"} style={smallBtn}><Download size={13} /> {invoiceState === "loading" ? "Génération…" : "Facture PDF"}</button>
          {invoiceState === "error" && <span style={{ fontSize: 11, color: "#E23F52", alignSelf: "center" }}>Échec — réessayez</span>}
          {canManage && !isLast && colis.status !== "Annulé" && <button onClick={onAdvance} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "none", background: "#E23F52", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Statut suivant <ChevronRight size={14} /></button>}
        </div>
      </div>
      {cancelling && (
        <div style={{ marginTop: 14, background: "#2B1620", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12.5, color: "#E23F52", fontWeight: 700, marginBottom: 8 }}>Confirmer l'annulation du colis</div>
          <input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif de l'annulation" style={{ ...inputStyle, marginBottom: 10 }} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => { setCancelling(false); setMotif(""); }} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12.5, cursor: "pointer" }}>Retour</button>
            <button onClick={() => { onCancel(motif); setCancelling(false); setMotif(""); }} style={{ background: "#E23F52", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Confirmer l'annulation</button>
          </div>
        </div>
      )}
      {editing && <EditColisForm colis={colis} onClose={() => setEditing(false)} onSave={(patch) => { onUpdate(patch); setEditing(false); }} />}
      {bonSortieOuvert && (
        <Modal onClose={() => setBonSortieOuvert(false)} title="Enregistrer la remise du colis">
          <Field label="Nom de la personne qui récupère le colis *"><input value={recupNom} onChange={(e) => setRecupNom(e.target.value)} style={inputStyle} /></Field>
          <Field label="Numéro de téléphone *"><input value={recupTel} onChange={(e) => setRecupTel(e.target.value)} style={inputStyle} /></Field>
          <Field label="Numéro de pièce d'identité (facultatif)"><input value={recupPiece} onChange={(e) => setRecupPiece(e.target.value)} style={inputStyle} placeholder="CNI, passeport..." /></Field>
          <Field label="Date (facultatif)"><input type="date" value={recupDate} onChange={(e) => setRecupDate(e.target.value)} style={inputStyle} /></Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button onClick={() => setBonSortieOuvert(false)} style={{ padding: "10px 18px", borderRadius: 9, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--muted)", fontSize: 13.5, cursor: "pointer" }}>Annuler</button>
            <button onClick={validerBonSortie} style={{ padding: "10px 18px", borderRadius: 9, border: "none", background: "#3D63FF", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
const smallBtn = { display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: `1.5px solid ${BORDER}`, background: SURFACE2, color: MUTED, fontSize: 12.5, cursor: "pointer" };

function Info({ label, value, accent }) {
  return <div><div style={{ fontSize: 11, color: MUTED }}>{label}</div><div style={{ fontSize: 14, color: accent ? RED : TEXT, fontWeight: 600 }}>{value}</div></div>;
}

/** Construit un annuaire client unique (téléphone) à partir de l'historique des colis, côté expéditeur ET destinataire. */
function buildClientDirectory(colisList) {
  const map = {};
  colisList.forEach((c) => {
    if (c.telephone) {
      const key = c.telephone.trim();
      const entry = { telephone: c.telephone, nomComplet: c.destinataire, prenom: "", nom: c.destinataire, email: c.destinataireEmail || "", adresse: c.destinataireAdresse || "", ville: c.destinataireVille || "", codePostal: c.destinataireCodePostal || "", pays: c.destinatairePays || c.pays, date: c.createdAt, count: 0, total: 0 };
      if (!map[key] || new Date(c.createdAt) > new Date(map[key].date)) map[key] = { ...entry, count: (map[key]?.count || 0), total: (map[key]?.total || 0) };
      map[key].count = (map[key].count || 0) + 1;
      map[key].total = (map[key].total || 0) + c.prix;
    }
    if (c.expediteurTelephone) {
      const key = c.expediteurTelephone.trim();
      if (!map[key]) {
        map[key] = { telephone: c.expediteurTelephone, nomComplet: c.expediteur, prenom: "", nom: c.expediteur, email: c.expediteurEmail || "", adresse: c.expediteurAdresse || "", ville: "", codePostal: "", pays: c.expediteurPays || "GN", date: c.createdAt, count: 0, total: 0 };
      }
    }
  });
  return Object.values(map);
}

function Clients({ data }) {
  const [filtre, setFiltre] = useState("tous");
  const [query, setQuery] = useState("");
  const clients = buildClientDirectory(data.colis);

  const trenteJours = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let filtered = clients;
  if (filtre === "meilleurs") filtered = [...clients].sort((a, b) => b.total - a.total).slice(0, 20);
  if (filtre === "nouveaux") filtered = clients.filter((c) => new Date(c.date).getTime() > trenteJours);
  if (filtre === "reguliers") filtered = clients.filter((c) => c.count >= 3);
  if (query) filtered = filtered.filter((c) => c.nomComplet?.toLowerCase().includes(query.toLowerCase()) || c.telephone?.includes(query));

  const tabs = [["tous", "Tous"], ["meilleurs", "Meilleurs clients"], ["nouveaux", "Nouveaux clients"], ["reguliers", "Clients réguliers"]];

  return (
    <div>
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)", fontSize: 24, margin: "0 0 4px" }}>Clients</h1>
      <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 0, marginBottom: 4 }}>{clients.length} clients · Base de données et historique d'envoi</p>
      <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 0, marginBottom: 18 }}>Astuce : dans "Nouveau colis", tapez le numéro de téléphone d'un client existant pour remplir automatiquement ses informations.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setFiltre(k)} style={{ padding: "7px 14px", borderRadius: 20, border: "1.5px solid " + (filtre === k ? "#E23F52" : "var(--border)"), background: filtre === k ? "#E23F52" : "var(--surface)", color: filtre === k ? "#fff" : "var(--muted)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{label}</button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px", marginBottom: 18, maxWidth: 420 }}>
        <Search size={15} color="var(--muted)" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un client par nom ou téléphone..." style={{ border: "none", outline: "none", background: "none", flex: 1, fontSize: 13.5, color: "var(--text)" }} />
      </div>

      <div style={{ background: "var(--surface)", borderRadius: 14, boxShadow: "0 2px 10px rgba(10,38,71,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "var(--surface2)", textAlign: "left" }}>{["Client", "Contact", "Expéditions", "Total dépensé", "Fidélité", "Remise applicable"].map((h) => <th key={h} style={{ padding: "12px 16px", fontSize: 11.5, color: "var(--muted)", fontWeight: 700 }}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.telephone} style={{ borderTop: "1px solid var(--surface2)" }}>
                <td style={{ padding: "12px 16px", fontSize: 13.5, color: "var(--text)", fontWeight: 600 }}>
                  {c.nomComplet}
                  {new Date(c.date).getTime() > trenteJours && <span style={{ marginLeft: 8, background: "#16233F", color: "#5B8DEF", padding: "2px 7px", borderRadius: 10, fontSize: 10 }}>nouveau</span>}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted)" }}>{c.telephone}{c.email ? ` · ${c.email}` : ""}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted)" }}>{c.count}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted)" }}>{fmt(c.total, "EUR")}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted)" }}>{c.count * 10} pts</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>
                  {loyaltyDiscount(c.count) > 0
                    ? <span style={{ background: "#12261D", color: "#3ECB84", padding: "3px 9px", borderRadius: 20, fontSize: 11.5, fontWeight: 700 }}>-{loyaltyDiscount(c.count)}%</span>
                    : <span style={{ color: "var(--muted)" }}>—</span>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Aucun client ne correspond.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaiementsPage({ data, notify }) {
  const [filter, setFilter] = useState("tous");
  const colis = data.colis;
  const withStatus = colis.map((c) => ({ ...c, payStatus: c.reste <= 0 ? "solde" : c.paye > 0 ? "partiel" : "impaye" }));
  const filtered = filter === "tous" ? withStatus : withStatus.filter((c) => c.payStatus === filter);
  const totalCA = colis.reduce((s, c) => s + c.prix, 0);
  const totalEncaisse = colis.reduce((s, c) => s + c.paye, 0);
  const totalReste = colis.reduce((s, c) => s + c.reste, 0);
  const labels = { solde: "Soldé", partiel: "Partiel", impaye: "Impayé" };
  const colors = { solde: { bg: "#12261D", fg: "#3ECB84" }, partiel: { bg: "#2B2313", fg: "#E0A63A" }, impaye: { bg: "#2B1620", fg: "#E23F52" } };

  return (
    <div>
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)", fontSize: 24, margin: "0 0 4px" }}>Paiements & Factures</h1>
      <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 0, marginBottom: 22 }}>Suivi des règlements et téléchargement des factures commerciales</p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Chiffre d'affaires" value={fmt(totalCA, "EUR")} icon={DollarSign} tint="#0A2647" />
        <StatCard label="Total encaissé" value={fmt(totalEncaisse, "EUR")} icon={CheckCircle2} tint="#3ECB84" />
        <StatCard label="Reste à encaisser" value={fmt(totalReste, "EUR")} icon={Clock} tint="#E23F52" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["tous", "solde", "partiel", "impaye"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "7px 14px", borderRadius: 20, border: "1.5px solid " + (filter === f ? "#E23F52" : "var(--border)"),
            background: filter === f ? "#E23F52" : "var(--surface)", color: filter === f ? "#fff" : "var(--muted)", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          }}>{f === "tous" ? "Tous" : labels[f]}</button>
        ))}
      </div>

      <div style={{ background: "var(--surface)", borderRadius: 14, boxShadow: "0 2px 10px rgba(10,38,71,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "var(--surface2)", textAlign: "left" }}>{["N° de suivi", "Client", "Total", "Payé", "Reste", "Statut", ""].map((h) => <th key={h} style={{ padding: "12px 16px", fontSize: 11.5, color: "var(--muted)", fontWeight: 700 }}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.tracking} style={{ borderTop: "1px solid var(--surface2)" }}>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{c.tracking}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted)" }}>{c.destinataire}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted)" }}>{fmt(c.prix, "EUR")}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted)" }}>{fmt(c.paye, "EUR")}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: c.reste > 0 ? "#E23F52" : "var(--muted)" }}>{fmt(c.reste, "EUR")}</td>
                <td style={{ padding: "12px 16px", fontSize: 12.5 }}><span style={{ background: colors[c.payStatus].bg, color: colors[c.payStatus].fg, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>{labels[c.payStatus]}</span></td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <button onClick={() => downloadInvoice(c).catch((e) => { console.error(e); notify?.("Échec de génération du PDF — réessayez"); })} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--text)", cursor: "pointer", fontSize: 12.5 }}><Download size={13} /> PDF</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Aucun colis dans cette catégorie.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComptabilitePage({ data, persist, session, notify }) {
  const [periode, setPeriode] = useState("mois");
  const [form, setForm] = useState(null);
  const depenses = data.depenses || [];

  const now = new Date();
  const inPeriod = (dateStr) => {
    const d = new Date(dateStr);
    if (periode === "jour") return d.toDateString() === now.toDateString();
    if (periode === "semaine") { const start = new Date(now); start.setDate(now.getDate() - now.getDay()); return d >= start; }
    if (periode === "mois") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  };

  const colisPeriode = data.colis.filter((c) => c.status !== "Annulé" && inPeriod(c.createdAt));
  const recettes = colisPeriode.reduce((s, c) => s + c.paye, 0); // encaissé réel, EUR-équivalent
  const facture = colisPeriode.reduce((s, c) => s + c.prix, 0); // facturé (créances comprises), EUR-équivalent
  const depensesPeriode = depenses.filter((d) => inPeriod(d.date));
  const totalDepenses = depensesPeriode.filter((d) => d.type === "Dépense").reduce((s, d) => s + d.montant, 0); // en GNF (saisie manuelle)
  const totalSalaires = depensesPeriode.filter((d) => d.type === "Salaire").reduce((s, d) => s + d.montant, 0); // en GNF
  const commissionsManuelles = depensesPeriode.filter((d) => d.type === "Commission").reduce((s, d) => s + d.montant, 0); // en GNF
  const commissionsAuto = colisPeriode.reduce((s, c) => s + calcCommission(c, data.commissionConfig, data.categories), 0); // EUR-équivalent (taux en €)
  const gnfRate = LIVE_RATES.GNF || CURRENCIES.GNF;
  const totalCommissions = commissionsAuto + commissionsManuelles / gnfRate;
  const commissionsParAgence = (data.sites || []).map((s) => ({
    nom: s.nom,
    montant: colisPeriode.filter((c) => (c.site || "Bambeto") === s.nom).reduce((sum, c) => sum + calcCommission(c, data.commissionConfig, data.categories), 0),
  }));
  const benefice = recettes - (totalDepenses / gnfRate) - (totalSalaires / gnfRate) - totalCommissions;

  // Encaissements réels (date du paiement, pas de la création du colis), par mode et par jour
  const tousPaiements = data.colis.flatMap((c) => (c.paiements || []).map((p) => ({ ...p, tracking: c.tracking, site: c.site || "Bambeto" })));
  const paiementsPeriode = tousPaiements.filter((p) => inPeriod(p.date));
  const parMode = {};
  paiementsPeriode.forEach((p) => { parMode[p.mode] = (parMode[p.mode] || 0) + p.montant; });
  const parJour = {};
  paiementsPeriode.forEach((p) => { const j = new Date(p.date).toLocaleDateString("fr-FR"); parJour[j] = (parJour[j] || 0) + p.montant; });
  const joursTries = Object.entries(parJour).sort((a, b) => new Date(b[0].split("/").reverse().join("-")) - new Date(a[0].split("/").reverse().join("-")));

  function addDepense() {
    if (!form.nom.trim() || !form.montant) return;
    const entry = { id: `dep${Date.now()}`, type: form.type, nom: form.nom.trim(), montant: Number(form.montant) || 0, date: form.date || new Date().toISOString() };
    persist({ ...data, depenses: [entry, ...depenses], activityLog: pushActivity(data, session, `${form.type} ajouté${form.type === "Dépense" ? "e" : ""}`, `${entry.nom} — ${fmtGNF(entry.montant)}`) });
    notify?.(`${form.type} enregistré${form.type === "Dépense" ? "e" : ""}`);
    setForm(null);
  }
  function removeDepense(id) {
    persist({ ...data, depenses: depenses.filter((d) => d.id !== id) });
  }
  function exportRapport() {
    const headers = ["Type", "Nom", "Montant_GNF", "Date"];
    const rows = depensesPeriode.map((d) => [d.type, d.nom, d.montant, new Date(d.date).toLocaleDateString("fr-FR")]);
    rows.push(["Recette", "Total encaissé (période)", recettes, ""]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rapport-financier-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)", fontSize: 24, margin: 0 }}>Comptabilité</h1>
          <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "4px 0 0" }}>Recettes, dépenses, salaires, commissions et bénéfices</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={exportRapport} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><Download size={14} /> Rapport CSV</button>
          {effectivePermission(session, "compta.gerer_depenses") && <button onClick={() => setForm({ type: "Dépense", nom: "", montant: "", date: new Date().toISOString().slice(0,10) })} style={{ display: "flex", alignItems: "center", gap: 6, background: "#E23F52", color: "#fff", border: "none", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><Plus size={14} /> Ajouter</button>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[["jour", "Aujourd'hui"], ["semaine", "Cette semaine"], ["mois", "Ce mois"], ["tout", "Tout"]].map(([k, label]) => (
          <button key={k} onClick={() => setPeriode(k)} style={{ padding: "7px 14px", borderRadius: 20, border: "1.5px solid " + (periode === k ? "#E23F52" : "var(--border)"), background: periode === k ? "#E23F52" : "var(--surface)", color: periode === k ? "#fff" : "var(--muted)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{label}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Recettes encaissées" value={fmt(recettes, "EUR")} icon={CheckCircle2} tint="#3ECB84" trend={`Facturé : ${fmt(facture, "EUR")}`} trendColor="#8A97B5" />
        <StatCard label="Dépenses" value={fmtGNF(totalDepenses)} icon={Receipt} tint="#E23F52" />
        <StatCard label="Salaires" value={fmtGNF(totalSalaires)} icon={Users} tint="#E0A63A" />
        <StatCard label="Commissions" value={fmt(totalCommissions, "EUR")} icon={DollarSign} tint="#8B5CF6" trend={`dont auto : ${fmt(commissionsAuto, "EUR")}`} trendColor="#8A97B5" />
      </div>

      <div style={{ background: benefice >= 0 ? "#0F2A1C" : "#2B1620", borderRadius: 14, padding: 20, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>Bénéfice net (période)</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: benefice >= 0 ? "#3ECB84" : "#E23F52" }}>{fmt(benefice, "EUR")}</div>
      </div>

      {paiementsPeriode.length > 0 && (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, border: "1px solid var(--border)", flex: 1, minWidth: 260 }}>
            <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 12 }}>Encaissements par mode de paiement</div>
            {Object.entries(parMode).sort((a, b) => b[1] - a[1]).map(([mode, montant]) => (
              <div key={mode} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, color: "var(--text)" }}>{mode}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#3ECB84" }}>{fmt(montant, "EUR")}</span>
              </div>
            ))}
          </div>
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, border: "1px solid var(--border)", flex: 1, minWidth: 260, maxHeight: 260, overflowY: "auto" }}>
            <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 12 }}>Encaissements par jour</div>
            {joursTries.map(([jour, montant]) => (
              <div key={jour} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, color: "var(--text)" }}>{jour}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#3ECB84" }}>{fmt(montant, "EUR")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {commissionsParAgence.length > 0 && (
        <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, border: "1px solid var(--border)", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 4 }}>Commissions automatiques par agence</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Calculées selon les taux définis dans Configuration → Commissions par Agence.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
            {commissionsParAgence.map((a) => (
              <div key={a.nom} style={{ background: "var(--surface2)", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{a.nom}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#3ECB84", fontFamily: "'Space Grotesk',sans-serif", marginTop: 4 }}>{fmt(a.montant, "EUR")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "var(--surface2)", textAlign: "left" }}>{["Type", "Libellé", "Montant", "Date", ""].map((h) => <th key={h} style={{ padding: "12px 16px", fontSize: 11.5, color: "var(--muted)", fontWeight: 700 }}>{h}</th>)}</tr></thead>
          <tbody>
            {depensesPeriode.map((d) => (
              <tr key={d.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 16px", fontSize: 12.5 }}><span style={{ background: "var(--surface2)", color: "var(--text)", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{d.type}</span></td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text)" }}>{d.nom}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted)" }}>{fmtGNF(d.montant)}</td>
                <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--muted)" }}>{new Date(d.date).toLocaleDateString("fr-FR")}</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>{effectivePermission(session, "compta.gerer_depenses") && <button onClick={() => removeDepense(d.id)} style={{ background: "none", border: "none", color: "#E23F52", cursor: "pointer" }}><Trash2 size={14} /></button>}</td>
              </tr>
            ))}
            {depensesPeriode.length === 0 && <tr><td colSpan={5} style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Aucune dépense, salaire ou commission sur cette période.</td></tr>}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal onClose={() => setForm(null)} title="Ajouter une écriture">
          <Field label="Type">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
              <option value="Dépense">Dépense</option>
              <option value="Salaire">Salaire</option>
              <option value="Commission">Commission</option>
            </select>
          </Field>
          <Field label="Libellé"><input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle} placeholder="ex: Carburant, Salaire Ibrahima, Commission agent Paris" /></Field>
          <Field label="Montant (GNF)"><input value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} style={inputStyle} /></Field>
          <Field label="Date"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} /></Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button onClick={() => setForm(null)} style={{ padding: "9px 16px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>Annuler</button>
            <button onClick={addDepense} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "#E23F52", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

async function callClaude(prompt) {
  const response = await fetch("/api/claude", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model: "claude-sonnet-4-5-20250929", max_tokens: 1000 }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erreur API Claude");
  return data.text || "";
}

function AiColisModal({ onClose, onCreate, data }) {
  const [texte, setTexte] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [extracted, setExtracted] = useState(null);

  async function analyser() {
    if (!texte.trim()) return;
    setLoading(true); setErr(""); setExtracted(null);
    const codesValides = COUNTRIES.map((c) => c.code).join(", ");
    const prompt = `Tu extrais les informations d'un colis à expédier depuis une phrase en français. Voici les codes pays valides (utilise EXACTEMENT un de ces codes, en devinant le plus probable si le pays est cité par son nom) : ${codesValides}. Guinée = GN.
Phrase : "${texte.replace(/"/g, "'")}"
Réponds UNIQUEMENT en JSON strict, sans texte autour, avec ces clés (mets null si une info manque) :
{"expediteur_prenom": "", "expediteur_nom": "", "expediteur_telephone": "", "destinataire_prenom": "", "destinataire_nom": "", "destinataire_telephone": "", "pays_expediteur": "", "pays_destinataire": "", "poids_kg": 0, "prix_eur": null, "produit_nom": ""}`;
    try {
      const text = await callClaude(prompt);
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setExtracted(parsed);
    } catch (e) {
      setErr("L'IA n'a pas pu analyser cette phrase. Réessayez en étant plus précis.");
    }
    setLoading(false);
  }

  function confirmer() {
    const expPays = COUNTRIES.some((c) => c.code === extracted.pays_expediteur) ? extracted.pays_expediteur : "GN";
    const destPays = COUNTRIES.some((c) => c.code === extracted.pays_destinataire) ? extracted.pays_destinataire : "FR";
    const direction = destPays === "GN" ? "import" : "export";
    const pays = destPays === "GN" ? expPays : destPays;
    const poids = Number(extracted.poids_kg) || 1;
    const prixBrut = extracted.prix_eur ? Number(extracted.prix_eur) : calcPrice(pays, poids, 0, "air");
    const produit = extracted.produit_nom || "Colis";
    onCreate({
      tracking: genTracking(),
      expediteur: `${extracted.expediteur_prenom || ""} ${extracted.expediteur_nom || ""}`.trim() || "Expéditeur",
      expediteurTelephone: extracted.expediteur_telephone || "", expediteurEmail: "", expediteurAdresse: "", expediteurPays: expPays,
      destinataire: `${extracted.destinataire_prenom || ""} ${extracted.destinataire_nom || ""}`.trim() || "Destinataire",
      telephone: extracted.destinataire_telephone || "", destinataireEmail: "", destinataireAdresse: "", destinatairePays: destPays,
      pays, direction, mode: "air",
      produits: [{ id: `p${Date.now()}`, nom: produit, quantite: "1", poids: String(poids), categorie: "", personnalise: false, montant: "", devise: "GNF", typePrix: "unitaire" }],
      poids, volume: 0, valeurDeclaree: 0,
      prixBrut, discountLoyalty: 0, rabaisMontant: 0, rabaisDevise: "GNF", rabaisEUR: 0, prix: prixBrut, paye: 0, reste: prixBrut, photos: [],
      status: "Enregistré", historique: [{ status: "Enregistré", date: new Date().toISOString() }],
      createdAt: new Date().toISOString(), pod: null, signature: null, driverLoc: null,
    });
    onClose();
  }

  return (
    <Modal onClose={onClose} title="Créer un colis par IA" wide>
      <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>Décrivez le colis en une phrase, l'IA remplit le formulaire à votre place. Exemple : "Colis de Paris vers Conakry, expéditeur Mamadou Diallo au +33612345678, destinataire Ibrahima Bah au +224620000000, poids 12 kg, prix 120 euros."</div>
      <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", marginBottom: 12 }} placeholder="Créer un colis de Paris vers Conakry..." />
      <button onClick={analyser} disabled={loading || !texte.trim()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "#8B5CF6", color: "#fff", border: "none", borderRadius: 9, padding: "11px 0", fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginBottom: 14 }}>
        {loading ? <RefreshCw size={15} /> : <Sparkles size={15} />} {loading ? "Analyse en cours…" : "Analyser la phrase"}
      </button>
      {err && <div style={{ color: "#E23F52", fontSize: 12.5, marginBottom: 12 }}>{err}</div>}

      {extracted && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 10 }}>APERÇU — VÉRIFIEZ AVANT DE CONFIRMER</div>
          <Info label="Expéditeur" value={`${extracted.expediteur_prenom || "?"} ${extracted.expediteur_nom || ""} · ${extracted.expediteur_telephone || "non précisé"}`} />
          <div style={{ height: 10 }} />
          <Info label="Destinataire" value={`${extracted.destinataire_prenom || "?"} ${extracted.destinataire_nom || ""} · ${extracted.destinataire_telephone || "non précisé"}`} />
          <div style={{ height: 10 }} />
          <Info label="Route" value={`${FLAGS[extracted.pays_expediteur] || ""} ${extracted.pays_expediteur || "GN"} → ${FLAGS[extracted.pays_destinataire] || ""} ${extracted.pays_destinataire || "FR"}`} />
          <div style={{ height: 10 }} />
          <Info label="Poids / Produit" value={`${extracted.poids_kg || 1} kg · ${extracted.produit_nom || "Colis"}`} />
          <div style={{ height: 10 }} />
          <Info label="Prix" value={extracted.prix_eur ? fmt(Number(extracted.prix_eur), "EUR") : "Calculé automatiquement"} />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 9, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--muted)", fontSize: 13.5, cursor: "pointer" }}>Annuler</button>
        {extracted && <button onClick={confirmer} style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: "#E23F52", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Confirmer et enregistrer le colis</button>}
      </div>
    </Modal>
  );
}

function AiAssistant({ data }) {
  const [tab, setTab] = useState("route");
  const [pays, setPays] = useState("FR");
  const [mode, setMode] = useState("air");
  const [poids, setPoids] = useState("10");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  async function generate() {
    setLoading(true); setErr(""); setResult(null);
    const c = COUNTRIES.find((x) => x.code === pays);
    const histo = data.colis.filter((x) => x.pays === pays && x.mode === mode);
    const avgWeight = histo.length ? (histo.reduce((s, x) => s + x.poids, 0) / histo.length).toFixed(1) : "n/a";
    const contexte = data.miraKnowledge ? `\nInformations propres à l'entreprise à prendre en compte : ${data.miraKnowledge}\n` : "";
    const prompt = `Tu es l'assistant logistique de Ba-Diaby Express (transport Conakry-monde). Route: Conakry -> ${c.name} (${c.city}), mode: ${mode === "air" ? "aérien" : "maritime"}, poids du colis: ${poids} kg. Délai de référence historique: ${mode === "air" ? c.delayAir : c.delaySea} jours. Nombre de colis déjà expédiés sur cette route: ${histo.length}, poids moyen historique: ${avgWeight} kg.${contexte} Réponds UNIQUEMENT en JSON strict avec les clés: "delai_estime_jours" (nombre), "itineraire" (une phrase courte en français), "conseil_tarif" (une phrase courte en français), "prevision" (une phrase courte en français sur la tendance des coûts/délais). Pas de texte hors JSON.`;
    try {
      const text = await callClaude(prompt);
      const clean = text.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch (e) { setErr("L'analyse IA n'a pas pu être générée. Réessayez."); }
    setLoading(false);
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)", fontSize: 24, margin: "0 0 4px" }}>Assistant IA</h1>
      <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 0, marginBottom: 18 }}>Estimation de route et questions sur votre activité, générées par IA à partir de vos données</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab("route")} style={{ padding: "8px 16px", borderRadius: 20, border: "1.5px solid " + (tab === "route" ? "#E23F52" : "var(--border)"), background: tab === "route" ? "#E23F52" : "var(--surface)", color: tab === "route" ? "#fff" : "var(--muted)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Estimation de route</button>
        <button onClick={() => setTab("qa")} style={{ padding: "8px 16px", borderRadius: 20, border: "1.5px solid " + (tab === "qa" ? "#E23F52" : "var(--border)"), background: tab === "qa" ? "#E23F52" : "var(--surface)", color: tab === "qa" ? "#fff" : "var(--muted)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Poser une question</button>
      </div>

      {tab === "route" ? (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: 22, width: "min(92vw, 320px)", boxShadow: "0 2px 10px rgba(10,38,71,0.06)" }}>
            <Field label="Destination"><select value={pays} onChange={(e) => setPays(e.target.value)} style={inputStyle}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></Field>
            <Field label="Mode"><div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setMode("air")} style={{ ...toggleBtn, ...(mode === "air" ? toggleActive : {}) }}><Plane size={14} /> Aérien</button>
              <button disabled title="Voie maritime temporairement indisponible" style={{ ...toggleBtn, opacity: 0.4, cursor: "not-allowed" }}><Ship size={14} /> Maritime</button>
            </div></Field>
            <Field label="Poids (kg)"><input value={poids} onChange={(e) => setPoids(e.target.value)} style={inputStyle} /></Field>
            <button onClick={generate} disabled={loading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#E23F52", color: "#fff", border: "none", borderRadius: 9, padding: "11px 0", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
              {loading ? <RefreshCw size={15} className="spin" /> : <Sparkles size={15} />} {loading ? "Analyse en cours…" : "Générer l'analyse IA"}
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            {err && <div style={{ color: "#E23F52", fontSize: 13 }}>{err}</div>}
            {result && (
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ background: "#0A2647", borderRadius: 14, padding: 20, color: "#fff" }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Délai estimé</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 700 }}>{result.delai_estime_jours} jours</div>
                </div>
                <AiCard title="Meilleur itinéraire" text={result.itineraire} />
                <AiCard title="Suggestion tarifaire" text={result.conseil_tarif} />
                <AiCard title="Prévision" text={result.prevision} />
              </div>
            )}
            {!result && !loading && !err && <div style={{ color: "var(--muted)", fontSize: 13 }}>Renseignez les paramètres puis lancez l'analyse.</div>}
          </div>
        </div>
      ) : (
        <AiQaPanel data={data} />
      )}
    </div>
  );
}

function AiQaPanel({ data }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [err, setErr] = useState("");
  const suggestions = [
    "Combien de colis sont en transit ?",
    "Quels clients n'ont pas payé ?",
    "Quel est le chiffre d'affaires du jour ?",
    "Combien de kilos ont été expédiés cette semaine ?",
  ];

  async function poser(q) {
    const question2 = q || question;
    if (!question2.trim()) return;
    setLoading(true); setErr(""); setAnswer(null);
    const now = new Date();
    const debutSemaine = new Date(now); debutSemaine.setDate(now.getDate() - now.getDay());
    const debutJour = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const colisResume = data.colis.map((c) => ({
      tracking: c.tracking, statut: c.status, destinataire: c.destinataire, poids: c.poids,
      prix_eur: c.prix, paye_eur: c.paye, reste_eur: c.reste, pays: c.pays, cree_le: c.createdAt,
    }));
    const prompt = `Tu es l'assistant de gestion de Ba-Diaby Express. Voici les données actuelles de l'entreprise au format JSON (statuts possibles : ${STATUSES.join(", ")}, Annulé) :
${JSON.stringify(colisResume).slice(0, 12000)}
Date du jour : ${now.toISOString()}. Début de semaine (dimanche) : ${debutSemaine.toISOString()}.
Question de l'utilisateur : "${question2}"
Réponds en français, de façon concise (2-4 phrases maximum), en te basant UNIQUEMENT sur les données fournies. Si l'information demandée n'est pas calculable à partir des données, dis-le clairement.`;
    try {
      const text = await callClaude(prompt);
      setAnswer(text.trim());
    } catch (e) { setErr("La question n'a pas pu être traitée. Réessayez."); }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && poser()} style={{ ...inputStyle, flex: 1 }} placeholder="Posez une question sur votre activité..." />
        <button onClick={() => poser()} disabled={loading || !question.trim()} style={{ display: "flex", alignItems: "center", gap: 6, background: "#E23F52", color: "#fff", border: "none", borderRadius: 9, padding: "0 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          {loading ? <RefreshCw size={15} /> : <Sparkles size={15} />}
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {suggestions.map((s) => (
          <button key={s} onClick={() => { setQuestion(s); poser(s); }} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 20, padding: "6px 12px", fontSize: 11.5, color: "var(--muted)", cursor: "pointer" }}>{s}</button>
        ))}
      </div>
      {err && <div style={{ color: "#E23F52", fontSize: 13, marginBottom: 12 }}>{err}</div>}
      {loading && <div style={{ color: "var(--muted)", fontSize: 13 }}>Analyse des données en cours…</div>}
      {answer && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, display: "flex", gap: 12 }}>
          <Sparkles size={18} color="#8B5CF6" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.6 }}>{answer}</div>
        </div>
      )}
    </div>
  );
}
function AiCard({ title, text }) {
  return <div style={{ background: "var(--surface)", borderRadius: 12, padding: "14px 18px", boxShadow: "0 2px 10px rgba(10,38,71,0.06)" }}><div style={{ fontSize: 12, fontWeight: 700, color: "#E23F52", marginBottom: 4 }}>{title}</div><div style={{ fontSize: 13.5, color: "var(--text)" }}>{text}</div></div>;
}

function SiteVitrinePage({ data, persist, notify, onBack }) {
  const site = data.siteVitrine || {};
  const [nomPublic, setNomPublic] = useState(site.nomPublic || "Ba-Diaby Express");
  const [tagline, setTagline] = useState(site.tagline || "La Ponte entre la France et la Guinée");
  const [domaine, setDomaine] = useState(site.domaine || "");
  const [trackingPublic, setTrackingPublic] = useState(site.trackingPublic ?? true);

  function save() {
    persist({ ...data, siteVitrine: { nomPublic, tagline, domaine, trackingPublic } });
    notify?.("Site vitrine mis à jour");
  }

  return (
    <div>
      <ConfigPageHeader title="Site Vitrine Public" desc="Personnalisez votre page d'accueil, activez le tracking public et configurez votre nom de domaine." onBack={onBack} />
      <div style={{ background: "var(--surface)", borderRadius: 14, padding: 22, maxWidth: 460, border: "1px solid var(--border)" }}>
        <Field label="Nom affiché au public"><input value={nomPublic} onChange={(e) => setNomPublic(e.target.value)} style={inputStyle} /></Field>
        <Field label="Slogan"><input value={tagline} onChange={(e) => setTagline(e.target.value)} style={inputStyle} /></Field>
        <Field label="Nom de domaine personnalisé (optionnel)"><input value={domaine} onChange={(e) => setDomaine(e.target.value)} style={inputStyle} placeholder="www.badiaby-express.com" /></Field>
        <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, cursor: "pointer" }}>
          <input type="checkbox" checked={trackingPublic} onChange={(e) => setTrackingPublic(e.target.checked)} />
          <div><div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>Suivi public activé</div><div style={{ fontSize: 11.5, color: "var(--muted)" }}>Les clients peuvent suivre leur colis sans se connecter</div></div>
        </label>
        <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 12px", fontSize: 11.5, color: "var(--muted)", marginBottom: 16 }}>
          Un site public séparé nécessite un hébergement dédié — cette section prépare les réglages ; parlez-m'en si vous voulez qu'on le construise.
        </div>
        <button onClick={save} style={{ background: "#3D63FF", color: "#fff", border: "none", borderRadius: 9, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>
      </div>
    </div>
  );
}

function SitesOperationPage({ data, persist, notify, onBack }) {
  const sites = data.sites || [];
  const [form, setForm] = useState(null);

  function saveSite() {
    if (!form.nom) return;
    const exists = sites.some((s) => s.id === form.id);
    const next = exists ? sites.map((s) => (s.id === form.id ? form : s)) : [...sites, { ...form, id: form.id || `s${Date.now()}` }];
    persist({ ...data, sites: next });
    notify?.(exists ? "Site mis à jour" : "Site ajouté");
    setForm(null);
  }
  function removeSite(id) { persist({ ...data, sites: sites.filter((s) => s.id !== id) }); }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <ConfigPageHeader title="Sites d'opération" desc="Gérez vos points d'enregistrement et de retrait, et les informations affichées sur le ticket d'envoi." onBack={onBack} />
        <button onClick={() => setForm({ nom: "", adresse: "", horaires: "", paiements: "", stockage: "" })} style={{ display: "flex", alignItems: "center", gap: 6, background: "#E23F52", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}><Plus size={16} /> Ajouter un site</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {sites.map((s) => (
          <div key={s.id} style={{ background: "var(--surface)", borderRadius: 14, padding: 18, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{s.nom}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setForm(s)} style={{ background: "none", border: "none", color: "#5B8DEF", cursor: "pointer" }}><Settings size={14} /></button>
                <button onClick={() => removeSite(s.id)} style={{ background: "none", border: "none", color: "#E23F52", cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{s.adresse}</div>
            {s.horaires && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>🕒 {s.horaires}</div>}
            {s.paiements && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>💳 {s.paiements}</div>}
            {s.stockage && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>📦 {s.stockage}</div>}
          </div>
        ))}
        {sites.length === 0 && <div style={{ color: "var(--muted)", fontSize: 13 }}>Aucun site enregistré — ajoutez Bambeto, Madina, etc.</div>}
      </div>
      {form && (
        <Modal onClose={() => setForm(null)} title={form.id ? "Modifier le site" : "Nouveau site"}>
          <Field label="Nom"><input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle} placeholder="ex: Bambeto" /></Field>
          <Field label="Adresse"><input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} style={inputStyle} /></Field>
          <Field label="Horaires"><input value={form.horaires} onChange={(e) => setForm({ ...form, horaires: e.target.value })} style={inputStyle} placeholder="Lun-Sam 8h-18h" /></Field>
          <Field label="Moyens de paiement acceptés"><input value={form.paiements} onChange={(e) => setForm({ ...form, paiements: e.target.value })} style={inputStyle} placeholder="Espèces, Orange Money" /></Field>
          <Field label="Infos stockage"><input value={form.stockage} onChange={(e) => setForm({ ...form, stockage: e.target.value })} style={inputStyle} placeholder="Retrait sous 7 jours" /></Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button onClick={() => setForm(null)} style={{ padding: "9px 16px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>Annuler</button>
            <button onClick={saveSite} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "#E23F52", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function NotificationsPage({ data, persist, notify, onBack }) {
  const settings = data.notificationSettings || { confirmation: true, statut: true, livraison: true, rappel: true };
  function toggle(key) {
    const next = { ...settings, [key]: !settings[key] };
    persist({ ...data, notificationSettings: next });
    notify?.("Préférences de notification mises à jour");
  }
  const items = [
    { key: "confirmation", label: "Confirmation d'enregistrement", desc: "Envoyée dès qu'un colis est créé" },
    { key: "statut", label: "Changement de statut", desc: "À chaque étape du suivi" },
    { key: "livraison", label: "Confirmation de livraison", desc: "Quand le colis est marqué livré" },
    { key: "rappel", label: "Rappel de paiement", desc: "Pour le reste à payer" },
  ];
  return (
    <div>
      <ConfigPageHeader title="Notifications" desc="Gérez les notifications WhatsApp automatiques et contrôlez les évènements déclencheurs." onBack={onBack} />
      <div style={{ background: "var(--surface)", borderRadius: 14, padding: 22, maxWidth: 460, border: "1px solid var(--border)" }}>
        {items.map((it) => (
          <div key={it.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--border)" }}>
            <div><div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{it.label}</div><div style={{ fontSize: 11.5, color: "var(--muted)" }}>{it.desc}</div></div>
            <button onClick={() => toggle(it.key)} style={{ width: 42, height: 24, borderRadius: 20, border: "none", background: settings[it.key] ? "#3ECB84" : "var(--surface2)", position: "relative", cursor: "pointer", flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: settings[it.key] ? 21 : 3, transition: "left 0.15s" }} />
            </button>
          </div>
        ))}
        <div style={{ marginTop: 16, fontSize: 11.5, color: "var(--muted)" }}>Envoi réel via WhatsApp : voir le cahier des charges technique pour l'intégration Twilio.</div>
      </div>
    </div>
  );
}

function MiraKnowledgePage({ data, persist, notify, onBack }) {
  const [texte, setTexte] = useState(data.miraKnowledge || "");
  function save() {
    persist({ ...data, miraKnowledge: texte });
    notify?.("Connaissances de l'Assistant IA mises à jour");
  }
  return (
    <div>
      <ConfigPageHeader title="Connaissances de Mira" desc="Donnez à l'Assistant IA les infos de votre entreprise (départs, délais, règles) pour des réponses plus utiles à vos clients." onBack={onBack} />
      <div style={{ background: "var(--surface)", borderRadius: 14, padding: 22, maxWidth: 560, border: "1px solid var(--border)" }}>
        <Field label="Informations à transmettre à l'Assistant IA">
          <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={10} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            placeholder="Ex : Les départs vers la France se font tous les mardis et vendredis. Le dédouanement prend en moyenne 3 jours. Nous n'acceptons pas les produits périssables..." />
        </Field>
        <button onClick={save} style={{ background: "#3D63FF", color: "#fff", border: "none", borderRadius: 9, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>
      </div>
    </div>
  );
}

function PaiementConfigPage({ data, persist, notify, onBack }) {
  const cfg = data.paymentConfig || {};
  const [orangeMoney, setOrangeMoney] = useState(cfg.orangeMoney || "");
  const [mtnMoney, setMtnMoney] = useState(cfg.mtnMoney || "");
  const [titulaire, setTitulaire] = useState(cfg.titulaire || "");
  function save() {
    persist({ ...data, paymentConfig: { orangeMoney, mtnMoney, titulaire } });
    notify?.("Configuration de paiement enregistrée");
  }
  return (
    <div>
      <ConfigPageHeader title="Paiement" desc="Configurez vos numéros Mobile Money pour recevoir les paiements de vos clients." onBack={onBack} />
      <div style={{ background: "var(--surface)", borderRadius: 14, padding: 22, maxWidth: 460, border: "1px solid var(--border)" }}>
        <Field label="Numéro Orange Money"><input value={orangeMoney} onChange={(e) => setOrangeMoney(e.target.value)} style={inputStyle} placeholder="+224 6XX XXX XXX" /></Field>
        <Field label="Numéro MTN Mobile Money"><input value={mtnMoney} onChange={(e) => setMtnMoney(e.target.value)} style={inputStyle} placeholder="+224 6XX XXX XXX" /></Field>
        <Field label="Titulaire du compte"><input value={titulaire} onChange={(e) => setTitulaire(e.target.value)} style={inputStyle} /></Field>
        <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 12px", fontSize: 11.5, color: "var(--muted)", marginBottom: 16 }}>
          Le paiement en ligne par carte nécessite un compte Stripe ou une passerelle Mobile Money connectée côté serveur — voir le cahier des charges technique. Ces numéros sont pour l'instant affichés à titre informatif à vos agents.
        </div>
        <button onClick={save} style={{ background: "#3D63FF", color: "#fff", border: "none", borderRadius: 9, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>
      </div>
    </div>
  );
}

function BrandingPage({ data, persist, notify, onBack }) {
  const b = data.branding || {};
  const [nom, setNom] = useState(b.nom || "Ba-Diaby Express");
  const [tagline, setTagline] = useState(b.tagline || "La Ponte entre la France et la Guinée");
  const [logo, setLogo] = useState(b.logo || null);

  function onLogoChange(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  }
  function save() {
    persist({ ...data, branding: { nom, tagline, logo } });
    notify?.("Identité mise à jour");
  }
  return (
    <div>
      <ConfigPageHeader title="Branding & Identité" desc="Logo, textes légaux et personnalisation de l'identité." onBack={onBack} />
      <div style={{ background: "var(--surface)", borderRadius: 14, padding: 22, maxWidth: 460, border: "1px solid var(--border)" }}>
        <Field label="Nom de l'entreprise"><input value={nom} onChange={(e) => setNom(e.target.value)} style={inputStyle} /></Field>
        <Field label="Slogan"><input value={tagline} onChange={(e) => setTagline(e.target.value)} style={inputStyle} /></Field>
        <Field label="Logo">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {logo ? <img src={logo} alt="logo" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} /> : <div style={{ width: 48, height: 48, borderRadius: 8, background: "var(--surface2)" }} />}
            <label style={{ ...smallBtn, cursor: "pointer" }}>Choisir un fichier<input type="file" accept="image/*" onChange={onLogoChange} style={{ display: "none" }} /></label>
          </div>
        </Field>
        <button onClick={save} style={{ marginTop: 8, background: "#3D63FF", color: "#fff", border: "none", borderRadius: 9, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>
      </div>
    </div>
  );
}

function JournalActivitePage({ data, onBack }) {
  const [query, setQuery] = useState("");
  const log = data.activityLog || [];
  const filtered = log.filter((e) => !query || e.action.toLowerCase().includes(query.toLowerCase()) || e.detail?.toLowerCase().includes(query.toLowerCase()) || e.utilisateur?.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <ConfigPageHeader title="Journal d'activité" desc="Historique complet des actions effectuées par les utilisateurs (les 500 dernières)." onBack={onBack} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px", marginBottom: 18, maxWidth: 420 }}>
        <Search size={15} color="var(--muted)" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une action, un utilisateur..." style={{ border: "none", outline: "none", background: "none", flex: 1, fontSize: 13.5, color: "var(--text)" }} />
      </div>
      <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Aucune activité enregistrée pour le moment.</div>
        ) : filtered.map((e) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{e.action}</div>
              {e.detail && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{e.detail}</div>}
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{e.utilisateur} · {e.role}</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{new Date(e.date).toLocaleString("fr-FR")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParametresSystemePage({ data, persist, notify, onBack, offline }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef(null);
  function resetColis() {
    persist({ ...data, colis: [] });
    notify?.("Tous les colis ont été supprimés");
    setConfirmReset(false);
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ba-diaby-express-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify?.("Sauvegarde téléchargée");
  }
  function importBackup(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.users || !parsed.colis) throw new Error("format invalide");
        persist(parsed);
        notify?.("Données restaurées depuis la sauvegarde");
      } catch (err) {
        notify?.("Échec de la restauration — fichier invalide");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function exportColisCSV() {
    const headers = ["Tracking", "Statut", "Expediteur", "Destinataire", "Telephone", "Pays", "Mode", "Poids_kg", "Prix_EUR", "Paye_EUR", "Reste_EUR", "Date_creation"];
    const rows = data.colis.map((c) => [c.tracking, c.status, c.expediteur, c.destinataire, c.telephone, c.pays, c.mode, c.poids, c.prix, c.paye, c.reste, new Date(c.createdAt).toLocaleDateString("fr-FR")]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `colis-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify?.("Export CSV téléchargé");
  }

  return (
    <div>
      <ConfigPageHeader title="Paramètres Système" desc="Options avancées de la plateforme." onBack={onBack} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 460 }}>
        <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, border: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 10 }}>État du système</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Stockage : {offline ? <span style={{ color: "#E23F52" }}>hors ligne (non sauvegardé)</span> : <span style={{ color: "#3ECB84" }}>connecté</span>}</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Colis enregistrés : {data.colis.length}</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Comptes utilisateurs : {data.users.length}</div>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, border: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 10 }}>Sauvegarde &amp; export</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>Téléchargez une copie complète de vos données, ou restaurez-en une précédemment enregistrée.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button onClick={exportBackup} style={{ display: "flex", alignItems: "center", gap: 6, background: "#3D63FF", color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><Download size={13} /> Sauvegarder (JSON)</button>
            <button onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface2)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><RefreshCw size={13} /> Restaurer une sauvegarde</button>
            <input ref={fileRef} type="file" accept=".json" onChange={importBackup} style={{ display: "none" }} />
            <button onClick={exportColisCSV} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface2)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><FileStack size={13} /> Exporter les colis (CSV)</button>
          </div>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, border: "1px solid #E23F52" }}>
          <div style={{ fontWeight: 700, color: "#E23F52", fontSize: 14, marginBottom: 6 }}>Zone dangereuse</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>Supprime définitivement tous les colis enregistrés. Cette action est irréversible.</div>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} style={{ background: "none", border: "1.5px solid #E23F52", color: "#E23F52", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Réinitialiser les colis</button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={resetColis} style={{ background: "#E23F52", border: "none", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Confirmer la suppression</button>
              <button onClick={() => setConfirmReset(false)} style={{ background: "var(--surface2)", border: "none", color: "var(--muted)", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, cursor: "pointer" }}>Annuler</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UtilisateursPage({ data, persist, notify, onBack, session }) {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  function addUser(u) { persist({ ...data, users: [...data.users, u], activityLog: pushActivity(data, session, "Compte créé", `${u.prenom} ${u.nom} (${u.role})`) }); notify(`Compte créé pour ${u.prenom} ${u.nom}`); setShowForm(false); }
  function removeUser(id) {
    const u = data.users.find((x) => x.id === id);
    persist({ ...data, users: data.users.filter((u) => u.id !== id), activityLog: pushActivity(data, session, "Compte supprimé", u ? `${u.prenom} ${u.nom}` : id) });
  }
  function saveUser(updated) {
    persist({ ...data, users: data.users.map((u) => (u.id === updated.id ? updated : u)), activityLog: pushActivity(data, session, "Profil utilisateur modifié", `${updated.prenom} ${updated.nom}`) });
    notify(`Profil de ${updated.prenom} ${updated.nom} mis à jour`);
    setEditingUser(null);
  }

  if (editingUser) return <UserProfilePage user={editingUser} onSave={saveUser} onBack={() => setEditingUser(null)} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 12 }}>
        <ConfigPageHeader title="Gestion Utilisateurs" desc="Accès, rôles et permissions de l'équipe." onBack={onBack} />
        {effectivePermission(session, "users.gerer") && <button onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#E23F52", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}><Plus size={16} /> Créer un compte</button>}
      </div>
      <div style={{ background: "var(--surface)", borderRadius: 14, boxShadow: "0 2px 10px rgba(10,38,71,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "var(--surface2)", textAlign: "left" }}>{["Employé", "Identifiant", "Téléphone", "Rôle", "Destinations", "2FA", ""].map((h) => <th key={h} style={{ padding: "12px 16px", fontSize: 11.5, color: "var(--muted)", fontWeight: 700 }}>{h}</th>)}</tr></thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id} onClick={() => setEditingUser(u)} style={{ borderTop: "1px solid var(--surface2)", cursor: "pointer" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>{u.role === "Administrateur" && <Shield size={14} color="#E23F52" />} {u.prenom} {u.nom}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{u.email}</div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted)" }}>{u.identifiant}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted)" }}>{u.telephone}</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}><span style={{ background: "var(--surface2)", color: "var(--text)", padding: "4px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600 }}>{u.role}</span></td>
                <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--muted)" }}>{u.role === "Administrateur" ? "Tous les pays" : (u.paysAutorises?.length ? u.paysAutorises.map((c) => FLAGS[c]).join(" ") : "Tous les pays")}</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>{u.twoFA ? <ShieldCheck size={15} color="#3ECB84" /> : "—"}</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>{u.identifiant !== "admin" && effectivePermission(session, "users.gerer") && <button onClick={() => removeUser(u.id)} style={{ background: "none", border: "none", color: "#E23F52", cursor: "pointer" }}><Trash2 size={15} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && <UserForm onClose={() => setShowForm(false)} onSave={addUser} existing={data.users} />}
    </div>
  );
}

function UserProfilePage({ user, onSave, onBack }) {
  const [tab, setTab] = useState("profil");
  const [prenom, setPrenom] = useState(user.prenom || "");
  const [nom, setNom] = useState(user.nom || "");
  const [email, setEmail] = useState(user.email || "");
  const [telephone, setTelephone] = useState(user.telephone || "");
  const [role, setRole] = useState(user.role);
  const [paysAutorises, setPaysAutorises] = useState(user.paysAutorises || COUNTRIES.filter((c) => c.code !== "GN").map((c) => c.code));
  const [permissionsOverride, setPermissionsOverride] = useState(user.permissionsOverride || {});
  const isAdmin = role === "Administrateur";
  const totalPermCount = PERMISSIONS_SCHEMA.reduce((s, g) => s + g.permissions.length, 0);

  function toggleCountry(code) {
    setPaysAutorises((list) => (list.includes(code) ? list.filter((c) => c !== code) : [...list, code]));
  }
  function togglePermission(key) {
    const current = effectivePermission({ role, permissionsOverride }, key);
    setPermissionsOverride((o) => ({ ...o, [key]: !current }));
  }
  function toggleGroup(group, enable) {
    const next = { ...permissionsOverride };
    group.permissions.forEach((p) => { next[p.key] = enable; });
    setPermissionsOverride(next);
  }
  function save() {
    onSave({ ...user, prenom, nom, email, telephone, role, paysAutorises: isAdmin ? [] : paysAutorises, permissionsOverride: isAdmin ? {} : permissionsOverride });
  }

  return (
    <div>
      <ConfigPageHeader title="Profil utilisateur" desc="Gérez les employés, rôles et permissions de votre entreprise." onBack={onBack} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--surface2)", display: "grid", placeItems: "center", fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>ID</div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{prenom.toUpperCase()} {nom.toUpperCase()}</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)" }}>@{user.identifiant} · {email}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border)", marginBottom: 22 }}>
        <button onClick={() => setTab("profil")} style={{ background: "none", border: "none", padding: "0 0 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: tab === "profil" ? "#5B8DEF" : "var(--muted)", borderBottom: tab === "profil" ? "2px solid #5B8DEF" : "2px solid transparent", fontSize: 13.5, fontWeight: 600 }}><User size={14} /> Profil</button>
        <button onClick={() => setTab("permissions")} style={{ background: "none", border: "none", padding: "0 0 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: tab === "permissions" ? "#5B8DEF" : "var(--muted)", borderBottom: tab === "permissions" ? "2px solid #5B8DEF" : "2px solid transparent", fontSize: 13.5, fontWeight: 600 }}><Lock size={14} /> Permissions <span style={{ background: "var(--surface2)", color: "var(--muted)", borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>{totalPermCount}</span></button>
      </div>

      {tab === "profil" ? (
        <div style={{ maxWidth: 460 }}>
          <Field label="Prénom"><input value={prenom} onChange={(e) => setPrenom(e.target.value)} style={inputStyle} /></Field>
          <Field label="Nom"><input value={nom} onChange={(e) => setNom(e.target.value)} style={inputStyle} /></Field>
          <Field label="Email"><input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} /></Field>
          <Field label="Identifiant"><input value={user.identifiant} disabled style={{ ...inputStyle, opacity: 0.6 }} /></Field>
          <Field label="Téléphone"><input value={telephone} onChange={(e) => setTelephone(e.target.value)} style={inputStyle} /></Field>
          <Field label="Rôle">
            <select value={role} onChange={(e) => setRole(e.target.value)} disabled={user.identifiant === "admin"} style={inputStyle}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", margin: "18px 0 8px" }}>PAYS DE DESTINATION AUTORISÉS</div>
          {isAdmin ? (
            <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "var(--text)" }}>🌍 Tous les pays (Administrateur)</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 8, marginBottom: 8 }}>
              {COUNTRIES.filter((c) => c.code !== "GN").map((c) => (
                <label key={c.code} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface2)", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 12.5, color: "var(--text)" }}>
                  <input type="checkbox" checked={paysAutorises.includes(c.code)} onChange={() => toggleCountry(c.code)} />
                  {FLAGS[c.code]} {c.name}
                </label>
              ))}
            </div>
          )}
          {!isAdmin && paysAutorises.length === 0 && <div style={{ fontSize: 11.5, color: "#E0A63A", marginBottom: 8 }}>Aucun pays coché = accès à tous les pays par défaut.</div>}

          <button onClick={save} style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8, background: "#3D63FF", color: "#fff", border: "none", borderRadius: 9, padding: "11px 22px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            Enregistrer
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: 560 }}>
          {isAdmin ? (
            <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "var(--text)", marginBottom: 16 }}>🔓 Accès complet — les administrateurs disposent automatiquement de toutes les permissions.</div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
              Permissions héritées du rôle <strong style={{ color: "var(--text)" }}>{role}</strong>. Les modifications individuelles sont marquées d'un point <span style={{ color: "#5B8DEF" }}>●</span>.
            </div>
          )}
          {PERMISSIONS_SCHEMA.map((g) => {
            const enabledCount = g.permissions.filter((p) => effectivePermission({ role, permissionsOverride }, p.key)).length;
            return (
              <div key={g.group} style={{ border: "1px solid var(--border)", borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", background: "var(--surface2)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.5 }}>{g.group}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{enabledCount}/{g.permissions.length}</span>
                    {!isAdmin && (
                      <button onClick={() => toggleGroup(g, enabledCount < g.permissions.length)} style={{ width: 38, height: 22, borderRadius: 20, border: "none", background: enabledCount === g.permissions.length ? "#3ECB84" : "var(--surface)", position: "relative", cursor: "pointer", flexShrink: 0 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: enabledCount === g.permissions.length ? 19 : 3, transition: "left 0.15s" }} />
                      </button>
                    )}
                  </div>
                </div>
                {g.permissions.map((p) => {
                  const on = isAdmin ? true : effectivePermission({ role, permissionsOverride }, p.key);
                  const overridden = !isAdmin && permissionsOverride && Object.prototype.hasOwnProperty.call(permissionsOverride, p.key) && permissionsOverride[p.key] !== (ROLE_DEFAULT_PERMISSIONS[role] || []).includes(p.key);
                  return (
                    <div key={p.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>{p.label} {overridden && <span style={{ color: "#5B8DEF", fontSize: 16, lineHeight: 0 }}>●</span>}</div>
                      <button onClick={() => !isAdmin && togglePermission(p.key)} disabled={isAdmin} style={{ width: 38, height: 22, borderRadius: 20, border: "none", background: on ? "#3ECB84" : "var(--surface2)", position: "relative", cursor: isAdmin ? "default" : "pointer", flexShrink: 0, opacity: isAdmin ? 0.6 : 1 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: on ? 19 : 3, transition: "left 0.15s" }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {!isAdmin && (
            <button onClick={save} style={{ display: "flex", alignItems: "center", gap: 8, background: "#3D63FF", color: "#fff", border: "none", borderRadius: 9, padding: "11px 22px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
              Enregistrer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function UserForm({ onClose, onSave, existing }) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [identifiant, setIdentifiant] = useState("");
  const [motdepasse, setMotdepasse] = useState("");
  const [role, setRole] = useState("Agent");
  const [twoFA, setTwoFA] = useState(false);
  const [paysAutorises, setPaysAutorises] = useState(COUNTRIES.filter((c) => c.code !== "GN").map((c) => c.code));
  const [err, setErr] = useState("");
  function toggleCountry(code) {
    setPaysAutorises((list) => (list.includes(code) ? list.filter((c) => c !== code) : [...list, code]));
  }
  function submit(e) {
    e.preventDefault();
    if (!prenom || !nom || !email || !telephone || !identifiant || !motdepasse) { setErr("Merci de renseigner tous les champs."); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr("Adresse email invalide."); return; }
    if (existing.some((u) => u.identifiant === identifiant.trim())) { setErr("Cet identifiant existe déjà."); return; }
    onSave({ id: `u${Date.now()}`, prenom, nom, email: email.trim(), telephone, identifiant: identifiant.trim(), motdepasse: hash(motdepasse), role, twoFA, paysAutorises: role === "Administrateur" ? [] : paysAutorises });
  }
  return (
    <Modal onClose={onClose} title="Créer un compte utilisateur">
      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <Field label="Prénom"><input value={prenom} onChange={(e) => setPrenom(e.target.value)} style={inputStyle} /></Field>
        <Field label="Nom"><input value={nom} onChange={(e) => setNom(e.target.value)} style={inputStyle} /></Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Adresse email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="nom@badiaby-express.com" /></Field>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Numéro de téléphone"><input value={telephone} onChange={(e) => setTelephone(e.target.value)} style={inputStyle} placeholder="+224…" /></Field>
        </div>
        <Field label="Identifiant"><input value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} style={inputStyle} /></Field>
        <Field label="Mot de passe"><input type="password" value={motdepasse} onChange={(e) => setMotdepasse(e.target.value)} style={inputStyle} /></Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Rôle"><select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
        </div>
        {role !== "Administrateur" && (
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Pays de destination autorisés</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8, marginBottom: 8 }}>
              {COUNTRIES.filter((c) => c.code !== "GN").map((c) => (
                <label key={c.code} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface2)", borderRadius: 8, padding: "6px 9px", cursor: "pointer", fontSize: 12, color: "var(--text)" }}>
                  <input type="checkbox" checked={paysAutorises.includes(c.code)} onChange={() => toggleCountry(c.code)} />
                  {FLAGS[c.code]} {c.name}
                </label>
              ))}
            </div>
          </div>
        )}
        <label style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)", margin: "-6px 0 8px", cursor: "pointer" }}>
          <input type="checkbox" checked={twoFA} onChange={(e) => setTwoFA(e.target.checked)} /> Activer la double authentification (démo)
        </label>
        {err && <div style={{ gridColumn: "1 / -1", color: "#E23F52", fontSize: 12.5, marginBottom: 4 }}>{err}</div>}
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" onClick={onClose} style={{ padding: "10px 18px", borderRadius: 9, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--muted)", fontSize: 13.5, cursor: "pointer" }}>Annuler</button>
          <button type="submit" style={{ padding: "10px 18px", borderRadius: 9, border: "none", background: "#E23F52", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Créer le compte</button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,7,14,0.65)", display: "grid", placeItems: "center", zIndex: 50, padding: 12 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, width: wide ? "min(94vw, 620px)" : "min(94vw, 420px)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 17, color: TEXT }}>{title}</div>
          <button onClick={onClose} style={{ background: SURFACE2, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}><X size={15} color={MUTED} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("Ba-Diaby Express — erreur interceptée:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--surface2)", fontFamily: "'Inter',sans-serif", padding: 24 }}>
          <div style={{ background: "var(--surface)", borderRadius: 16, padding: 28, maxWidth: 420, boxShadow: "0 24px 60px rgba(10,38,71,0.2)" }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: "#E23F52", marginBottom: 8 }}>Une erreur est survenue</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>L'application a rencontré un problème inattendu. Détail technique :</div>
            <div style={{ background: "var(--surface2)", borderRadius: 8, padding: 12, fontSize: 12, color: "var(--text)", fontFamily: "monospace", marginBottom: 16, wordBreak: "break-word" }}>{String(this.state.error?.message || this.state.error)}</div>
            <button onClick={() => this.setState({ error: null })} style={{ width: "100%", background: "#E23F52", color: "#fff", border: "none", borderRadius: 9, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Réessayer</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AppWithBoundary() {
  return <ErrorBoundary><App /></ErrorBoundary>;
}
