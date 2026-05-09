"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Script from "next/script";

// Cloudflare Turnstile global (loaded via Script tag below)
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

/* ═══════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════ */

interface FormData {
  caseNarrative: string;
  jurisdiction: string;
  proceduralStep: string;
  proceduralStepNotes: string;
  keyDocuments: string;
  defendantProfile: string;
  damagesEstimate: string;
  fundingRequest: string;
  representationStatus: "represented" | "seeking" | "preliminary";
  firmName: string;
  attorneyName: string;
  feeStructure: string;
  counterclaimsStatus: "none" | "filed" | "threatened" | "unknown";
  counterclaimDescription: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  termsAccepted: boolean;
}

interface FileAttachment {
  name: string;
  type: string;
  content: string;
}

interface PublicRankings {
  completeness: "Low" | "Medium" | "High";
  fundability:
    | "Likely"
    | "Possible"
    | "Unlikely"
    | "More information required — the team will be in touch";
  nextStep: "More information required" | "Under review" | "Not a fit";
}

const EMPTY_FORM: FormData = {
  caseNarrative: "",
  jurisdiction: "",
  proceduralStep: "",
  proceduralStepNotes: "",
  keyDocuments: "",
  defendantProfile: "",
  damagesEstimate: "",
  fundingRequest: "",
  representationStatus: "represented",
  firmName: "",
  attorneyName: "",
  feeStructure: "",
  counterclaimsStatus: "none",
  counterclaimDescription: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  termsAccepted: false,
};

const STEPS = [
  { num: 1, label: "The Case" },
  { num: 2, label: "Defendant" },
  { num: 3, label: "Funding" },
  { num: 4, label: "Risk" },
  { num: 5, label: "Documents" },
  { num: 6, label: "Contact" },
];

const RADIOS: { value: FormData["representationStatus"]; label: string; desc: string }[] = [
  { value: "represented", label: "Represented", desc: "Have counsel engaged" },
  { value: "seeking", label: "Seeking", desc: "Looking for counsel" },
  { value: "preliminary", label: "Preliminary", desc: "Exploring options" },
];

const COUNTERCLAIM_OPTS: { value: FormData["counterclaimsStatus"]; label: string; desc: string }[] = [
  { value: "none", label: "None", desc: "No counterclaims filed or threatened" },
  { value: "filed", label: "Filed", desc: "Counterclaims on record" },
  { value: "threatened", label: "Threatened", desc: "Defendant has signaled intent" },
  { value: "unknown", label: "Unknown", desc: "Status not yet confirmed" },
];

const PROCEDURAL_STEPS: { value: string; label: string }[] = [
  { value: "pre-suit", label: "Pre-suit / demand letter sent" },
  { value: "complaint-drafted", label: "Complaint drafted, not yet filed" },
  { value: "complaint-filed", label: "Complaint filed" },
  { value: "answer-pending", label: "Answer / responsive pleading pending" },
  { value: "motion-to-dismiss", label: "Motion to dismiss pending" },
  { value: "discovery", label: "Discovery underway" },
  { value: "summary-judgment", label: "Summary judgment briefed or pending" },
  { value: "mediation-arbitration", label: "Mediation / arbitration" },
  { value: "trial-scheduled", label: "Trial scheduled" },
  { value: "post-judgment", label: "Post-judgment / collection" },
  { value: "appeal", label: "On appeal" },
  { value: "other", label: "Other (describe in notes)" },
];

// ═══════════════════════════════════════════════════════
// LOADING PHASES — used by the analytical-theater UI
// ═══════════════════════════════════════════════════════

const LOADING_PHASES = [
  "Reviewing intake completeness",
  "Analyzing legal theory",
  "Evaluating collectibility",
  "Mapping evidence gaps",
  "Modeling expected value",
  "Finalizing recommendation",
];

const PHASE_DURATION_MS = 10000;
const REVIEWING_HOLD_MS = 15000;

const FINALIZING_SUBSTEPS = [
  "Finalizing analysis",
  "Stress-testing downside scenarios",
  "Calibrating confidence intervals",
  "Cross-checking comparable outcomes",
  "Drafting investment memo",
  "Polishing recommendation",
  "Almost there — complex cases take a moment longer",
];

const SUBSTEP_DURATION_MS = 6000;

/* ═══════════════════════════════════════════════════════
   TERMS & CONDITIONS
   ═══════════════════════════════════════════════════════ */

