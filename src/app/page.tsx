"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════ */

interface FormData {
  caseNarrative: string;
  jurisdiction: string;
  keyDocuments: string;
  defendantProfile: string;
  damagesEstimate: string;
  fundingRequest: string;
  representationStatus: "represented" | "seeking" | "preliminary";
  firmName: string;
  attorneyName: string;
  feeStructure: string;
}

interface FileAttachment {
  name: string;
  type: string;
  content: string;
}

interface AnalysisSection {
  title: string;
  content: string;
  verdict?: "pass" | "fail" | "caution";
}

const EMPTY_FORM: FormData = {
  caseNarrative: "",
  jurisdiction: "",
  keyDocuments: "",
  defendantProfile: "",
  damagesEstimate: "",
  fundingRequest: "",
  representationStatus: "represented",
  firmName: "",
  attorneyName: "",
  feeStructure: "",
};

const FIELDS: {
  key: keyof FormData;
  label: string;
  num: string;
  hint: string;
  rows: number;
}[] = [
  {
    key: "caseNarrative",
    label: "Case Narrative",
    num: "01",
    hint: "Describe the alleged wrongdoing, how it was discovered, and the key facts supporting your claim.",
    rows: 5,
  },
  {
    key: "jurisdiction",
    label: "Jurisdiction",
    num: "02",
    hint: "Identify the court or jurisdiction where the case has been or would be filed — e.g., Southern District of New York, Miami-Dade County Circuit Court.",
    rows: 1,
  },
  {
    key: "keyDocuments",
    label: "Key Documents & Legal Basis",
    num: "03",
    hint: "Identify the primary legal basis and key supporting documents — contracts, statutes, filings, or precedent.",
    rows: 4,
  },
  {
    key: "defendantProfile",
    label: "Defendant & Asset Profile",
    num: "04",
    hint: "Identify the defendant, their entity type, known assets, insurance coverage, and financial condition.",
    rows: 4,
  },
  {
    key: "damagesEstimate",
    label: "Damages Estimate",
    num: "05",
    hint: "Estimated total damages with methodology — lost profits, out-of-pocket, statutory, punitive multipliers.",
    rows: 3,
  },
];

const RADIOS: {
  value: FormData["representationStatus"];
  label: string;
  desc: string;
}[] = [
  { value: "represented", label: "Represented", desc: "Have counsel engaged" },
  { value: "seeking", label: "Seeking", desc: "Looking for counsel" },
  { value: "preliminary", label: "Preliminary", desc: "Exploring options" },
];

/* ═══════════════════════════════════════════════════════
   PARTICLE CANVAS
   ═══════════════════════════════════════════════════════ */

