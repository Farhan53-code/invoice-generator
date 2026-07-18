import React, { useState, useEffect, useRef } from "react";
import { auth } from "../utils/firebase";
import { 
  Shield, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  FileText, 
  PieChart, 
  DollarSign, 
  Calendar, 
  Check, 
  ChevronDown, 
  ChevronRight,
  Sun,
  Moon,
  Globe,
  Activity,
  UserCheck,
  Coins,
  Info,
  Mail,
  FileSignature,
  BookOpen,
  LayoutDashboard
} from "lucide-react";

// List of supported languages
const LANGUAGES = [
  { code: "en", name: "English", dir: "ltr" },
  { code: "ur", name: "اردو (Urdu)", dir: "rtl" },
  { code: "es", name: "Español (Spanish)", dir: "ltr" },
  { code: "de", name: "Deutsch (German)", dir: "ltr" },
  { code: "ar", name: "العربية (Arabic)", dir: "rtl" }
];

const TRANSLATIONS: Record<string, any> = {
  en: {
    heroBadge: "Secura SaaS Suite 1.0 Live",
    heroTitle: "The stark duet of absolute security and raw productivity.",
    heroDesc: "Welcome to Secura (LifeHub AI). Manage your passwords, generate freelance invoices, track budgets, log transactions, and schedule expiry reminders inside one world-class, premium SaaS dashboard.",
    btnTrial: "Start Free",
    btnLogIn: "Login Session",
    btnConsole: "Start Free",
    trustedBy: "TRUSTED BY FREELANCERS & ENGINEERS WORLDWIDE",
    fiveWorkspaces: "5 INTEGRATED WORKSPACES",
    oneUnified: "One unified dashboard. Every tool you need.",
    eliminateNoise: "Eliminate tab noise. Tap a tab below to preview each highly optimized SaaS workspace live.",
    workspacePreview: "LIVE WORKSPACE PREVIEW",
    pricingHeader: "PRICING STRUCTURE",
    pricingTitle: "Fair pricing. Unlimited potential.",
    pricingDesc: "Unlock absolute, zero-knowledge storage limits. Start free and scale up whenever you are ready.",
    freePlan: "Free Plan",
    freeStarter: "STARTER",
    freePrice: "$0",
    freeFreq: "/ forever free",
    freeItem1: "Up to 15 Encrypted Passwords",
    freeItem2: "Up to 5 Freelance Invoices",
    freeItem3: "1 Expense & Budget Goal tracker",
    freeItem4: "Standard Audit Activity log",
    btnSignUp: "Sign Up Now",
    proPlan: "Pro Subscription",
    proPremium: "PREMIUM",
    proPrice: "$10",
    proFreq: "/ user monthly",
    proItem1: "Unlimited secure password records",
    proItem2: "Unlimited invoices & Client PDFs",
    proItem3: "Unlimited budget goals & dynamic tracking",
    proItem4: "Live Expiry Countdown reminders",
    proItem5: "Priority Server Support SLA",
    btnUpgrade: "Upgrade to Premium",
    faqHeader: "SECURITY & PRODUCTIVITY FAQS",
    faqTitle: "Frequently Asked Questions",
    ctaTitle: "Streamline your digital vault today.",
    ctaDesc: "Join thousands of modern developers, designers, and freelancers who rely on Secura to securely protect credentials and log operational workflows seamlessly.",
    ctaBtn: "Get Started For Free",
  },
  ur: {
    heroBadge: "سیکیورا ساس سویٹ 1.0 لائیو",
    heroTitle: "مستحکم سیکیورٹی اور بے مثال پیداواری صلاحیت کا خوبصورت امتزاج",
    heroDesc: "سیکیورا (Secura) میں خوش آمدید۔ اپنے پاس ورڈز محفوظ کریں، فری لانس انوائسز بنائیں، بجٹ مینیج کریں، اخراجات ٹریک کریں، اور اپنے اہم دستاویزات کی تاریخِ میعاد کے ريمائنڈرز حاصل کریں۔",
    btnTrial: "مفت شروع کریں",
    btnLogIn: "لاگ ان سیشن",
    btnConsole: "مفت شروع کریں",
    trustedBy: "دنیا بھر کے فری لانسرز اور ڈویلپرز کا بھروسہ",
    fiveWorkspaces: "5 مربوط ٹولز",
    oneUnified: "ایک ہی ڈیش بورڈ۔ ہر وہ ٹول جس کی آپ کو ضرورت ہے۔",
    eliminateNoise: "ٹیبز کی بھیڑ ختم کریں۔ نیچے دیے گئے ٹیبز پر کلک کر کے لائیو ڈیمو دیکھیں۔",
    workspacePreview: "لائیو ورک اسپیس ڈیمو",
    pricingHeader: "مناسب قیمتیں",
    pricingTitle: "مناسب قیمتیں۔ لامحدود امکانات۔",
    pricingDesc: "محفوظ ترین سٹوریج کی تمام خصوصیات تک رسائی حاصل کریں۔ مفت شروع کریں اور جب چاہیں اپ گریڈ کریں۔",
    freePlan: "مفت پلان",
    freeStarter: "سٹارٹر",
    freePrice: "$0",
    freeFreq: "/ ہمیشہ کے لیے مفت",
    freeItem1: "15 تک انکرپٹڈ پاس ورڈز",
    freeItem2: "5 تک فری لانس انوائسز",
    freeItem3: "بجٹ اور اخراجات کا ٹریکر",
    freeItem4: "سیکیورٹی لاگز اور سرگرمیاں",
    btnSignUp: "ابھی سائن اپ کریں",
    proPlan: "پرو سبسکرپشن",
    proPremium: "پریمیم",
    proPrice: "$10",
    proFreq: "/ ماہانہ صارف",
    proItem1: "لامحدود محفوظ پاس ورڈ ریکارڈز",
    proItem2: "لامحدود انوائسز اور پی ڈی ایف ڈاؤن لوڈز",
    proItem3: "لامحدود بجٹ اور اخراجات کے اہداف",
    proItem4: "دستاویزات کی تاریخِ میعاد کے لائیو کاؤنٹ ڈاؤنز",
    proItem5: "ترجیحی سپورٹ اور کسمٹر سروس",
    btnUpgrade: "پریمیم پر اپ گریڈ کریں",
    faqHeader: "سیکیورٹی اور ٹولز کے متعلق سوالات",
    faqTitle: "اکثر پوچھے جانے والے سوالات",
    ctaTitle: "آج ہی اپنے ڈیجیٹل اثاثوں کو محفوظ بنائیں۔",
    ctaDesc: "ہزاروں جدید ڈویلپرز اور فری لانسرز میں شامل ہوں جو سیکیورا پر بھروسہ کرتے ہیں۔",
    ctaBtn: "مفت میں شروع کریں",
  },
  es: {
    heroBadge: "Secura SaaS Suite 1.0 En Vivo",
    heroTitle: "El dúo perfecto de seguridad absoluta y alta productividad.",
    heroDesc: "Bienvenido a Secura (LifeHub AI). Administre sus contraseñas, genere facturas para clientes, planifique presupuestos, registre gastos y configure recordatorios de vencimiento en un único panel de control premium.",
    btnTrial: "Comenzar Gratis",
    btnLogIn: "Iniciar Sesión",
    btnConsole: "Comenzar Gratis",
    trustedBy: "CONFIADO POR FREELANCERS Y INGENIEROS EN TODO EL MUNDO",
    fiveWorkspaces: "5 ÁREAS DE TRABAJO INTEGRADAS",
    oneUnified: "Un panel unificado. Cada herramienta que necesita.",
    eliminateNoise: "Elimine el ruido de las pestañas. Toque una pestaña a continuación para previsualizar cada espacio de trabajo en vivo.",
    workspacePreview: "VISTA PREVIA EN VIVO",
    pricingHeader: "ESTRUCTURA DE PRECIOS",
    pricingTitle: "Precios justos. Potencial ilimitado.",
    pricingDesc: "Desbloquee límites de almacenamiento seguros de conocimiento cero. Comience gratis y escale cuando esté listo.",
    freePlan: "Plan Gratuito",
    freeStarter: "INICIACIÓN",
    freePrice: "$0",
    freeFreq: "/ gratis para siempre",
    freeItem1: "Hasta 15 contraseñas cifradas",
    freeItem2: "Hasta 5 facturas para clientes",
    freeItem3: "1 rastreador de presupuesto y gastos",
    freeItem4: "Registro estándar de auditoría",
    btnSignUp: "Regístrese Ahora",
    proPlan: "Suscripción Pro",
    proPremium: "PREMIUM",
    proPrice: "$10",
    proFreq: "/ usuario al mes",
    proItem1: "Registros de contraseña ilimitados",
    proItem2: "Facturas y PDFs de clientes ilimitados",
    proItem3: "Metas de presupuesto ilimitadas",
    proItem4: "Recordatorios de cuenta regresiva en vivo",
    proItem5: "Soporte prioritario con acuerdo de nivel de servicio",
    btnUpgrade: "Actualizar a Premium",
    faqHeader: "PREGUNTAS FRECUENTES",
    faqTitle: "Preguntas Frecuentes",
    ctaTitle: "Optimice su bóveda digital hoy mismo.",
    ctaDesc: "Únase a miles de desarrolladores, diseñadores y autónomos modernos que confían en Secura para proteger sus credenciales de forma segura.",
    ctaBtn: "Comenzar Gratis",
  },
  de: {
    heroBadge: "Secura SaaS Suite 1.0 Live",
    heroTitle: "Das perfekte Zusammenspiel aus absoluter Sicherheit und Produktivität.",
    heroDesc: "Willkommen bei Secura (LifeHub AI). Verwalten Sie Ihre Passwörter, erstellen Sie Kundenrechnungen, planen Sie Budgets, protokollieren Sie Ausgaben und richten Sie Ablaufwarnungen in einem einzigen Premium-Dashboard ein.",
    btnTrial: "Kostenlos starten",
    btnLogIn: "Einloggen",
    btnConsole: "Kostenlos starten",
    trustedBy: "WELTWEIT VON FREELANCERN & ENTWICKLERN GESCHÄTZT",
    fiveWorkspaces: "5 INTEGRIERTE MODULE",
    oneUnified: "Ein einziges Dashboard. Alle Tools, die Sie brauchen.",
    eliminateNoise: "Schluss mit dem Tab-Chaos. Klicken Sie unten auf ein Modul, um eine Live-Vorschau anzuzeigen.",
    workspacePreview: "LIVE-VORSCHAU",
    pricingHeader: "PREISSTRUKTUR",
    pricingTitle: "Faire Preise. Unbegrenztes Potenzial.",
    pricingDesc: "Schalten Sie unbegrenzten Zero-Knowledge-Speicher frei. Starten Sie kostenlos und skalieren Sie flexibel.",
    freePlan: "Kostenloser Plan",
    freeStarter: "STARTER",
    freePrice: "0 €",
    freeFreq: "/ dauerhaft kostenlos",
    freeItem1: "Bis zu 15 verschlüsselte Passwörter",
    freeItem2: "Bis zu 5 Kundenrechnungen",
    freeItem3: "1 Budget- und Ausgaben-Tracker",
    freeItem4: "Standard-Sicherheitsprotokolle",
    btnSignUp: "Jetzt registrieren",
    proPlan: "Pro-Abonnement",
    proPremium: "PREMIUM",
    proPrice: "10 €",
    proFreq: "/ Monat pro Nutzer",
    proItem1: "Unbegrenzte sichere Passwörter",
    proItem2: "Unbegrenzte Rechnungen & PDFs",
    proItem3: "Unbegrenzte Budgetziele & Tracker",
    proItem4: "Live-Ablauf-Countdown-Warnungen",
    proItem5: "Priorisierter Kundensupport (SLA)",
    btnUpgrade: "Auf Pro upgraden",
    faqHeader: "HÄUFIG GESTELLTE FRAGEN",
    faqTitle: "Fragen & Antworten",
    ctaTitle: "Sichern Sie Ihren digitalen Tresor noch heute.",
    ctaDesc: "Schließen Sie sich Tausenden von Entwicklern, Designern und Freelancern an, die Secura für ihre sensiblen Workflows nutzen.",
    ctaBtn: "Kostenlos starten",
  },
  ar: {
    heroBadge: "سيكيورا SaaS إصدار 1.0 نشط الآن",
    heroTitle: "مزيج فريد من الأمان المطلق والإنتاجية الفائقة.",
    heroDesc: "مرحبًا بك في سيكيورا (Secura). قم بإدارة كلمات المرور الخاصة بك، وإنشاء فواتير العمل الحر، وتتبع الميزانيات، وتسجيل النفقات، وجدولة تذكيرات انتهاء الصلاحية، كل ذلك في لوحة تشغيل متميزة.",
    btnTrial: "ابدأ مجانًا",
    btnLogIn: "تسجيل الدخول",
    btnConsole: "لوحة التحكم الموحدة",
    trustedBy: "موثوق به من قبل المستقلين والمهندسين في جميع أنحاء العالم",
    fiveWorkspaces: "5 بيئات عمل متكاملة",
    oneUnified: "لوحة تحكم واحدة موحدة لجميع أدواتك.",
    eliminateNoise: "تخلص من تشتت علامات التبويب المتعددة. اضغط على أي أداة لمشاهدة عرض توضيحي حي ومباشر.",
    workspacePreview: "معاينة حية ومباشرة لبيئة العمل",
    pricingHeader: "هيكل الأسعار",
    pricingTitle: "أسعار عادلة. إمكانات غير محدودة.",
    pricingDesc: "افتح حدود تخزين آمنة ذات معرفة صفرية بالكامل. ابدأ مجانًا ورقّي حسابك عندما تصبح مستعدًا.",
    freePlan: "الخطة المجانية",
    freeStarter: "البداية",
    freePrice: "sh",
    freeFreq: "/ مجاني للأبد",
    freeItem1: "حفظ ما يصل إلى 15 كلمة مرور مشفرة",
    freeItem2: "إنشاء ما يصل إلى 5 فواتير مستقلة",
    freeItem3: "تتبع ميزانية واحدة ومصروفات متكاملة",
    freeItem4: "سجل أنشطة وتدقيق قياسي",
    btnSignUp: "سجل حسابك الآن",
    proPlan: "الاشتراك المتقدم",
    proPremium: "مميز",
    proPrice: "0",
    proFreq: "/ للمستخدم شهريًا",
    proItem1: "حفظ غير محدود لكلمات المرور المشفرة",
    proItem2: "فواتير وملفات PDF للعملاء غير محدودة",
    proItem3: "أهداف ميزانية وتتبع ديناميكي غير محدود",
    proItem4: "تنبيهات العد التنازلي المباشرة لانتهاء الصلاحية",
    proItem5: "دعم فني ذو أولوية فائقة",
    btnUpgrade: "الترقية للاشتراك المميز",
    faqHeader: "الأسئلة الشائعة حول الأمان والإنتاجية",
    faqTitle: "الأسئلة الشائعة",
    ctaTitle: "قم بتبسيط وحماية خزنتك الرقمية اليوم.",
    ctaDesc: "انضم إلى آلاف المطورين والمصممين والمستقلين العصريين الذين يعتمدون على سيكيورا لحماية بياناتهم الحساسة.",
    ctaBtn: "ابدأ الآن مجانًا",
  }
};