const TERMS_TEXT = `By submitting information, documents or materials through this website (the "Submission"), you ("Submitter") agree to the following terms:

1. PURPOSE OF SUBMISSION
The Submission is made solely for the purpose of enabling Henley Lord Holdings, a Delaware limited liability company ("Henley"), to evaluate a potential litigation finance transaction. No other purpose is intended or authorized.

2. CONFIDENTIALITY
Henley agrees to treat the information provided in the Submission as confidential and to use it solely for the purpose of evaluating a potential transaction. Henley may disclose such information only to:
  • its employees, officers, directors and affiliates;
  • its external legal, financial, technical or strategic advisors;
  • current or prospective investors, fund vehicles, or financing sources;
  • insurers, auditors or compliance providers;
provided that such recipients are subject to confidentiality obligations (contractual, professional or fiduciary).

Confidentiality obligations shall not apply to information that:
  (a) is or becomes publicly available other than through breach of these terms;
  (b) was already lawfully known to Henley prior to the Submission;
  (c) is independently developed without use of the submitted information;
  (d) is required to be disclosed by law, regulation or court order.

3. NO ATTORNEY-CLIENT RELATIONSHIP
The Submission does not create any attorney-client relationship, fiduciary relationship, partnership, joint venture, or agency relationship between the Submitter and Henley. Henley does not provide legal advice.

4. NO OBLIGATION TO FINANCE
Henley has no obligation to enter into any transaction, provide funding, or continue discussions. Any financing arrangement shall only arise pursuant to a definitive written agreement executed by authorized representatives of Henley.

5. SIMILAR OPPORTUNITIES
Submitter acknowledges that:
  • Henley may currently be evaluating or financing matters similar to the Submission;
  • Henley may independently develop or receive information similar to the Submission;
  • nothing in these terms restricts Henley from pursuing opportunities that are similar to or competitive with the Submission, provided that Henley does not misuse confidential information in breach of these terms.

6. NO EXCLUSIVITY
Submission of information does not grant exclusivity, priority rights, or any right to compensation unless expressly agreed in writing.

7. ACCURACY OF INFORMATION
Submitter represents that:
  • it is authorized to share the submitted information;
  • disclosure does not violate any applicable confidentiality obligation;
  • the information provided is accurate to the best of its knowledge.

8. LIMITATION OF LIABILITY
Henley shall not be liable for any indirect, incidental, consequential or punitive damages arising out of or relating to the Submission or evaluation process.

9. DATA PROTECTION
Personal data, if any, will be processed solely for the purpose of evaluating the potential transaction and in accordance with applicable data protection laws and Henley's Privacy Policy.

10. GOVERNING LAW AND JURISDICTION
These Terms shall be governed by the laws of the State of Delaware, without regard to conflict of law principles. Any dispute arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Delaware.

11. ACCEPTANCE
By checking the acceptance box and submitting the form, the Submitter acknowledges and agrees to be legally bound by these Terms.`;

/* ═══════════════════════════════════════════════════════
   STEP COMPLETENESS
   ═══════════════════════════════════════════════════════ */