function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const pts: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];

    const resize = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 45; i++) {
      pts.push({
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 1.2 + 0.3,
        o: Math.random() * 0.15 + 0.04,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = c.width;
        if (p.x > c.width) p.x = 0;
        if (p.y < 0) p.y = c.height;
        if (p.y > c.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120,180,255,${p.o})`;
        ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(120,180,255,${0.025 * (1 - d / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

/* ═══════════════════════════════════════════════════════
   RESULT CARD
   ═══════════════════════════════════════════════════════ */

function ResultCard({ section, index }: { section: AnalysisSection; index: number }) {
  const v = section.verdict;
  const bdr = v === "pass" ? "border-emerald-500/30" : v === "fail" ? "border-red-500/30" : v === "caution" ? "border-amber-500/30" : "border-white/[0.08]";
  const bg = v === "pass" ? "bg-emerald-500/[0.05]" : v === "fail" ? "bg-red-500/[0.05]" : v === "caution" ? "bg-amber-500/[0.05]" : "bg-white/[0.03]";
  const badge = v === "pass" ? { c: "bg-emerald-500/20 text-emerald-400", l: "PASS" } : v === "fail" ? { c: "bg-red-500/20 text-red-400", l: "DECLINE" } : v === "caution" ? { c: "bg-amber-500/20 text-amber-400", l: "CAUTION" } : null;

  return (
    <div className={`rounded-2xl border ${bdr} ${bg} p-6 anim-up`} style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-lg font-semibold text-slate-100 font-display">{section.title}</h3>
        {badge && <span className={`shrink-0 text-[11px] font-bold px-3 py-1 rounded-full tracking-widest font-mono ${badge.c}`}>{badge.l}</span>}
      </div>
      <div className="text-[15px] text-slate-300 leading-relaxed whitespace-pre-wrap">{section.content}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */

export default function Home() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisSection[] | null>(null);
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const set = useCallback((k: keyof FormData, v: string) => setForm((f) => ({ ...f, [k]: v })), []);

  const fmtCurrency = (s: string) => {
    const d = s.replace(/\D/g, "");
    return d ? Number(d).toLocaleString("en-US") : "";
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  /* ── File handling ── */
  const processFiles = async (fileList: FileList) => {
    const newFiles: FileAttachment[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > 50 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds 10MB limit.`);
        continue;
      }
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] || result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      newFiles.push({ name: file.name, type: file.type, content: base64 });
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── Parse response — flexible ── */
  const parseResponse = (text: string): AnalysisSection[] => {
    if (!text || text.trim().length === 0) {
      return [{ title: "Error", content: "No response received from the analysis engine.", verdict: "fail" }];
    }

    const sections: AnalysisSection[] = [];

    // Try splitting by markdown headers (##, ###, #)
    const blocks = text.split(/(?=^#{1,3}\s+)/m).filter((s) => s.trim());

    if (blocks.length > 1) {
      for (const block of blocks) {
        const lines = block.trim().split("\n");
        const titleLine = lines[0].replace(/^#{1,3}\s*/, "").replace(/\*+/g, "").trim();
        const content = lines.slice(1).join("\n").trim();
        if (!titleLine) continue;

        const lc = (titleLine + " " + content).toLowerCase();
        let verdict: AnalysisSection["verdict"];
        if (/✅|verdict:\s*pass|\bpass\b.*complet|recommend.*fund|strong case|sufficient/.test(lc)) verdict = "pass";
        else if (/❌|verdict:\s*fail|decline|do not fund|reject|not recommended/.test(lc)) verdict = "fail";
        else if (/⚠|verdict:\s*caution|conditional|insufficient|additional.*needed|gaps?\s*identif/.test(lc)) verdict = "caution";

        sections.push({ title: titleLine, content: content || "(No additional detail)", verdict });
      }
    }

    // Try splitting by bold headers (**Section:**) or numbered patterns
    if (sections.length === 0) {
      const boldSplit = text.split(/(?=\*\*[^*]+\*\*)/m).filter((s) => s.trim());
      if (boldSplit.length > 1) {
        for (const block of boldSplit) {
          const match = block.match(/^\*\*([^*]+)\*\*/);
          if (match) {
            const title = match[1].trim();
            const content = block.replace(/^\*\*[^*]+\*\*:?\s*/, "").trim();
            const lc = (title + " " + content).toLowerCase();
            let verdict: AnalysisSection["verdict"];
            if (/pass|sufficient|strong|recommend.*fund|✅/.test(lc)) verdict = "pass";
            else if (/fail|decline|reject|not recommended|❌/.test(lc)) verdict = "fail";
            else if (/caution|conditional|insufficient|gaps|⚠/.test(lc)) verdict = "caution";
            sections.push({ title, content, verdict });
          }
        }
      }
    }

    // Fallback: show full response as one block
    if (sections.length === 0) {
      sections.push({ title: "Underwriting Analysis", content: text });
    }

    return sections;
  };

  const submit = async () => {
    setError(""); setAnalysis(null); setRawText(""); setLoading(true);
    try {
      const payload = {
        ...form,
        attachments: files.length > 0 ? files : undefined,
      };
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `Error ${res.status}`);
      }
      const data = await res.json();
      // Backend returns { response: text }
      const t = data.response || data.analysis || data.content || data.message || data.text || "";
      if (!t) {
        throw new Error("Empty response from analysis engine. Please try again.");
      }
      setRawText(t);
      setAnalysis(parseResponse(t));
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Unexpected error"); }
    finally { setLoading(false); }
  };

  const canSubmit = form.caseNarrative.trim().length > 0 && form.fundingRequest.trim().length > 0 && !loading;

  const cardCls = (field?: string) =>
    `relative rounded-2xl border transition-all duration-300 p-5 md:p-6 ${focus === field
      ? "border-sky-400/35 bg-white/[0.06] shadow-[0_0_30px_rgba(56,139,253,0.08)]"
      : "border-white/[0.08] bg-white/[0.035] hover:border-white/[0.14]"}`;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style jsx global>{`
        :root { --bg: #111a2e; --bg-light: #162036; --accent: #4a9eff; --gold: #d4ad5e; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: #d0d8e4; font-family: 'Outfit', sans-serif; -webkit-font-smoothing: antialiased; }
        ::selection { background: rgba(74,158,255,0.3); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(74,158,255,0.15); border-radius: 4px; }
        textarea, input { font-family: 'Outfit', sans-serif; }
        .font-display { font-family: 'Cormorant Garamond', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .anim-up { opacity: 0; animation: fadeUp 0.5s ease-out forwards; }
        .glow-line { height: 1px; background: linear-gradient(90deg, transparent, var(--accent), transparent); opacity: 0.2; }
      `}</style>

      <Particles />

      <div className="relative z-10">

        {/* ═══════ HEADER ═══════ */}
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{ background: scrolled ? "rgba(17,26,46,0.92)" : "transparent", backdropFilter: scrolled ? "blur(16px) saturate(1.2)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent" }}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4a9eff 0%, #2563eb 100%)" }}>
                <span className="text-white font-bold text-base font-display">H</span>
              </div>
              <span className="text-white font-semibold tracking-tight text-xl">Henley<span className="text-sky-400 ml-0.5">AI</span></span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              {["How It Works", "Platform", "Contact"].map((l) => (
                <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="text-[15px] text-slate-400 hover:text-white transition-colors duration-200">{l}</a>
              ))}
              <button onClick={scrollToForm} className="text-[15px] font-medium text-white px-5 py-2.5 rounded-lg transition-all duration-200 hover:brightness-110" style={{ background: "linear-gradient(135deg, #4a9eff 0%, #2563eb 100%)" }}>Submit a Case</button>
            </nav>
            <button onClick={scrollToForm} className="md:hidden text-sm font-medium text-white px-4 py-2 rounded-lg" style={{ background: "linear-gradient(135deg, #4a9eff 0%, #2563eb 100%)" }}>Submit a Case</button>
          </div>
        </header>

        {/* ═══════ HERO ═══════ */}
        <section className="relative min-h-[80vh] flex items-center justify-center px-6 pt-16 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(74,158,255,0.07) 0%, transparent 70%)" }} />
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="anim-up" style={{ animationDelay: "0.1s" }}>
              <p className="font-mono text-sm tracking-[0.2em] uppercase mb-5" style={{ color: "var(--gold)" }}>AI-Powered Litigation Funding</p>
            </div>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl md:text-[4.5rem] font-semibold text-white leading-[1.08] mb-5 anim-up" style={{ animationDelay: "0.2s" }}>
              live by the sword,<br />
              <span style={{ color: "#d4793a" }}>die by the sword</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 font-light leading-relaxed max-w-2xl mx-auto mb-8 anim-up" style={{ animationDelay: "0.3s" }}>
              Henley AI underwrites pre-suit litigation funding in minutes, not months. Our AI engine evaluates legal merit, collectibility, and expected value to deliver institutional-grade funding decisions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 anim-up" style={{ animationDelay: "0.4s" }}>
              <button onClick={scrollToForm} className="px-8 py-4 rounded-xl text-white font-semibold text-base transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(74,158,255,0.25)]" style={{ background: "linear-gradient(135deg, #4a9eff 0%, #2563eb 100%)" }}>Submit Your Case</button>
              <a href="#how-it-works" className="px-8 py-4 rounded-xl text-slate-200 font-medium text-base border border-white/[0.1] bg-white/[0.04] hover:border-white/[0.2] hover:bg-white/[0.06] transition-all duration-200">How It Works</a>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 anim-up" style={{ animationDelay: "0.5s" }}>
              {["Pre-Suit Specialist", "60-Second Underwriting", "§0–§5 Risk Framework", "Institutional Grade"].map((t) => (
                <span key={t} className="text-xs tracking-wider uppercase text-slate-400 font-mono">{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ HOW IT WORKS ═══════ */}
        <section id="how-it-works" className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="font-mono text-sm tracking-[0.2em] uppercase mb-3" style={{ color: "var(--gold)" }}>Process</p>
              <h2 className="font-display text-3xl md:text-4xl text-white font-semibold">How It Works</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { num: "01", title: "Submit Your Case", desc: "Complete the structured intake form with your case narrative, legal basis, defendant profile, damages estimate, and funding request.", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
                { num: "02", title: "AI Underwriting", desc: "Our engine runs a six-section analysis: completeness check, legal theory, collectibility, evidence gaps, expected value modeling, and return structure.", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg> },
                { num: "03", title: "Funding Decision", desc: "Receive a detailed report with pass/fail verdicts per section, expected recovery value, tiered return structure (1x/2x/3x), and a clear recommendation.", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> },
              ].map((step) => (
                <div key={step.num} className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.035] p-7 hover:border-white/[0.14] hover:bg-white/[0.05] transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl border border-sky-400/25 bg-sky-500/[0.08] flex items-center justify-center text-sky-400 group-hover:bg-sky-500/[0.12] transition-colors">{step.icon}</div>
                    <span className="font-mono text-sm text-slate-500">{step.num}</span>
                  </div>
                  <h3 className="font-display text-xl text-white font-semibold mb-2">{step.title}</h3>
                  <p className="text-[15px] text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ PLATFORM — SIX SECTIONS ═══════ */}
        <section id="platform" className="py-16 px-6" style={{ background: "rgba(255,255,255,0.015)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="font-mono text-sm tracking-[0.2em] uppercase mb-3" style={{ color: "var(--gold)" }}>Underwriting Engine</p>
              <h2 className="font-display text-3xl md:text-4xl text-white font-semibold mb-3">Six-Section Risk Framework</h2>
              <p className="text-base text-slate-300 font-light max-w-lg mx-auto">Every case is evaluated through a rigorous, institutional-grade analytical framework.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { s: "§0", t: "Completeness Check", d: "Validates all required intake fields are present and sufficiently detailed before analysis proceeds." },
                { s: "§1", t: "Legal Theory", d: "Identifies viable causes of action, evaluates statutory and common law basis, and assesses merit probability." },
                { s: "§2", t: "Collectibility", d: "Analyzes defendant assets, insurance, corporate structure, and ability to satisfy a judgment." },
                { s: "§3", t: "Evidence Gaps", d: "Maps existing evidence against required elements, identifies discovery needs and litigation risk." },
                { s: "§4", t: "Expected Value", d: "Probability-weighted damage model with tiered return structure: 1x year one, 2x year two, 3x year three+." },
                { s: "§5", t: "Recommendation", d: "Final funding decision with conditions, risk flags, and recommended investment terms." },
              ].map((item) => (
                <div key={item.s} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 hover:border-sky-400/20 hover:bg-sky-500/[0.03] transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-sm font-bold text-sky-400/80 bg-sky-500/[0.1] px-2.5 py-0.5 rounded">{item.s}</span>
                    <h3 className="text-[15px] font-semibold text-slate-200">{item.t}</h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ INTAKE FORM ═══════ */}
        <section id="submit" className="py-16 px-6" ref={formRef}>
          <div className="max-w-[760px] mx-auto">
            <div className="text-center mb-10">
              <p className="font-mono text-sm tracking-[0.2em] uppercase mb-3" style={{ color: "var(--gold)" }}>Case Intake</p>
              <h2 className="font-display text-3xl md:text-4xl text-white font-semibold mb-3">Submit Your Case</h2>
              <p className="text-base text-slate-300 font-light max-w-md mx-auto">Complete the form below and our underwriting engine will analyze your case in under 60 seconds.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-5">

              {/* Fields 1-5 */}
              {FIELDS.map((f) => (
                <div key={f.key} className={cardCls(f.key)}>
                  <span className="absolute top-3 right-5 text-[32px] font-bold leading-none pointer-events-none select-none font-mono" style={{ color: "rgba(74,158,255,0.07)" }}>{f.num}</span>
                  <label className="block text-sm font-semibold uppercase tracking-[0.1em] mb-1 text-sky-400/90">{f.label}</label>
                  <p className="text-[15px] text-slate-400 mb-3 leading-relaxed">{f.hint}</p>
                  {f.rows === 1 ? (
                    <input
                      type="text"
                      value={form[f.key]}
                      disabled={loading}
                      onChange={(e) => set(f.key, e.target.value)}
                      onFocus={() => setFocus(f.key)}
                      onBlur={() => setFocus(null)}
                      placeholder="Begin typing..."
                      className="w-full bg-transparent text-base text-slate-200 placeholder:text-slate-500/50 outline-none disabled:opacity-30"
                    />
                  ) : (
                    <textarea
                      rows={f.rows}
                      value={form[f.key]}
                      disabled={loading}
                      onChange={(e) => set(f.key, e.target.value)}
                      onFocus={() => setFocus(f.key)}
                      onBlur={() => setFocus(null)}
                      placeholder="Begin typing..."
                      className="w-full bg-transparent resize-y text-base leading-relaxed text-slate-200 placeholder:text-slate-500/50 outline-none disabled:opacity-30"
                    />
                  )}
                </div>
              ))}

              {/* Field 6 — Funding Request */}
              <div className={cardCls("fundingRequest")}>
                <span className="absolute top-3 right-5 text-[32px] font-bold leading-none pointer-events-none select-none font-mono" style={{ color: "rgba(74,158,255,0.07)" }}>06</span>
                <label className="block text-sm font-semibold uppercase tracking-[0.1em] mb-1 text-sky-400/90">Funding Request</label>
                <p className="text-[15px] text-slate-400 mb-4">Total litigation funding amount requested in US dollars.</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-medium font-mono" style={{ color: "rgba(148,163,184,0.35)" }}>$</span>
                  <input type="text" inputMode="numeric" value={form.fundingRequest} disabled={loading} onChange={(e) => set("fundingRequest", fmtCurrency(e.target.value))} onFocus={() => setFocus("fundingRequest")} onBlur={() => setFocus(null)} placeholder="0" className="w-full bg-transparent text-3xl font-medium text-white placeholder:text-slate-600/40 outline-none font-mono disabled:opacity-30" />
                </div>
              </div>

              {/* Field 7 — Legal Representation */}
              <div className={cardCls("rep")}>
                <span className="absolute top-3 right-5 text-[32px] font-bold leading-none pointer-events-none select-none font-mono" style={{ color: "rgba(74,158,255,0.07)" }}>07</span>
                <label className="block text-sm font-semibold uppercase tracking-[0.1em] mb-1 text-sky-400/90">Legal Representation</label>
                <p className="text-[15px] text-slate-400 mb-4">Current status of legal counsel for this matter.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {RADIOS.map((opt) => {
                    const active = form.representationStatus === opt.value;
                    return (
                      <button type="button" key={opt.value} disabled={loading} onClick={() => set("representationStatus", opt.value)} className={`text-left rounded-xl border p-4 transition-all duration-200 disabled:opacity-30 ${active ? "border-sky-400/35 bg-sky-500/[0.08]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]"}`}>
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${active ? "border-sky-400" : "border-slate-500"}`}>
                            {active && <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                          </div>
                          <span className="text-[15px] font-medium text-slate-200">{opt.label}</span>
                        </div>
                        <p className="text-sm text-slate-400 pl-6">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Conditional sub-fields */}
                <div className="overflow-hidden transition-all duration-500 ease-in-out" style={{ maxHeight: form.representationStatus === "represented" ? "300px" : "0px", opacity: form.representationStatus === "represented" ? 1 : 0, marginTop: form.representationStatus === "represented" ? "14px" : "0px" }}>
                  <div className="space-y-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-5">
                    {([
                      { key: "firmName" as keyof FormData, label: "Firm Name", ph: "e.g., Quinn Emanuel Urquhart & Sullivan" },
                      { key: "attorneyName" as keyof FormData, label: "Lead Attorney", ph: "e.g., Jane Smith, Partner" },
                      { key: "feeStructure" as keyof FormData, label: "Fee Structure", ph: "e.g., 40% contingency, hybrid hourly + success fee" },
                    ]).map((sub) => (
                      <div key={sub.key}>
                        <label className="block text-xs font-semibold uppercase tracking-[0.12em] mb-1.5 text-slate-400">{sub.label}</label>
                        <input type="text" value={form[sub.key]} disabled={loading} onChange={(e) => set(sub.key, e.target.value)} placeholder={sub.ph} className="w-full bg-transparent border-b border-white/[0.08] pb-2 text-[15px] text-slate-200 placeholder:text-slate-500/40 outline-none focus:border-sky-400/30 transition-colors disabled:opacity-30" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ═══════ FILE ATTACHMENTS ═══════ */}
              <div className={cardCls("files")}>
                <span className="absolute top-3 right-5 text-[32px] font-bold leading-none pointer-events-none select-none font-mono" style={{ color: "rgba(74,158,255,0.07)" }}>08</span>
                <label className="block text-sm font-semibold uppercase tracking-[0.1em] mb-1 text-sky-400/90">Attachments</label>
                <p className="text-[15px] text-slate-400 mb-4">Upload contracts, complaints, evidence, or other supporting documents. Max 50MB per file.</p>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${dragActive ? "border-sky-400/50 bg-sky-500/[0.06]" : "border-white/[0.1] bg-white/[0.015] hover:border-white/[0.18] hover:bg-white/[0.03]"}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.csv,.xls,.xlsx"
                    onChange={(e) => { if (e.target.files?.length) processFiles(e.target.files); e.target.value = ""; }}
                    disabled={loading}
                  />
                  <svg className="w-8 h-8 mx-auto mb-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                  <p className="text-sm text-slate-400">
                    <span className="text-sky-400 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PDF, DOC, TXT, images, spreadsheets</p>
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <svg className="w-4 h-4 shrink-0 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <span className="text-sm text-slate-300 truncate">{f.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="shrink-0 text-slate-500 hover:text-red-400 transition-colors ml-3"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-4 text-[15px] text-red-400">{error}</div>}

              {/* Submit */}
              <button type="submit" disabled={!canSubmit} className="w-full h-14 rounded-xl text-white font-semibold text-base tracking-wide transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(74,158,255,0.2)]" style={{ background: canSubmit ? "linear-gradient(135deg, #4a9eff 0%, #2563eb 100%)" : "rgba(74,158,255,0.2)" }}>
                {loading ? (
                  <span className="inline-flex items-center gap-2.5">
                    <svg className="w-5 h-5" style={{ animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="50 20" /></svg>
                    Analyzing Case…
                  </span>
                ) : "Run Underwriting Analysis"}
              </button>
            </form>

            {/* ═══════ RESULTS ═══════ */}
            {analysis && (
              <div ref={resultsRef} className="mt-14">
                <div className="glow-line mb-8" />
                <div className="mb-6 anim-up">
                  <h2 className="font-display text-2xl md:text-3xl text-white font-semibold mb-2">Underwriting Report</h2>
                  <p className="text-sm text-slate-400 font-mono">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Henley AI v1.0</p>
                </div>
                <div className="space-y-4">
                  {analysis.map((s, i) => <ResultCard key={i} section={s} index={i} />)}
                </div>
                <details className="mt-6">
                  <summary className="text-sm cursor-pointer select-none text-slate-500 font-mono hover:text-slate-300 transition-colors">View raw output</summary>
                  <pre className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 text-sm text-slate-400 leading-relaxed overflow-auto max-h-96 whitespace-pre-wrap font-mono">{rawText}</pre>
                </details>
              </div>
            )}
          </div>
        </section>

        {/* ═══════ FOOTER ═══════ */}
        <footer id="contact" className="border-t border-white/[0.06] py-14 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-10 md:gap-8 mb-10">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4a9eff 0%, #2563eb 100%)" }}>
                    <span className="text-white font-bold text-sm font-display">H</span>
                  </div>
                  <span className="text-white font-semibold text-lg">Henley<span className="text-sky-400 ml-0.5">AI</span></span>
                </div>
                <p className="text-[15px] text-slate-400 leading-relaxed max-w-xs">AI-powered underwriting for pre-suit litigation funding. Institutional-grade analysis in under 60 seconds.</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-300 mb-4">Platform</h4>
                <div className="space-y-2.5">
                  {["How It Works", "Risk Framework", "Submit a Case"].map((l) => (
                    <a key={l} href="#" className="block text-[15px] text-slate-400 hover:text-white transition-colors">{l}</a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-300 mb-4">Contact</h4>
                <div className="space-y-2.5">
                  <a href="mailto:info@henleyai.com" className="block text-[15px] text-slate-400 hover:text-white transition-colors">info@henleyai.com</a>
                  <p className="text-[15px] text-slate-400">New York, NY</p>
                  <p className="text-[15px] text-slate-400">Miami, FL</p>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Henley AI. All rights reserved.</p>
              <p className="text-sm text-slate-500 font-mono">live by the sword, die by the sword</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