function CyberDragonBackground() {
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [scanPosition, setScanPosition] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let columns = Math.floor(canvas.width / 20) || 25;
    let yPositions = Array(columns).fill(0).map(() => Math.random() * -100);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width || parent.clientWidth || window.innerWidth;
        canvas.height = height || parent.clientHeight || 600;

        // Recalculate columns based on new width
        columns = Math.floor(canvas.width / 20) || 25;
        yPositions = Array(columns).fill(0).map(() => Math.random() * -150);
      }
    });

    resizeObserver.observe(parent);

    const drawMatrix = () => {
      // Draw semi-transparent background to create trail effect
      ctx.fillStyle = "rgba(10, 10, 12, 0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = "bold 11px monospace";

      for (let i = 0; i < yPositions.length; i++) {
        // High-fidelity binary cyber rain
        const text = Math.random() > 0.55 ? "1" : "0";
        const x = i * 20;
        const y = yPositions[i];

        // Draw character with glowing cyberpunk matrix colors
        const isCyan = Math.random() > 0.35;
        ctx.fillStyle = isCyan ? "rgba(6, 182, 212, 0.75)" : "rgba(99, 102, 241, 0.8)";
        ctx.fillText(text, x, y);

        // Reset drop position or increment
        if (y > canvas.height && Math.random() > 0.975) {
          yPositions[i] = -20;
        } else {
          yPositions[i] += 16; // Rain drip speed
        }
      }
    };

    const renderLoop = () => {
      drawMatrix();
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    const logs = [
      "SYSTEM: INITIATING SECURE BOOT PROTOCOL...",
      "MODULE: ZERO-KNOWLEDGE CRYPTO VAULT ACTIVE",
      "SERVER: CONNECTED TO SECURE SECURA NODE",
      "SECURITY: INTRUSION DETECTION SENSORS ONLINE",
      "STATUS: DECRYPTING INVOICE COMPILE PIPELINE",
      "GEOLOCATION: AUTO-IP DISCOVERY INITIALIZED",
      "STATUS: SECURASHIELD OPERATIONAL [READY]"
    ];

    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < logs.length) {
        setBootLogs(prev => [...prev, logs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 600);

    const scanInterval = setInterval(() => {
      setScanPosition(prev => (prev >= 100 ? 0 : prev + 0.5));
    }, 16);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      clearInterval(logInterval);
      clearInterval(scanInterval);
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-neutral-950 overflow-hidden -z-10 select-none">
      <style>{`
        @keyframes drawCyberPath {
          0% {
            stroke-dashoffset: 1200;
            opacity: 0.15;
          }
          50% {
            opacity: 0.85;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
        @keyframes cyberPulse {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.5)) drop-shadow(0 0 15px rgba(6, 182, 212, 0.2));
            opacity: 0.85;
          }
          50% {
            filter: drop-shadow(0 0 18px rgba(99, 102, 241, 0.85)) drop-shadow(0 0 30px rgba(99, 102, 241, 0.35));
            opacity: 1;
          }
        }
        @keyframes rotateHUD {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes rotateHUDCounter {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        .cyber-dragon-path {
          stroke-dasharray: 1200;
          stroke-dashoffset: 1200;
          animation: drawCyberPath 5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards, cyberPulse 4s ease-in-out infinite;
        }
        .hud-rotate-clockwise {
          animation: rotateHUD 28s linear infinite;
        }
        .hud-rotate-counter {
          animation: rotateHUDCounter 18s linear infinite;
        }
      `}</style>

      {/* Matrix background canvas - increased opacity to 55% for beautiful, rich rain */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-55" />

      {/* Cyber grid overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-neutral-950" />
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/40 to-neutral-950" />

      {/* Futuristic central Dragon HUD loader - increased overall opacity */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[480px] h-[320px] sm:h-[480px] flex items-center justify-center pointer-events-none opacity-85 sm:opacity-95">
        
        {/* HUD Outer Ring */}
        <div className="absolute w-[280px] sm:w-[420px] h-[280px] sm:h-[420px] border border-dashed border-cyan-400/25 rounded-full hud-rotate-clockwise flex items-center justify-center">
          <div className="absolute -top-1 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]" />
          <div className="absolute -bottom-1 w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]" />
        </div>

        {/* HUD Inner ring */}
        <div className="absolute w-[210px] sm:w-[340px] h-[210px] sm:h-[340px] border border-indigo-400/20 rounded-full hud-rotate-counter flex items-center justify-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-cyan-400/50 rounded-full" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-indigo-400/50 rounded-full" />
        </div>

        {/* Scanning laser line - brighter and more prominent */}
        <div 
          className="absolute left-0 right-0 h-[2.5px] bg-cyan-400 shadow-[0_0_12px_#06b6d4] opacity-80 transition-all duration-75"
          style={{ top: `${scanPosition}%` }}
        />

        {/* Geometric cyber dragon outline */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-[180px] sm:w-[270px] h-[180px] sm:h-[270px] relative z-10"
        >
          <path
            className="cyber-dragon-path"
            fill="none"
            stroke="url(#cyber-grad-glow)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="
              M 50 15 
              L 53 22 L 50 25 L 47 22 Z
              M 50 25 L 50 45
              M 50 25 L 58 30 L 55 35 L 50 32
              M 50 25 L 42 30 L 45 35 L 50 32
              
              M 58 30 L 66 22 L 63 35 L 55 35
              M 42 30 L 34 22 L 37 35 L 45 35

              M 63 35 L 75 30 L 70 42 L 58 38
              M 37 35 L 25 30 L 30 42 L 42 38

              M 70 42 L 82 40 L 74 52 L 63 48
              M 30 42 L 18 40 L 26 52 L 37 48

              M 74 52 L 85 58 L 72 65 L 63 58
              M 26 52 L 15 58 L 28 65 L 37 58

              M 63 58 L 50 72 L 37 58
              M 50 45 L 55 52 L 50 58 L 45 52 Z

              M 50 58 L 50 85 L 47 88 L 50 92 L 53 88 L 50 85
              M 50 72 L 58 78 L 50 85
              M 50 72 L 42 78 L 50 85
            "
          />
          <circle cx="46" cy="40" r="1.5" fill="#22d3ee" className="animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <circle cx="54" cy="40" r="1.5" fill="#22d3ee" className="animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <defs>
            <linearGradient id="cyber-grad-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>

      </div>

      {/* Floating shell logs */}
      <div className="absolute bottom-4 left-4 text-left font-mono text-[9px] text-cyan-400/80 leading-normal hidden md:flex flex-col gap-0.5 max-w-[240px] p-2.5 bg-neutral-950/90 border border-cyan-500/30 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.15)]">
        <div className="flex items-center gap-1.5 border-b border-cyan-500/20 pb-1 mb-1 text-cyan-400 font-bold uppercase tracking-wider text-[8px]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
          <span>SECURA OS v1.0 INITIALIZED</span>
        </div>
        {bootLogs.map((log, idx) => (
          <div key={idx} className="truncate">
            <span className="text-indigo-400">&gt; </span>{log}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingApp() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [faqOpen, setFaqOpen] = useState<Record<string, boolean>>({});
  const [langMenuOpen, setLangMenuOpen] = useState<boolean>(false);
  
  // Localized state: default to "en"
  const [currentLang, setCurrentLang] = useState<string>("en");

  useEffect(() => {
    // 1. Check Auth State
    const unsub = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    // 2. Automatic Language Detection based on Country/Browser locale!
    try {
      const browserLang = (navigator.language || (navigator as any).userLanguage || "en").toLowerCase();
      if (browserLang.startsWith("ur") || browserLang.startsWith("pk")) {
        setCurrentLang("ur");
      } else if (browserLang.startsWith("hi") || browserLang.startsWith("in")) {
        setCurrentLang("ur"); // Show Urdu/Hindi translation
      } else if (browserLang.startsWith("es")) {
        setCurrentLang("es");
      } else if (browserLang.startsWith("de")) {
        setCurrentLang("de");
      } else if (browserLang.startsWith("ar")) {
        setCurrentLang("ar");
      } else {
        // Fallback to saved selection if present
        const savedLang = localStorage.getItem("secura_lang");
        if (savedLang && TRANSLATIONS[savedLang]) {
          setCurrentLang(savedLang);
        }
      }
    } catch (e) {
      console.warn("Language auto-detection failed, using English default:", e);
    }

    return () => unsub();
  }, []);

  const handleLangChange = (code: string) => {
    setCurrentLang(code);
    localStorage.setItem("secura_lang", code);
    setLangMenuOpen(false);
  };

  const toggleFaq = (id: string) => {
    setFaqOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Safe translation retriever
  const t = (key: string): string => {
    const langDict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    return langDict[key] || TRANSLATIONS.en[key] || "";
  };

  // Get active language properties
  const activeLangConfig = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];
  const isRtl = activeLangConfig.dir === "rtl";

  const interactiveFeatures = [
    {
      title: "Zero-Knowledge Vault",
      subtitle: "AES-GCM Local Cryptography",
      icon: Lock,
      badge: "MILITARY-GRADE",
      color: "from-blue-500 to-cyan-400",
      preview: (
        <div className="bg-neutral-900 text-neutral-100 p-5 rounded-xl border border-neutral-800 font-mono text-[11px] flex flex-col gap-3.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-1.5 text-neutral-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <span className="text-neutral-500 text-[10px]">LOCAL ENCRYPTION SESSION</span>
          </div>
          <div>
            <p className="text-neutral-400">// RAW PLAIN DATA</p>
            <p className="text-green-400">master_key: "fa3327392_secret"</p>
          </div>
          <div className="border-t border-neutral-800 pt-2.5">
            <p className="text-neutral-400">// AES-256 ENCRYPTED IN BROWSER</p>
            <p className="text-cyan-400 leading-relaxed truncate">hash: "U2FsdGVkX1+z7K...wVp9M8A=="</p>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-neutral-500 pt-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Secured locally. Zero data leaks, ever.</span>
          </div>
        </div>
      )
    },
    {
      title: "Invoice Generator",
      subtitle: "Freelance Invoicing Pipeline",
      icon: FileText,
      badge: "SAAS EXPORT",
      color: "from-indigo-600 to-purple-500",
      preview: (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl shadow-xl text-xs flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-neutral-800 dark:text-neutral-100">Secura Technologies</p>
              <p className="text-[10px] text-neutral-400">Invoice #INV-2026-004</p>
            </div>
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-semibold rounded text-[10px]">PAID</span>
          </div>
          <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-2 flex flex-col gap-1.5">
            <div className="flex justify-between text-neutral-400 text-[10px]">
              <span>Description</span>
              <span>Amount</span>
            </div>
            <div className="flex justify-between text-neutral-700 dark:text-neutral-350">
              <span>Cloud Consulting (40 hrs)</span>
              <span>$4,800.00</span>
            </div>
            <div className="flex justify-between text-neutral-700 dark:text-neutral-350">
              <span>API Gateway Implementation</span>
              <span>$1,200.00</span>
            </div>
          </div>
          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2.5 flex justify-between font-bold text-neutral-800 dark:text-neutral-100 text-[13px]">
            <span>Total Amount Due</span>
            <span>$6,000.00</span>
          </div>
        </div>
      )
    },
    {
      title: "Budget Planner",
      subtitle: "Relational Spending Limits",
      icon: PieChart,
      badge: "REAL-TIME SYNC",
      color: "from-pink-500 to-rose-400",
      preview: (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl shadow-xl text-xs flex flex-col gap-3.5">
          <div className="flex justify-between items-center">
            <span className="font-bold text-neutral-800 dark:text-neutral-200">Server Hosting Goal</span>
            <span className="text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400">MONTHLY</span>
          </div>
          <div className="flex justify-between text-[11px] text-neutral-500">
            <span>Limit: $1,500</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-100">Spent: $1,120</span>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full w-[74%]" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-neutral-400">
            <span>74.6% budget threshold reached</span>
            <span className="text-amber-500 font-semibold">Caution Warning</span>
          </div>
        </div>
      )
    },
    {
      title: "Expense Tracker",
      subtitle: "Personal Transaction Logging",
      icon: DollarSign,
      badge: "DURABLE CRUD",
      color: "from-emerald-500 to-teal-400",
      preview: (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl shadow-xl text-xs flex flex-col gap-2.5">
          <p className="font-bold text-neutral-800 dark:text-neutral-200">Recent Transactions</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-all">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center rounded-lg font-bold text-[10px]">AWS</div>
                <div>
                  <p className="font-semibold">VPC Ingress Fee</p>
                  <p className="text-[9px] text-neutral-400 font-mono">17 Jul 2026</p>
                </div>
              </div>
              <span className="font-mono font-bold text-red-500">-$45.20</span>
            </div>
            <div className="flex items-center justify-between p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-all">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center rounded-lg font-bold text-[10px]">PAY</div>
                <div>
                  <p className="font-semibold">Freelance Payout</p>
                  <p className="text-[9px] text-neutral-400 font-mono">15 Jul 2026</p>
                </div>
              </div>
              <span className="font-mono font-bold text-green-500">+$2,400.00</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Document Expiry",
      subtitle: "Secure Passport & Visa Countdown",
      icon: Calendar,
      badge: "LIVE COUNTDOWN",
      color: "from-red-500 to-orange-400",
      preview: (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl shadow-xl text-xs flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-neutral-800 dark:text-neutral-200">Schengen Business Visa</p>
              <p className="text-[10px] text-neutral-400 font-mono">Number: DE923812X</p>
            </div>
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-semibold rounded text-[10px]">CRITICAL</span>
          </div>
          <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-3 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase font-mono tracking-wider text-neutral-400">Countdown Duration</p>
              <p className="font-black text-red-600 dark:text-red-400 text-lg">14 Days Left</p>
            </div>
            <span className="text-red-500 animate-pulse text-[11px] font-bold">Renew now</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* STICKY TOP BRANDED NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-neutral-950/85 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-850/60 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-16 transition-all duration-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-center shrink-0 p-1">
            <img 
              src="/favicon.svg" 
              alt="Secura Logo" 
              className="w-6.5 h-6.5 object-contain" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/favicon-96x96.png';
              }}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-widest text-neutral-950 dark:text-white font-mono">SECURA</span>
              <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-neutral-900 text-indigo-600 dark:text-neutral-400 border border-indigo-100/30 dark:border-neutral-800 rounded text-[8px] font-mono font-bold uppercase tracking-widest">
                SaaS
              </span>
            </div>
          </div>
        </div>

        {/* Action Options: Login, Register, and Country Language Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          
          {/* Country / Auto-Language selector */}
          <div className="relative">
            <button 
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="h-8.5 px-3 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-neutral-400" />
              <span>{activeLangConfig.name}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
            </button>
            
            {langMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setLangMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-1.5 z-40 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest px-3 py-1 border-b border-neutral-100 dark:border-neutral-850 mb-1 font-bold">Select Language</p>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLangChange(lang.code)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer ${currentLang === lang.code ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-neutral-700 dark:text-neutral-300"}`}
                    >
                      <span>{lang.name}</span>
                      {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Login or Console navigation options */}
          {user ? (
            <a 
              href="/dashboard"
              className="h-9 px-4.5 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-black font-semibold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-all shadow-sm"
            >
              <span>{t("btnConsole")}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <a 
                href="/login"
                className="h-9 px-3.5 rounded-full text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white font-semibold text-xs flex items-center justify-center transition-all"
              >
                {t("btnLogIn")}
              </a>
              <a 
                href="/register"
                className="h-9 px-4 sm:px-4.5 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-white text-white dark:text-black dark:hover:bg-neutral-100 font-semibold text-xs flex items-center justify-center transition-all shadow-sm"
              >
                {t("btnTrial")}
              </a>
            </div>
          )}
        </div>
      </header>

      {/* 1. HERO SECTION WITH PULSATING ATMOSPHERIC MESH GRADIENT & ANIMATED DRAGON LOADER */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 px-4 sm:px-6 lg:px-16 text-center bg-neutral-950 min-h-[500px] sm:min-h-[600px] flex items-center justify-center">
        
        {/* Animated Cyber Dragon & Matrix stream Background */}
        <CyberDragonBackground />

        <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
          
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-400 mb-6 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            <span>{t("heroBadge")}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1] max-w-3xl sentence-case drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
            {t("heroTitle")}
          </h1>

          <p className="text-xs sm:text-base text-neutral-350 mt-5 max-w-xl font-normal leading-relaxed drop-shadow-[0_1px_5px_rgba(0,0,0,0.8)]">
            {t("heroDesc")}
          </p>

          <div className="flex flex-col items-center gap-3 mt-9 w-full sm:w-80 px-4">
            {user ? (
              <a 
                href="/dashboard"
                className="w-full h-11 px-8 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:scale-[1.02]"
              >
                <span>{t("btnConsole")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <>
                <a 
                  href="/register"
                  className="w-full h-11 px-8 rounded-full bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-100 cursor-pointer transition-all shadow-lg hover:scale-[1.02]"
                >
                  <span>{t("btnTrial")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a 
                  href="/login"
                  className="w-full h-11 px-8 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-200 font-semibold text-xs flex items-center justify-center hover:bg-neutral-850 hover:text-white cursor-pointer transition-all backdrop-blur-md hover:scale-[1.02]"
                >
                  {t("btnLogIn")}
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. CUSTOMER LOGOS ROW */}
      <section className="border-y border-neutral-200/50 dark:border-neutral-850/50 bg-neutral-50/50 dark:bg-neutral-900/30 py-6 px-4 sm:px-6 lg:px-16 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-450 dark:text-neutral-500 font-bold mb-3">{t("trustedBy")}</p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-14 text-neutral-400 dark:text-neutral-500 font-bold tracking-tighter text-xs sm:text-sm">
            <span className="hover:text-neutral-800 dark:hover:text-neutral-350 transition-colors">FINSOLVE</span>
            <span className="hover:text-neutral-800 dark:hover:text-neutral-350 transition-colors">SUPABASE</span>
            <span className="hover:text-neutral-800 dark:hover:text-neutral-350 transition-colors">STRIPE</span>
            <span className="hover:text-neutral-800 dark:hover:text-neutral-350 transition-colors">ASTRO</span>
            <span className="hover:text-neutral-800 dark:hover:text-neutral-350 transition-colors">VERCEL</span>
            <span className="hover:text-neutral-800 dark:hover:text-neutral-350 transition-colors">LINEAR</span>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE TAB SHOWCASE SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10">
          <p className="text-[10px] font-mono tracking-wider uppercase text-indigo-500 font-bold mb-1.5">{t("fiveWorkspaces")}</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">{t("oneUnified")}</h2>
          <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-2 max-w-md mx-auto leading-relaxed">
            {t("eliminateNoise")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* Tab buttons column */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            {interactiveFeatures.map((item, index) => {
              const TabIcon = item.icon;
              const isActive = activeTab === index;
              return (
                <button
                  key={item.title}
                  onClick={() => setActiveTab(index)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isActive 
                      ? "bg-white dark:bg-neutral-900 border-indigo-500 dark:border-indigo-400 shadow-md translate-x-1" 
                      : "bg-transparent border-neutral-100 dark:border-neutral-900/60 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive 
                        ? "bg-indigo-500 text-white shadow-xs" 
                        : "bg-neutral-100 dark:bg-neutral-900 text-neutral-400"
                    }`}>
                      <TabIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isActive ? "text-neutral-900 dark:text-white" : "text-neutral-700 dark:text-neutral-350"}`}>{item.title}</p>
                      <p className="text-[10px] text-neutral-400">{item.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono uppercase bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-bold tracking-wider">{item.badge}</span>
                </button>
              );
            })}
          </div>

          {/* Tab preview dashboard simulator */}
          <div className="lg:col-span-7 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/50 dark:border-neutral-850/50 p-4 sm:p-6 md:p-8 rounded-2xl shadow-inner min-h-[300px] flex items-center justify-center relative">
            <div className="absolute top-4 left-4 text-[9px] font-mono uppercase text-neutral-400 tracking-wider">{t("workspacePreview")}</div>
            
            <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 mt-4">
              {interactiveFeatures[activeTab].preview}
            </div>
          </div>
        </div>
      </section>

      {/* 3.5. COMPLETE PLATFORM DIRECTORY & SEO SITEMAP */}
      <section className="bg-white dark:bg-neutral-950 border-t border-neutral-200/50 dark:border-neutral-850/50 py-20 px-4 sm:px-6 lg:px-16 transition-all">
        <div className="max-w-7xl mx-auto w-full">
          
          <div className="text-center mb-16">
            <p className="text-[10px] font-mono tracking-wider uppercase text-cyan-500 font-bold mb-2">COMPLETE MULTI-PAGE ECOSYSTEM</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-white">Explore the Complete Secura Directory</h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-3 max-w-2xl mx-auto leading-relaxed">
              Secura is built as a modular Multi-Page Application (MPA) ensuring lightning-fast search indexing and complete local cache sandboxing. Easily navigate across our suite of encrypted workspaces, admin nodes, pricing plans, and security policies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Category 1: Core SaaS Workspaces */}
            <div className="flex flex-col gap-5 p-6 bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-850/60 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-200/40 dark:border-neutral-800/60">
                <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-neutral-100 tracking-wider uppercase">Productivity Tools</h3>
              </div>
              <ul className="flex flex-col gap-4">
                <li>
                  <a href="/password-manager" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-indigo-500 transition-colors flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-neutral-400 group-hover:text-indigo-500" />
                      Password Vault
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      Military-grade AES-GCM browser cache password manager.
                    </span>
                  </a>
                </li>
                <li>
                  <a href="/invoice-generator" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-indigo-500 transition-colors flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-neutral-400 group-hover:text-indigo-500" />
                      Invoice Generator
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      Dynamic client record keeper & PDF receipt exporter.
                    </span>
                  </a>
                </li>
                <li>
                  <a href="/budget-planner" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-indigo-500 transition-colors flex items-center gap-1.5">
                      <PieChart className="w-3.5 h-3.5 text-neutral-400 group-hover:text-indigo-500" />
                      Budget Planner
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      Goal tracker with interactive threshold charts.
                    </span>
                  </a>
                </li>
                <li>
                  <a href="/expense-tracker" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-indigo-500 transition-colors flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-neutral-400 group-hover:text-indigo-500" />
                      Free Expense Tracker
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      Log daily personal & business cash flow ledgers online.
                    </span>
                  </a>
                </li>
                <li>
                  <a href="/expiry-reminder" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-indigo-500 transition-colors flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 group-hover:text-indigo-500" />
                      Expiry Reminder
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      Visual passport and visa countdown calendar logs.
                    </span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Category 2: Management & Auth */}
            <div className="flex flex-col gap-5 p-6 bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-850/60 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-200/40 dark:border-neutral-800/60">
                <div className="w-7 h-7 rounded-lg bg-cyan-500 text-white flex items-center justify-center">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-neutral-100 tracking-wider uppercase">Control Panels</h3>
              </div>
              <ul className="flex flex-col gap-4">
                <li>
                  <a href="/dashboard" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                      <LayoutDashboard className="w-3.5 h-3.5 text-neutral-400 group-hover:text-cyan-500" />
                      Unified Dashboard
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      Integrated central terminal for five productive workspaces.
                    </span>
                  </a>
                </li>
                <li>
                  <a href="/admin" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-neutral-400 group-hover:text-cyan-500" />
                      Admin Terminal
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      Monitor server status, database health, and telemetry logs.
                    </span>
                  </a>
                </li>
                <li>
                  <a href="/login" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-neutral-400 group-hover:text-cyan-500" />
                      Session Log In
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      Restore synced cloud data and verify your master keys safely.
                    </span>
                  </a>
                </li>
                <li>
                  <a href="/register" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-neutral-400 group-hover:text-cyan-500" />
                      Register Account
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      Instantly initialize a zero-knowledge personal secure profile.
                    </span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Category 3: Corporate Resources */}
            <div className="flex flex-col gap-5 p-6 bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-850/60 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-200/40 dark:border-neutral-800/60">
                <div className="w-7 h-7 rounded-lg bg-pink-500 text-white flex items-center justify-center">
                  <Coins className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-neutral-100 tracking-wider uppercase">Platform & Brand</h3>
              </div>
              <ul className="flex flex-col gap-4">
                <li>
                  <a href="/pricing" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-pink-500 transition-colors flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-neutral-400 group-hover:text-pink-500" />
                      Pricing Tiers
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      Compare our zero-knowledge starter limits and premium keys.
                    </span>
                  </a>
                </li>
                <li>
                  <a href="/about" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-pink-500 transition-colors flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-neutral-400 group-hover:text-pink-500" />
                      About Secura
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      The core team, engineering mission, and privacy manifesto.
                    </span>
                  </a>
                </li>
                <li>
                  <a href="/contact" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-pink-500 transition-colors flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-neutral-400 group-hover:text-pink-500" />
                      Contact Desk
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      Need help? Open a cryptographically-shielded support request.
                    </span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Category 4: Security Protocols */}
            <div className="flex flex-col gap-5 p-6 bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-850/60 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-200/40 dark:border-neutral-800/60">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-neutral-100 tracking-wider uppercase">Legal & Security</h3>
              </div>
              <ul className="flex flex-col gap-4">
                <li>
                  <a href="/privacy" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                      <FileSignature className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-500" />
                      Privacy Policy
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      Learn how client-side encrypted objects are synced securely.
                    </span>
                  </a>
                </li>
                <li>
                  <a href="/terms" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-500" />
                      Terms & Conditions
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      The agreement rules, liability, and zero-knowledge disclosures.
                    </span>
                  </a>
                </li>
                <li>
                  <a href="/disclaimer" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-500" />
                      Service Disclaimer
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      Informational disclosures for our free utilities.
                    </span>
                  </a>
                </li>
                <li>
                  <a href="/encrypted-policy" className="group flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-500" />
                      Encryption Manifesto
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-normal">
                      Technical audit specifications for the client-side AES hashes.
                    </span>
                  </a>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 4. SUBSCRIPTION PLANS PRICING SECTION */}
      <section id="pricing" className="bg-[#f5f5f5] dark:bg-[#0c0c0d] border-y border-neutral-200/50 dark:border-neutral-900 py-16 px-4 sm:px-6 lg:px-16 transition-all">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <p className="text-[10px] font-mono tracking-wider uppercase text-indigo-500 font-bold mb-1.5">{t("pricingHeader")}</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">{t("pricingTitle")}</h2>
            <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-2 max-w-md mx-auto leading-relaxed">
              {t("pricingDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-6 sm:p-8 shadow-md flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400">{t("freePlan")}</h3>
                  <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-[9px] font-mono text-neutral-500 font-bold uppercase">{t("freeStarter")}</span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-neutral-950 dark:text-white">{t("freePrice")}</span>
                  <span className="text-neutral-400 text-xs">{t("freeFreq")}</span>
                </div>
                <ul className="flex flex-col gap-3 text-xs text-neutral-650 dark:text-neutral-350 mb-8 border-t border-neutral-100 dark:border-neutral-850 pt-5 text-left">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{t("freeItem1")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{t("freeItem2")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{t("freeItem3")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{t("freeItem4")}</span>
                  </li>
                </ul>
              </div>
              <a 
                href="/register" 
                className="w-full h-10 border border-neutral-200 dark:border-neutral-850 rounded-lg text-xs font-semibold flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all cursor-pointer text-center text-neutral-800 dark:text-neutral-200"
              >
                {t("btnSignUp")}
              </a>
            </div>

            {/* Premium Plan */}
            <div className="bg-neutral-950 text-white dark:bg-white dark:text-black rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col justify-between hover:scale-[1.01] transition-all relative overflow-hidden border border-indigo-500">
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-mono uppercase tracking-widest px-4 py-1 font-bold rounded-bl-xl shadow-xs">
                {t("proPremium")}
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400">{t("proPlan")}</h3>
                </div>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-white dark:text-neutral-950">{t("proPrice")}</span>
                  <span className="text-neutral-400 text-xs">{t("proFreq")}</span>
                </div>
                <ul className="flex flex-col gap-3 text-xs text-neutral-300 dark:text-neutral-700 mb-8 border-t border-neutral-800 dark:border-neutral-100 pt-5 text-left">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600 shrink-0" />
                    <span className="font-bold text-white dark:text-black">{t("proItem1")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600 shrink-0" />
                    <span>{t("proItem2")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600 shrink-0" />
                    <span>{t("proItem3")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600 shrink-0" />
                    <span>{t("proItem4")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600 shrink-0" />
                    <span>{t("proItem5")}</span>
                  </li>
                </ul>
              </div>
              <a 
                href="/register" 
                className="w-full h-10 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white font-bold rounded-lg text-xs flex items-center justify-center hover:opacity-95 transition-all cursor-pointer text-center shadow-lg"
              >
                {t("btnUpgrade")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQS SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-16 max-w-4xl mx-auto w-full">
        <div className="text-center mb-10">
          <p className="text-[10px] font-mono tracking-wider uppercase text-indigo-500 font-bold mb-1.5">{t("faqHeader")}</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">{t("faqTitle")}</h2>
        </div>

        <div className="flex flex-col gap-3.5">
          {[
            {
              id: "faq-1",
              q: currentLang === "ur" ? "زیرو نالج پروٹوکول کیا ہے اور یہ میرے پاس ورڈز کو کیسے محفوظ رکھتا ہے؟" : "What is a zero-knowledge protocol and how does it secure my password vault?",
              a: currentLang === "ur" ? "زیرو نالج کا مطلب ہے کہ ہم آپ کا ماسٹر پاس ورڈ کبھی نہیں دیکھ سکتے اور نہ ہی اسے محفوظ کرتے ہیں۔ آپ کا تمام ڈیٹا آپ کے براؤزر کے اندر ہی انکرپٹ ہو جاتا ہے۔" : "Zero-knowledge means that we do not have visibility, storage or possession of your Vault Master Password. Your data is encrypted inside your browser cache before being securely saved to our Firestore database. Only you can decrypt it."
            },
            {
              id: "faq-2",
              q: currentLang === "ur" ? "کیا پی ڈی ایف انوائسز ہمارے براؤزر میں بنتی ہیں؟" : "Are the PDF invoices generated on the client-side?",
              a: currentLang === "ur" ? "جی ہاں! ہمارا انوائس جنریٹر تمام حسابات اور پی ڈی ایف فارمیٹنگ آپ کے براؤزر میں ہی کرتا ہے جس سے آپ فوری پرنٹ یا ڈاؤن لوڈ کر سکتے ہیں۔" : "Yes, our Invoice Generator builds high-fidelity freelance invoices complete with dynamic client records, custom calculations, and tax settings, allowing you to instantly print or export beautiful styled client receipts."
            },
            {
              id: "faq-3",
              q: currentLang === "ur" ? "کیا میں اپنے بجٹ اور ماہانہ اخراجات کو زمرہ جات میں تقسیم کر سکتا ہوں؟" : "Can I track my monthly limits across multiple spending categories?",
              a: currentLang === "ur" ? "بالکل۔ ہمارا بجٹ پلانر خودکار طریقے سے آپ کے روزمرہ کے اخراجات کو مانیٹر کرتا ہے اور آپ کو فوری حد سے تجاوز کرنے کا الرٹ جاری کرتا ہے۔" : "Absolutely. Our Personal Budget Planner automatically synchronizes your spending records. Once you log an expense, the specific budget goal tracker calculates the remaining threshold percentage instantly."
            }
          ].map((faq) => {
            const isOpen = faqOpen[faq.id];
            return (
              <div 
                key={faq.id} 
                className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-850 rounded-xl overflow-hidden transition-all shadow-sm text-left"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-4 sm:px-5 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-850"
                >
                  <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-100">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-all shrink-0 ${isOpen ? "rotate-180 text-indigo-500" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-850 pt-3 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. FINAL CALL TO ACTION */}
      <section className="bg-neutral-950 text-white py-16 px-4 sm:px-6 lg:px-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-pink-500/10 opacity-30 blur-xl" />
        <div className="max-w-xl mx-auto flex flex-col items-center relative z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t("ctaTitle")}</h2>
          <p className="text-neutral-400 text-xs sm:text-sm mt-3 leading-relaxed">
            {t("ctaDesc")}
          </p>
          <a 
            href="/register"
            className="h-11 px-8 rounded-full bg-white text-black font-semibold text-xs mt-6 hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>{t("ctaBtn")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* 7. HIGH-FIDELITY FOOTER */}
      <footer className="bg-[#050507] text-neutral-400 border-t border-neutral-900/60 py-16 px-4 sm:px-6 lg:px-16 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
          
          {/* Logo & Slogan Column */}
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center p-2 shrink-0">
                <img 
                  src="/favicon.svg" 
                  alt="Secura" 
                  className="w-7 h-7 object-contain" 
                  onError={(e) => { 
                    (e.target as HTMLImageElement).src = '/favicon-96x96.png'; 
                  }} 
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-base font-black tracking-widest text-white uppercase font-mono">SECURA</span>
                <span className="text-[10px] text-neutral-500 font-mono tracking-wide uppercase">ZERO-KNOWLEDGE SECURITY SUITE</span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 max-w-xs text-left leading-relaxed">
              Secura delivers high-performance, private-first utilities running on local cryptographic containers. Manage records with peace of mind.
            </p>
            <div className="text-[10px] text-neutral-600 font-mono text-left mt-2">
              <div>&copy; {new Date().getFullYear()} SECURA INC. ALL RIGHTS RESERVED.</div>
              <div className="text-neutral-700 mt-1 uppercase tracking-wider">SECURED BY MULTI-FACTOR CRYPTOGRAPHY</div>
            </div>
          </div>
          
          {/* Multi-column sitemap links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 md:gap-12 lg:gap-16 w-full md:w-auto text-left">
            <div className="flex flex-col gap-3">
              <span className="text-neutral-200 text-xs font-bold uppercase tracking-wider">Workspaces</span>
              <a href="/password-manager" className="hover:text-cyan-400 text-[11px] transition-colors">Password Vault</a>
              <a href="/invoice-generator" className="hover:text-cyan-400 text-[11px] transition-colors">Invoice Generator</a>
              <a href="/budget-planner" className="hover:text-cyan-400 text-[11px] transition-colors">Budget Planner</a>
              <a href="/expense-tracker" className="hover:text-cyan-400 text-[11px] transition-colors">Expense Tracker</a>
              <a href="/expiry-reminder" className="hover:text-cyan-400 text-[11px] transition-colors">Expiry Reminder</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-neutral-200 text-xs font-bold uppercase tracking-wider">Control</span>
              <a href="/dashboard" className="hover:text-cyan-400 text-[11px] transition-colors">Unified Portal</a>
              <a href="/admin" className="hover:text-cyan-400 text-[11px] transition-colors">Admin Panel</a>
              <a href="/login" className="hover:text-cyan-400 text-[11px] transition-colors">Login Session</a>
              <a href="/register" className="hover:text-cyan-400 text-[11px] transition-colors">Register Profile</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-neutral-200 text-xs font-bold uppercase tracking-wider">Company</span>
              <a href="/pricing" className="hover:text-cyan-400 text-[11px] transition-colors">Pricing Structure</a>
              <a href="/about" className="hover:text-cyan-400 text-[11px] transition-colors">About Us</a>
              <a href="/contact" className="hover:text-cyan-400 text-[11px] transition-colors">Contact Desk</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-neutral-200 text-xs font-bold uppercase tracking-wider">Security</span>
              <a href="/privacy" className="hover:text-cyan-400 text-[11px] transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-cyan-400 text-[11px] transition-colors">Terms of Service</a>
              <a href="/disclaimer" className="hover:text-cyan-400 text-[11px] transition-colors">Service Disclaimer</a>
              <a href="/encrypted-policy" className="hover:text-cyan-400 text-[11px] transition-colors">Encryption Policy</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