function isStepComplete(step: number, form: FormData, files: FileAttachment[]): boolean {
  switch (step) {
    case 1: return form.caseNarrative.trim().length > 0 && form.proceduralStep.trim().length > 0;
    case 2: return form.defendantProfile.trim().length > 0;
    case 3: return form.fundingRequest.trim().length > 0;
    case 4: return true;
    case 5: return true;
    case 6: return form.contactName.trim().length > 0 && form.contactEmail.trim().length > 0 && form.termsAccepted;
    default: return false;
  }
}

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
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 45; i++) {
      pts.push({ x: Math.random() * c.width, y: Math.random() * c.height, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, r: Math.random() * 1.2 + 0.3, o: Math.random() * 0.15 + 0.04 });
    }
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = c.width; if (p.x > c.width) p.x = 0;
        if (p.y < 0) p.y = c.height; if (p.y > c.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120,180,255,${p.o})`; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < 130) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(120,180,255,${0.025 * (1 - d / 130)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

/* ═══════════════════════════════════════════════════════
   STEP NAV
   ═══════════════════════════════════════════════════════ */

function StepNav({ current, form, files, visitedSteps, onNavigate }: {
  current: number;
  form: FormData;
  files: FileAttachment[];
  visitedSteps: Set<number>;
  onNavigate: (step: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, idx) => {
        const complete = visitedSteps.has(step.num) && isStepComplete(step.num, form, files);
        const active = current === step.num;
        return (
          <div key={step.num} className="flex items-center">
            <button
              type="button"
              onClick={() => onNavigate(step.num)}
              className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-200 ${
                active ? "bg-sky-500 text-white shadow-[0_0_16px_rgba(74,158,255,0.4)]"
                : complete ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-white/[0.05] text-slate-500 border border-white/[0.1]"
              }`}>
                {complete && !active ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : step.num}
              </div>
              <span className={`text-[11px] font-medium tracking-wide hidden sm:block transition-colors ${active ? "text-sky-400" : complete ? "text-emerald-400/70" : "text-slate-500"}`}>
                {step.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`w-6 h-px mx-1 transition-colors duration-300 ${complete ? "bg-emerald-500/30" : "bg-white/[0.07]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FIELD WRAPPER
   ═══════════════════════════════════════════════════════ */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold uppercase tracking-[0.1em] mb-1 text-sky-400/90">{label}</label>
      {hint && <p className="text-[15px] text-slate-400 mb-3 leading-relaxed">{hint}</p>}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LOADING UI — phase rotation with do-not-refresh banner
   ═══════════════════════════════════════════════════════ */

type LoadingStage = "phases" | "reviewing" | "finalizing";

function LoadingUI({ activePhase, stage, finalizingSubstep }: { 
  activePhase: number; 
  stage: LoadingStage; 
  finalizingSubstep: number;
}) {
  const allPhasesComplete = stage !== "phases";

  return (
    <div className="anim-in">
      <div className="rounded-xl border border-amber-400/25 bg-amber-500/[0.07] px-5 py-4 mb-8">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-[15px] font-semibold text-amber-200 leading-tight mb-1">Do not refresh this page</p>
            <p className="text-sm text-amber-200/70 leading-relaxed">Your case is being analyzed. This may take several minutes.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 md:p-8">
        <div className="space-y-4">
          {LOADING_PHASES.map((phase, idx) => {
            const isComplete = allPhasesComplete || idx < activePhase;
            const isActive = !allPhasesComplete && idx === activePhase;
            const isPending = !allPhasesComplete && idx > activePhase;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  isPending ? "opacity-30" : "opacity-100"
                }`}
              >
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  {isComplete && (
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  {isActive && (
                    <span className="relative flex w-3 h-3">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" style={{ animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
                      <span className="relative inline-flex w-3 h-3 rounded-full bg-sky-400" />
                    </span>
                  )}
                  {isPending && (
                    <div className="w-2 h-2 rounded-full border border-slate-600" />
                  )}
                </div>

                <span
                  className={`text-[15px] transition-colors duration-300 ${
                    isComplete ? "text-slate-400" : isActive ? "text-sky-300 font-medium" : "text-slate-500"
                  }`}
                >
                  {phase}
                  {isActive && <span className="text-sky-400/60">…</span>}
                </span>
              </div>
            );
          })}

          {stage === "reviewing" && (
            <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06] mt-4">
              <span className="relative flex w-3 h-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" style={{ animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
                <span className="relative inline-flex w-3 h-3 rounded-full bg-sky-400" />
              </span>
              <span className="text-[15px] text-sky-300 font-medium">
                Reviewing analysis<span className="text-sky-400/60">…</span>
              </span>
            </div>
          )}

{stage === "finalizing" && (
            <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06] mt-4">
              <span className="relative flex w-3 h-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" style={{ animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
                <span className="relative inline-flex w-3 h-3 rounded-full bg-sky-400" />
              </span>
              <span className="text-[15px] text-sky-300 font-medium transition-opacity duration-300">
                {FINALIZING_SUBSTEPS[finalizingSubstep]}<span className="text-sky-400/60">…</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RANKING BADGE — single labeled badge for the acknowledgment screen
   ═══════════════════════════════════════════════════════ */

type BadgeTone = "emerald" | "sky" | "amber" | "slate";

function RankingBadge({ label, value, tone }: { label: string; value: string; tone: BadgeTone }) {
  const toneClasses: Record<BadgeTone, { border: string; bg: string; text: string; dot: string }> = {
    emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/[0.06]", text: "text-emerald-300", dot: "bg-emerald-400" },
    sky:     { border: "border-sky-400/30",     bg: "bg-sky-500/[0.06]",     text: "text-sky-300",     dot: "bg-sky-400" },
    amber:   { border: "border-amber-400/30",   bg: "bg-amber-500/[0.06]",   text: "text-amber-300",   dot: "bg-amber-400" },
    slate:   { border: "border-white/[0.1]",    bg: "bg-white/[0.025]",      text: "text-slate-300",   dot: "bg-slate-400" },
  };
  const t = toneClasses[tone];
  return (
    <div className={`rounded-xl border ${t.border} ${t.bg} px-5 py-4`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 mb-2">{label}</p>
      <div className="flex items-center gap-2.5">
        <div className={`w-2 h-2 rounded-full ${t.dot} shrink-0`} />
        <span className={`text-[15px] font-medium leading-tight ${t.text}`}>{value}</span>
      </div>
    </div>
  );
}

function fundabilityTone(v: PublicRankings["fundability"]): BadgeTone {
  if (v === "Likely") return "emerald";
  if (v === "Possible") return "sky";
  if (v === "Unlikely") return "slate";
  return "amber";
}

function completenessTone(v: PublicRankings["completeness"]): BadgeTone {
  if (v === "High") return "emerald";
  if (v === "Medium") return "sky";
  return "amber";
}

function nextStepTone(v: PublicRankings["nextStep"]): BadgeTone {
  if (v === "Under review") return "sky";
  if (v === "More information required") return "amber";
  return "slate";
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */

export default function Home() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [activePhase, setActivePhase] = useState(0);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("phases");
  const [finalizingSubstep, setFinalizingSubstep] = useState(0);
  const [publicRankings, setPublicRankings] = useState<PublicRankings | null>(null);

  const [mode, setMode] = useState<"pick" | "form" | "contact">("pick");

  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [intakeTurnstileToken, setIntakeTurnstileToken] = useState<string | null>(null);
  const [contactTurnstileToken, setContactTurnstileToken] = useState<string | null>(null);
  const [contactError, setContactError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepCardRef = useRef<HTMLDivElement>(null);
  const intakeTurnstileRef = useRef<HTMLDivElement>(null);
  const contactTurnstileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!loading) return;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const tick = () => {
      setActivePhase((prev) => {
        const next = prev + 1;
        if (next < LOADING_PHASES.length) {
          timeoutId = setTimeout(tick, PHASE_DURATION_MS);
          return next;
        } else {
          setLoadingStage("reviewing");
          timeoutId = setTimeout(() => setLoadingStage("finalizing"), REVIEWING_HOLD_MS);
          return prev;
        }
      });
    };
    timeoutId = setTimeout(tick, PHASE_DURATION_MS);
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [loading]);

  useEffect(() => {
    if (mode !== "form" || currentStep !== 6) return;
    if (!intakeTurnstileRef.current) return;
    let widgetId: string | undefined;
    const renderWidget = () => {
      if (!window.turnstile || !intakeTurnstileRef.current) return false;
      widgetId = window.turnstile.render(intakeTurnstileRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
        callback: (token: string) => setIntakeTurnstileToken(token),
        "expired-callback": () => setIntakeTurnstileToken(null),
        theme: "dark",
      });
      return true;
    };
    if (!renderWidget()) {
      const interval = setInterval(() => { if (renderWidget()) clearInterval(interval); }, 100);
      return () => clearInterval(interval);
    }
    return () => { if (widgetId && window.turnstile) window.turnstile.reset(widgetId); };
  }, [mode, currentStep]);

  useEffect(() => {
    if (mode !== "contact" || contactSent) return;
    if (!contactTurnstileRef.current) return;
    let widgetId: string | undefined;
    const renderWidget = () => {
      if (!window.turnstile || !contactTurnstileRef.current) return false;
      widgetId = window.turnstile.render(contactTurnstileRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
        callback: (token: string) => setContactTurnstileToken(token),
        "expired-callback": () => setContactTurnstileToken(null),
        theme: "dark",
      });
      return true;
    };
    if (!renderWidget()) {
      const interval = setInterval(() => { if (renderWidget()) clearInterval(interval); }, 100);
      return () => clearInterval(interval);
    }
    return () => { if (widgetId && window.turnstile) window.turnstile.reset(widgetId); };
  }, [mode, contactSent]);

  const set = useCallback(<K extends keyof FormData,>(k: K, v: FormData[K]) => setForm((f) => ({ ...f, [k]: v })), []);

  const fmtCurrency = (s: string) => {
    const d = s.replace(/\D/g, "");
    return d ? Number(d).toLocaleString("en-US") : "";
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const goToStep = (step: number) => {
    setVisitedSteps((prev) => new Set(prev).add(currentStep));
    setCurrentStep(step);
    setTimeout(() => stepCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const nextStep = () => { if (currentStep < 6) goToStep(currentStep + 1); };
  const prevStep = () => { if (currentStep > 1) goToStep(currentStep - 1); };

  const processFiles = async (fileList: FileList) => {
    const newFiles: FileAttachment[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > 50 * 1024 * 1024) { setError(`File "${file.name}" exceeds 50MB limit.`); continue; }
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => { const result = reader.result as string; resolve(result.split(",")[1] || result); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      newFiles.push({ name: file.name, type: file.type, content: base64 });
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files); };
  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const submit = async () => {
    setError("");
    setPublicRankings(null);
    setActivePhase(0);
    setLoadingStage("phases");
    setLoading(true);
    try {
      const payload = { ...form, attachments: files.length > 0 ? files : undefined, turnstileToken: intakeTurnstileToken };
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Error ${res.status}`);
      }
      const data = await res.json();
      if (!data?.public?.completeness || !data?.public?.fundability || !data?.public?.nextStep) {
        throw new Error("Unexpected response shape from analysis service.");
      }
      setPublicRankings(data.public);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitContact = async () => {
    setContactError("");
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      setContactError("Please fill in name, email, and message.");
      return;
    }
    setContactSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contactForm, turnstileToken: contactTurnstileToken }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `Error ${res.status}`);
      }
      setContactSent(true);
      setContactForm({ name: "", email: "", message: "" });
    } catch (e: unknown) {
      setContactError(e instanceof Error ? e.message : "Failed to send message.");
    } finally {
      setContactSending(false);
    }
  };

  const inputCls = "w-full bg-transparent text-base text-slate-200 placeholder:text-slate-500/50 outline-none border-b border-white/[0.08] pb-2 focus:border-sky-400/40 transition-colors disabled:opacity-30";
  const textareaCls = "w-full bg-transparent resize-y text-base leading-relaxed text-slate-200 placeholder:text-slate-500/50 outline-none disabled:opacity-30";

  const canSubmit = isStepComplete(6, form, files) && !loading && !!intakeTurnstileToken;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-7">
            <Field label="Case Narrative" hint="Describe the alleged wrongdoing, how it was discovered, and the key facts supporting your claim.">
              <textarea rows={6} value={form.caseNarrative} disabled={loading} onChange={(e) => set("caseNarrative", e.target.value)} onFocus={() => setFocus("caseNarrative")} onBlur={() => setFocus(null)} placeholder="Begin typing..." className={textareaCls} />
            </Field>
            <Field label="Jurisdiction" hint="Identify the court or jurisdiction — e.g., Southern District of New York, Miami-Dade County Circuit Court.">
              <input type="text" value={form.jurisdiction} disabled={loading} onChange={(e) => set("jurisdiction", e.target.value)} onFocus={() => setFocus("jurisdiction")} onBlur={() => setFocus(null)} placeholder="Begin typing..." className={inputCls} />
            </Field>
            <Field label="Current Procedural Step" hint="Where the matter currently stands in its litigation lifecycle.">
              <div className="relative">
                <select
                  value={form.proceduralStep}
                  disabled={loading}
                  onChange={(e) => set("proceduralStep", e.target.value)}
                  onFocus={() => setFocus("proceduralStep")}
                  onBlur={() => setFocus(null)}
                  className="w-full bg-transparent text-base text-slate-200 outline-none border-b border-white/[0.08] pb-2 pr-8 focus:border-sky-400/40 transition-colors disabled:opacity-30 appearance-none cursor-pointer"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="" disabled style={{ background: "#162036", color: "#94a3b8" }}>Select procedural status...</option>
                  {PROCEDURAL_STEPS.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: "#162036", color: "#e2e8f0" }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <svg className="w-4 h-4 absolute right-1 top-2 pointer-events-none text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              <textarea
                rows={2}
                value={form.proceduralStepNotes}
                disabled={loading}
                onChange={(e) => set("proceduralStepNotes", e.target.value)}
                onFocus={() => setFocus("proceduralStepNotes")}
                onBlur={() => setFocus(null)}
                placeholder="Optional — add deadlines, hearing dates, or other procedural context..."
                className={`${textareaCls} mt-3 text-sm`}
              />
            </Field>
            <Field label="Key Documents & Legal Basis" hint="Identify the primary legal basis and key supporting documents — contracts, statutes, filings, or precedent.">
              <textarea rows={4} value={form.keyDocuments} disabled={loading} onChange={(e) => set("keyDocuments", e.target.value)} onFocus={() => setFocus("keyDocuments")} onBlur={() => setFocus(null)} placeholder="Begin typing..." className={textareaCls} />
            </Field>
          </div>
        );
      case 2:
        return (
          <div className="space-y-7">
            <Field label="Defendant & Asset Profile" hint="Identify the defendant, their entity type, known assets, insurance coverage, and financial condition.">
              <textarea rows={5} value={form.defendantProfile} disabled={loading} onChange={(e) => set("defendantProfile", e.target.value)} onFocus={() => setFocus("defendantProfile")} onBlur={() => setFocus(null)} placeholder="Begin typing..." className={textareaCls} />
            </Field>
            <Field label="Damages Estimate" hint="Estimated total damages with methodology — lost profits, out-of-pocket, statutory, punitive multipliers.">
              <textarea rows={4} value={form.damagesEstimate} disabled={loading} onChange={(e) => set("damagesEstimate", e.target.value)} onFocus={() => setFocus("damagesEstimate")} onBlur={() => setFocus(null)} placeholder="Begin typing..." className={textareaCls} />
            </Field>
          </div>
        );
      case 3:
        return (
          <div className="space-y-7">
            <Field label="Funding Request" hint="Total litigation funding amount requested in US dollars.">
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-medium font-mono" style={{ color: "rgba(148,163,184,0.35)" }}>$</span>
                <input type="text" inputMode="numeric" value={form.fundingRequest} disabled={loading} onChange={(e) => set("fundingRequest", fmtCurrency(e.target.value))} onFocus={() => setFocus("fundingRequest")} onBlur={() => setFocus(null)} placeholder="250,000" className="w-full bg-transparent text-3xl font-medium text-white placeholder:text-slate-600 outline-none font-mono disabled:opacity-30" />
              </div>
            </Field>
            <Field label="Legal Representation" hint="Current status of legal counsel for this matter.">
              <div className="grid gap-3 sm:grid-cols-3 mt-1">
                {RADIOS.map((opt) => {
                  const active = form.representationStatus === opt.value;
                  return (
                    <button type="button" key={opt.value} disabled={loading} onClick={() => set("representationStatus", opt.value)}
                      className={`text-left rounded-xl border p-4 transition-all duration-200 disabled:opacity-30 ${active ? "border-sky-400/35 bg-sky-500/[0.08]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]"}`}>
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
              <div className="overflow-hidden transition-all duration-500 ease-in-out" style={{ maxHeight: form.representationStatus === "represented" ? "300px" : "0px", opacity: form.representationStatus === "represented" ? 1 : 0, marginTop: form.representationStatus === "represented" ? "14px" : "0px" }}>
                <div className="space-y-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-5">
                  {([
                    { key: "firmName" as keyof FormData, label: "Firm Name", ph: "e.g., Quinn Emanuel Urquhart & Sullivan" },
                    { key: "attorneyName" as keyof FormData, label: "Lead Attorney", ph: "e.g., Jane Smith, Partner" },
                    { key: "feeStructure" as keyof FormData, label: "Fee Structure", ph: "e.g., 40% contingency, hybrid hourly + success fee" },
                  ]).map((sub) => (
                    <div key={sub.key}>
                      <label className="block text-xs font-semibold uppercase tracking-[0.12em] mb-1.5 text-slate-400">{sub.label}</label>
                      <input type="text" value={form[sub.key] as string} disabled={loading} onChange={(e) => set(sub.key, e.target.value)} placeholder={sub.ph} className="w-full bg-transparent border-b border-white/[0.08] pb-2 text-[15px] text-slate-200 placeholder:text-slate-500/40 outline-none focus:border-sky-400/30 transition-colors disabled:opacity-30" />
                    </div>
                  ))}
                </div>
              </div>
            </Field>
          </div>
        );
      case 4:
        return (
          <div className="space-y-7">
            <Field label="Counterclaims" hint="In your assessment, does the defendant have viable grounds for a counterclaim, and do you expect one to be filed? Detail any known or anticipated counterclaims below.">
              <div className="grid gap-3 sm:grid-cols-4 mt-1">
                {COUNTERCLAIM_OPTS.map((opt) => {
                  const active = form.counterclaimsStatus === opt.value;
                  return (
                    <button type="button" key={opt.value} disabled={loading} onClick={() => set("counterclaimsStatus", opt.value)}
                      className={`text-left rounded-xl border p-4 transition-all duration-200 disabled:opacity-30 ${active ? "border-sky-400/35 bg-sky-500/[0.08]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]"}`}>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${active ? "border-sky-400" : "border-slate-500"}`}>
                          {active && <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                        </div>
                        <span className="text-[15px] font-medium text-slate-200">{opt.label}</span>
                      </div>
                      <p className="text-sm text-slate-400 pl-6 leading-snug">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
              {(form.counterclaimsStatus === "filed" || form.counterclaimsStatus === "threatened") && (
                <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-5">
                  <label className="block text-xs font-semibold uppercase tracking-[0.12em] mb-2 text-slate-400">
                    {form.counterclaimsStatus === "filed" ? "Counterclaim Details" : "Nature of Threatened Counterclaim"}
                  </label>
                  <textarea rows={3} value={form.counterclaimDescription} disabled={loading} onChange={(e) => set("counterclaimDescription", e.target.value)} onFocus={() => setFocus("counterclaimDescription")} onBlur={() => setFocus(null)}
                    placeholder={form.counterclaimsStatus === "filed" ? "Describe the theory, claimed amount, and current procedural status..." : "Describe what the defendant has indicated they intend to claim and on what basis..."}
                    className={textareaCls} />
                </div>
              )}
            </Field>
          </div>
        );
      case 5:
        return (
          <div className="space-y-5">
            <Field label="Supporting Documents" hint="Upload contracts, complaints, evidence, or other supporting documents. Max 50MB per file. This step is optional.">
              <div className="mt-1"
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={`relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 ${dragActive ? "border-sky-400/50 bg-sky-500/[0.06]" : "border-white/[0.1] bg-white/[0.015] hover:border-white/[0.18] hover:bg-white/[0.03]"}`}>
                  <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.csv,.xls,.xlsx"
                    onChange={(e) => { if (e.target.files?.length) processFiles(e.target.files); e.target.value = ""; }} disabled={loading} />
                  <svg className="w-8 h-8 mx-auto mb-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                  <p className="text-sm text-slate-400"><span className="text-sky-400 font-medium">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, DOC, TXT, images, spreadsheets</p>
                </div>
              </div>
            </Field>
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <svg className="w-4 h-4 shrink-0 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="text-sm text-slate-300 truncate">{f.name}</span>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} className="shrink-0 text-slate-500 hover:text-red-400 transition-colors ml-3">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {files.length === 0 && (
              <p className="text-sm text-slate-500 text-center pt-2">No documents uploaded — you can proceed without attachments.</p>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-7">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-5 py-4">
              <p className="text-[14px] text-slate-400 leading-relaxed">Your contact information is collected before analysis so our team can follow up regardless of outcome. Every submission is reviewed — even cases we can&apos;t fund today may be opportunities down the road.</p>
            </div>
            <Field label="Full Name">
              <input type="text" value={form.contactName} disabled={loading} onChange={(e) => set("contactName", e.target.value)} onFocus={() => setFocus("contactName")} onBlur={() => setFocus(null)} placeholder="Your full name" className={inputCls} />
            </Field>
            <Field label="Email Address">
              <input type="email" value={form.contactEmail} disabled={loading} onChange={(e) => set("contactEmail", e.target.value)} onFocus={() => setFocus("contactEmail")} onBlur={() => setFocus(null)} placeholder="you@example.com" className={inputCls} />
            </Field>
            <Field label="Phone Number" hint="Optional — for cases where a call is warranted.">
              <input type="tel" value={form.contactPhone} disabled={loading} onChange={(e) => set("contactPhone", e.target.value)} onFocus={() => setFocus("contactPhone")} onBlur={() => setFocus(null)} placeholder="+1 (555) 000-0000" className={inputCls} />
            </Field>

            <div className="pt-4 border-t border-white/[0.06]">
              <Field label="Terms & Conditions" hint="Please review the terms below before submitting your case.">
                <div className="mt-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 max-h-64 overflow-y-auto">
                  <pre className="text-[13px] text-slate-400 leading-relaxed whitespace-pre-wrap font-sans">{TERMS_TEXT}</pre>
                </div>
                <label className="flex items-start gap-3 mt-4 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.termsAccepted}
                    disabled={loading}
                    onChange={(e) => set("termsAccepted", e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-2 border-white/[0.15] bg-white/[0.04] cursor-pointer accent-sky-500 disabled:opacity-30 shrink-0"
                  />
                  <span className="text-[14px] text-slate-300 leading-relaxed group-hover:text-slate-200 transition-colors">
                  I have read and agree to the Terms & Conditions above and the{" "}<a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">Privacy Policy</a>. I acknowledge that by submitting, I am entering into a legally binding agreement with Henley Lord Holdings.
                  </span>
                </label>
                <div ref={intakeTurnstileRef} className="mt-4" />
              </Field>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const showWizard = mode === "form" && !loading && !publicRankings;

  return (
    <>
    <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        async
        defer
        strategy="afterInteractive"
      />
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
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        .anim-up { opacity: 0; animation: fadeUp 0.5s ease-out forwards; }
        .anim-in { opacity: 0; animation: fadeIn 0.3s ease-out forwards; }
        .glow-line { height: 1px; background: linear-gradient(90deg, transparent, var(--accent), transparent); opacity: 0.2; }
      `}</style>

      <Particles />

      <div className="relative z-10">

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
              <button onClick={scrollToForm} className="text-[15px] font-medium text-sky-400 px-5 py-2.5 rounded-lg border border-sky-400/40 bg-transparent hover:bg-sky-400/10 hover:border-sky-400/60 transition-all duration-200">Submit a Case</button>
            </nav>
            <button onClick={scrollToForm} className="md:hidden text-sm font-medium text-sky-400 px-4 py-2 rounded-lg border border-sky-400/40 bg-transparent">Submit a Case</button>
          </div>
        </header>

        <section className="relative min-h-[80vh] flex items-center justify-center px-6 pt-16 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(74,158,255,0.07) 0%, transparent 70%)" }} />
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="anim-up" style={{ animationDelay: "0.1s" }}>
              <p className="font-mono text-sm tracking-[0.2em] uppercase mb-5" style={{ color: "var(--gold)" }}>AI-Powered Litigation Funding</p>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl md:text-[4.5rem] font-semibold text-white leading-[1.08] mb-5 anim-up" style={{ animationDelay: "0.2s" }}> Non-recourse capital for commercial litigation</h1>
            <p className="text-lg md:text-xl text-slate-300 font-light leading-relaxed max-w-2xl mx-auto mb-8 anim-up" style={{ animationDelay: "0.3s" }}>
              Underwrite litigation funding in days, not months. Our AI engine evaluates legal merit, collectibility, and expected value to deliver institutional-grade funding decisions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 anim-up" style={{ animationDelay: "0.4s" }}>
              <button onClick={scrollToForm} className="px-8 py-4 rounded-xl text-white font-semibold text-base transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(74,158,255,0.25)]" style={{ background: "linear-gradient(135deg, #4a9eff 0%, #2563eb 100%)" }}>Submit Your Case</button>
              <a href="#how-it-works" className="px-8 py-4 rounded-xl text-slate-200 font-medium text-base border border-white/[0.1] bg-white/[0.04] hover:border-white/[0.2] hover:bg-white/[0.06] transition-all duration-200">How It Works</a>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 anim-up" style={{ animationDelay: "0.5s" }}>
              {["Pre-Suit Specialist", "Rapid Underwriting", "§0–§5 Risk Framework", "Institutional Grade"].map((t) => (
                <span key={t} className="text-xs tracking-wider uppercase text-slate-400 font-mono">{t}</span>
              ))}
            </div>
          </div>
        </section>

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
                  <p className="text-[15px] text-slate-300 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

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
                  <p className="text-sm text-slate-300 leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="submit" className="py-16 px-6" ref={formRef}>
          <div className="max-w-[720px] mx-auto">

            {loading && (
              <div ref={stepCardRef}>
                <div className="text-center mb-10">
                  <p className="font-mono text-sm tracking-[0.2em] uppercase mb-3" style={{ color: "var(--gold)" }}>Analysis in Progress</p>
                  <h2 className="font-display text-3xl md:text-4xl text-white font-semibold mb-3">Reviewing your case</h2>
                </div>
                <LoadingUI activePhase={activePhase} stage={loadingStage} finalizingSubstep={finalizingSubstep} />
              </div>
            )}

            {!loading && publicRankings && (
              <div className="anim-in" ref={stepCardRef}>
                <div className="text-center mb-10">
                  <p className="font-mono text-sm tracking-[0.2em] uppercase mb-3" style={{ color: "var(--gold)" }}>Submission Received</p>
                  <h2 className="font-display text-3xl md:text-4xl text-white font-semibold mb-3">Thank you for your submission</h2>
                </div>

                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-5 py-4 mb-8">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    <div>
                      <p className="text-[15px] font-semibold text-emerald-200 leading-tight mb-1">Submission received</p>
                      <p className="text-sm text-emerald-200/80 leading-relaxed">Thank you for submitting your information. Our team will be in touch within 1–2 business days.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 md:p-8">
                  <div className="grid sm:grid-cols-3 gap-4 mb-6">
                    <RankingBadge label="Completeness" value={publicRankings.completeness} tone={completenessTone(publicRankings.completeness)} />
                    <RankingBadge label="Fundability" value={publicRankings.fundability} tone={fundabilityTone(publicRankings.fundability)} />
                    <RankingBadge label="Next Step" value={publicRankings.nextStep} tone={nextStepTone(publicRankings.nextStep)} />
                  </div>

                  <div className="pt-5 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1">Estimated Response Time</p>
                        <p className="text-[15px] text-slate-200 font-medium">1–2 business days</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-slate-400 mt-8">
                  If you have additional information, please contact{" "}<a href="mailto:info@henleyai.com" className="text-sky-400 hover:text-sky-300 transition-colors">info@henleyai.com</a>.
                </p>
              </div>
            )}

            {!loading && !publicRankings && mode === "pick" && (
              <div className="anim-in">
                <div className="text-center mb-10">
                  <p className="font-mono text-sm tracking-[0.2em] uppercase mb-3" style={{ color: "var(--gold)" }}>Get Started</p>
                  <h2 className="font-display text-3xl md:text-4xl text-white font-semibold mb-3">How can we help you?</h2>
                  <p className="text-base text-slate-300 font-light max-w-md mx-auto">Choose the option that best fits your needs.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <button
                    type="button"
                    onClick={() => { setMode("form"); setTimeout(() => stepCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80); }}
                    className="group relative text-left rounded-2xl border border-sky-400/40 bg-sky-500/[0.06] p-8 shadow-[0_0_24px_rgba(74,158,255,0.08)] hover:border-sky-400/60 hover:bg-sky-500/[0.09] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(74,158,255,0.18)] transition-all duration-300"
                  >
                    <span className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-[0.15em] text-sky-400 bg-sky-400/10 border border-sky-400/30 px-2 py-1 rounded">Recommended</span>
                    <div className="w-14 h-14 rounded-2xl border border-sky-400/25 bg-sky-500/[0.08] flex items-center justify-center text-sky-400 mb-5 group-hover:bg-sky-500/[0.14] transition-colors">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </div>
                    <h3 className="font-display text-2xl text-white font-semibold mb-2">Complete our form</h3>
                    <p className="text-[15px] text-slate-300 leading-relaxed mb-5">Henley AI can underwrite your case and provide an institutional-grade funding decision.</p>
                    <div className="flex items-center gap-2 text-sky-400 font-medium text-[15px]">
                      Submit a case
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode("contact"); setTimeout(() => stepCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80); }}
                    className="group text-left rounded-2xl border border-white/[0.08] bg-white/[0.035] p-8 hover:border-sky-400/30 hover:bg-sky-500/[0.04] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(74,158,255,0.12)] transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-2xl border border-sky-400/25 bg-sky-500/[0.08] flex items-center justify-center text-sky-400 mb-5 group-hover:bg-sky-500/[0.14] transition-colors">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <h3 className="font-display text-2xl text-white font-semibold mb-2">Contact us</h3>
                    <p className="text-[15px] text-slate-300 leading-relaxed mb-5">Have questions or comments? Send us a message and our team will respond as soon as possible.</p>
                    <div className="flex items-center gap-2 text-sky-400 font-medium text-[15px]">
                      Write to us
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {!loading && !publicRankings && mode === "contact" && (
              <div className="anim-in" ref={stepCardRef}>
                <div className="text-center mb-8">
                  <p className="font-mono text-sm tracking-[0.2em] uppercase mb-3" style={{ color: "var(--gold)" }}>Contact</p>
                  <h2 className="font-display text-3xl md:text-4xl text-white font-semibold mb-3">Write to us</h2>
                  <p className="text-base text-slate-300 font-light max-w-md mx-auto">We&apos;ll get back to you as soon as possible.</p>
                </div>

                <button
                  type="button"
                  onClick={() => { setMode("pick"); setContactSent(false); setContactError(""); }}
                  className="flex items-center gap-2 mb-5 px-4 py-2 rounded-xl border border-white/[0.1] text-slate-300 text-sm font-medium transition-all duration-200 hover:border-white/[0.2] hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                  Back
                </button>

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 md:p-8">
                  {contactSent ? (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                        <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <h3 className="font-display text-2xl text-white font-semibold mb-2">Message sent</h3>
                      <p className="text-[15px] text-slate-400 mb-6">Thanks for reaching out. We&apos;ll be in touch shortly.</p>
                      <button
                        type="button"
                        onClick={() => { setMode("pick"); setContactSent(false); }}
                        className="px-6 py-2.5 rounded-xl border border-white/[0.1] text-slate-300 text-sm font-medium transition-all duration-200 hover:border-white/[0.2] hover:text-white"
                      >
                        Back to home
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-7">
                      <Field label="Full Name">
                        <input type="text" value={contactForm.name} disabled={contactSending} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Your full name" className={inputCls} />
                      </Field>
                      <Field label="Email Address">
                        <input type="email" value={contactForm.email} disabled={contactSending} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="you@example.com" className={inputCls} />
                      </Field>
                      <Field label="Message" hint="Tell us what's on your mind.">
                        <textarea rows={6} value={contactForm.message} disabled={contactSending} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} placeholder="Your message..." className={textareaCls} />
                      </Field>

                      {contactError && (
                        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-4 text-[15px] text-red-400">{contactError}</div>
                      )}

                      <div ref={contactTurnstileRef} />

                      <div className="flex justify-end pt-2 border-t border-white/[0.06]">
                        <button
                          type="button"
                          onClick={submitContact}
                          disabled={contactSending || !contactTurnstileToken}
                          className="flex items-center gap-2.5 px-8 py-3 rounded-xl text-white font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(74,158,255,0.2)]"
                          style={{ background: "linear-gradient(135deg, #4a9eff 0%, #2563eb 100%)" }}
                        >
                          {contactSending ? (
                            <>
                              <svg className="w-5 h-5" style={{ animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="50 20" /></svg>
                              Sending…
                            </>
                          ) : (
                            <>
                              Send Message
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showWizard && (
              <>
                <div className="text-center mb-10">
                  <p className="font-mono text-sm tracking-[0.2em] uppercase mb-3" style={{ color: "var(--gold)" }}>Case Intake</p>
                  <h2 className="font-display text-3xl md:text-4xl text-white font-semibold mb-3">Submit Your Case</h2>
                  <p className="text-base text-slate-300 font-light max-w-md mx-auto">Complete each section and our underwriting engine will analyze your case.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setMode("pick")}
                  className="flex items-center gap-2 mb-5 px-4 py-2 rounded-xl border border-white/[0.1] text-slate-300 text-sm font-medium transition-all duration-200 hover:border-white/[0.2] hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                  Back to options
                </button>

                <StepNav current={currentStep} form={form} files={files} visitedSteps={visitedSteps} onNavigate={goToStep} />

                <div ref={stepCardRef} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 md:p-8 anim-in" key={currentStep}>
                  <div className="flex items-center justify-between mb-7">
                    <div>
                      <p className="font-mono text-xs text-slate-500 uppercase tracking-[0.15em] mb-1">Step {currentStep} of {STEPS.length}</p>
                      <h3 className="font-display text-2xl text-white font-semibold">{STEPS[currentStep - 1].label}</h3>
                    </div>
                    <span className="font-mono text-[40px] font-bold leading-none select-none" style={{ color: "rgba(74,158,255,0.07)" }}>0{currentStep}</span>
                  </div>

                  {renderStep()}

                  {error && currentStep === 6 && (
                    <div className="mt-5 rounded-xl border border-red-500/25 bg-red-500/[0.06] p-4 text-[15px] text-red-400">{error}</div>
                  )}

                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
                    <button type="button" onClick={prevStep} disabled={currentStep === 1}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.1] text-slate-300 text-sm font-medium transition-all duration-200 hover:border-white/[0.2] hover:text-white disabled:opacity-0 disabled:pointer-events-none">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                      Back
                    </button>

                    {currentStep < 6 ? (
                      <button type="button" onClick={nextStep}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:brightness-110"
                        style={{ background: "linear-gradient(135deg, #4a9eff 0%, #2563eb 100%)" }}>
                        Continue
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                      </button>
                    ) : (
                      <button type="button" onClick={submit} disabled={!canSubmit}
                        className="flex items-center gap-2.5 px-8 py-3 rounded-xl text-white font-semibold text-base transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(74,158,255,0.2)]"
                        style={{ background: canSubmit ? "linear-gradient(135deg, #4a9eff 0%, #2563eb 100%)" : "rgba(74,158,255,0.2)" }}>
                        Submit & Accept Terms
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

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
                <p className="text-[15px] text-slate-400 leading-relaxed max-w-xs">AI-powered underwriting for pre-suit litigation funding. Institutional-grade analysis, delivered rapidly.</p>
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
              <p className="text-sm text-white font-mono"> Non-recourse capital for commercial litigation</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}