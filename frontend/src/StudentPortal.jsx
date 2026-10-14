import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BedDouble,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  FileText,
  Heart,
  Home,
  Loader2,
  LogOut,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Utensils,
  User,
} from "lucide-react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useOutletContext,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { analyzeStudentComplaint } from "./api";

const MIN_DESCRIPTION_LENGTH = 20;
const MAX_DESCRIPTION_LENGTH = 4000;

const AUTH_KEY = "campuscare-user";
const categories = [
  { name: "Library", icon: BookOpen, description: "Resources, access, or library services" },
  { name: "Student Welfare", icon: Heart, description: "Wellbeing, support, or student services" },
  { name: "Hostel", icon: BedDouble, description: "Accommodation, safety, or maintenance" },
  { name: "Proctor", icon: ShieldCheck, description: "Conduct, safety, or campus concerns" },
  { name: "Gym", icon: Dumbbell, description: "Facilities, access, or equipment" },
  { name: "Food & Mess", icon: Utensils, description: "Dining, food quality, or meal service" },
];

const statusStyles = {
  Draft: "border-slate-200 bg-slate-100 text-slate-700",
  "Awaiting Approval": "border-amber-200 bg-amber-50 text-amber-800",
  Sent: "border-teal-200 bg-teal-50 text-teal-800",
  Failed: "border-rose-200 bg-rose-50 text-rose-800",
};

function recordsKey(email) {
  return `campuscare-student-drafts:${email.trim().toLowerCase()}`;
}

function readMyRecords(email) {
  try {
    const records = JSON.parse(localStorage.getItem(recordsKey(email)) || "[]");
    if (!Array.isArray(records)) return [];
    return records
      .filter((record) => record.studentEmail?.toLowerCase() === email.toLowerCase())
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch {
    return [];
  }
}

function newDraft(email, category = "") {
  return {
    id: "",
    studentEmail: email,
    category,
    subcategory: "",
    classification: null,
    authorityError: "",
    description: "",
    recipient: "",
    recipientEmail: "",
    subject: "",
    letter: "",
    status: "Draft",
    createdAt: "",
    updatedAt: "",
  };
}

function StatusLabel({ status = "Draft" }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[status] || statusStyles.Draft}`}>
      {status}
    </span>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-sm font-semibold text-teal-700">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function PortalLayout({ user, onSignOut }) {
  const navigation = [
    { label: "Home", to: "/dashboard", icon: Home },
    { label: "Lodge a Complaint", to: "/complaints/new", icon: Plus },
    { label: "My Complaints", to: "/complaints", icon: FileText },
    { label: "Complaint History", to: "/history", icon: Clock3 },
    { label: "My Profile", to: "/profile", icon: User },
  ];
  const firstName = user.name?.trim().split(/\s+/)[0] || "Student";

  return (
    <div className="portal-shell min-h-screen lg:flex">
      <aside className="portal-sidebar flex w-full shrink-0 flex-col px-4 py-5 text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:px-5 lg:py-7">
        <Link to="/dashboard" className="flex items-center gap-3 rounded-lg px-2 py-2" aria-label="CampusCare home">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-400 text-lg font-bold text-slate-950">C</span>
          <span>
            <span className="block text-base font-bold">CampusCare AI</span>
            <span className="block text-xs text-slate-300">Student complaint portal</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="mt-6 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:mt-10 lg:grid-cols-1">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard" || to === "/complaints"}
              className={({ isActive }) => `portal-nav-link ${isActive ? "portal-nav-link-active" : ""}`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 flex items-center gap-3 border-t border-slate-700 px-2 pt-5 lg:mt-auto">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
            {firstName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name || "Student"}</p>
            <p className="truncate text-xs text-slate-300">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="portal-icon-button text-slate-200 hover:bg-slate-700 hover:text-white"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-7 sm:py-9 xl:px-10">
          <Outlet context={{ user }} />
          <footer className="mt-12 border-t border-slate-200 pt-4 text-xs text-slate-500">
            Your saved drafts stay in this browser until student account services are connected.
          </footer>
        </div>
      </main>
    </div>
  );
}

function EmptyComplaints({ history = false }) {
  return (
    <div className="portal-empty-state">
      <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        <FileText size={20} />
      </span>
      <h3 className="text-base font-semibold text-slate-900">{history ? "No complaint history yet" : "No complaints yet"}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">
        {history
          ? "Sent and resolved complaints will appear here once the college tracking service is connected."
          : "When you save a complaint draft on this device, you’ll find it here."}
      </p>
      {!history && (
        <Link to="/complaints/new" className="portal-text-link mt-4">
          Start a complaint <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

function ComplaintRows({ complaints }) {
  if (!complaints.length) return <EmptyComplaints />;
  return (
    <div className="divide-y divide-slate-200">
      {complaints.map((complaint) => (
        <Link key={complaint.id} to={`/complaints/${complaint.id}`} className="complaint-row group">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-slate-900 group-hover:text-teal-800">
                {complaint.subject || complaint.category || "Untitled complaint"}
              </p>
              <StatusLabel status={complaint.status} />
            </div>
            <p className="mt-1 line-clamp-1 text-sm text-slate-600">{complaint.description || "No description added"}</p>
            <p className="mt-2 text-xs text-slate-500">
              {complaint.category || "Category not selected"} <span aria-hidden="true">·</span> Updated {new Date(complaint.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-slate-400 group-hover:text-teal-700" />
        </Link>
      ))}
    </div>
  );
}

function DashboardPage() {
  const { user } = useOutletContext();
  const [complaints, setComplaints] = useState(() => readMyRecords(user.email));
  const navigate = useNavigate();
  const firstName = user.name?.trim().split(/\s+/)[0] || "there";

  useEffect(() => {
    setComplaints(readMyRecords(user.email));
  }, [user.email]);

  return (
    <>
      <section className="portal-welcome mb-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-teal-800">Your campus, your voice</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">Welcome, {firstName}.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Tell us what’s happening. CampusCare helps you prepare a clear complaint and understand the next steps.
          </p>
        </div>
        <Link to="/complaints/new" className="portal-primary-button mt-5 shrink-0 sm:mt-0">
          <Plus size={18} /> Lodge a Complaint
        </Link>
      </section>

      <section aria-labelledby="categories-title" className="mb-9">
        <div className="mb-4">
          <h2 id="categories-title" className="text-lg font-bold text-slate-950">What would you like to report?</h2>
          <p className="mt-1 text-sm text-slate-600">Choose the area that best fits your concern.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map(({ name, icon: Icon, description }) => (
            <button
              key={name}
              type="button"
              onClick={() => navigate(`/complaints/new?category=${encodeURIComponent(name)}`)}
              className="category-option text-left"
            >
              <span className="category-icon"><Icon size={19} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900">{name}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
              </span>
              <ChevronRight size={17} className="shrink-0 text-slate-400" />
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="my-complaints-title" className="portal-section">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="my-complaints-title" className="text-lg font-bold text-slate-950">My Complaints</h2>
            <p className="mt-1 text-sm text-slate-600">Only drafts saved for {user.email} on this device.</p>
          </div>
          <Link to="/complaints" className="portal-text-link">View all <ArrowRight size={15} /></Link>
        </div>
        <ComplaintRows complaints={complaints.slice(0, 4)} />
      </section>

      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500">
        <span className="mt-0.5 shrink-0 text-teal-700"><CheckCircle2 size={14} /></span>
        AI review, official policy lookup, and email sending will be shown here when the college services are connected. No complaint is sent automatically.
      </p>
    </>
  );
}

function ComplaintsPage({ history = false }) {
  const { user } = useOutletContext();
  const [complaints, setComplaints] = useState(() => readMyRecords(user.email));

  useEffect(() => {
    setComplaints(readMyRecords(user.email));
  }, [user.email]);

  return (
    <>
      <PageHeading
        eyebrow={history ? "Your records" : "Your workspace"}
        title={history ? "Complaint History" : "My Complaints"}
        description={history
          ? "Review complaints saved for your account. Sent and resolved records will appear when college tracking is available."
          : "Review and continue the complaint drafts you have saved on this device."}
        action={!history && <Link to="/complaints/new" className="portal-primary-button"><Plus size={17} /> Lodge a Complaint</Link>}
      />
      <section className="portal-section">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">{history ? "Saved history" : "Saved drafts"}</h2>
            <p className="mt-1 text-xs text-slate-500">Stored in this browser for {user.email}</p>
          </div>
          <span className="text-xs text-slate-500">{complaints.length} {complaints.length === 1 ? "record" : "records"}</span>
        </div>
        {complaints.length ? <ComplaintRows complaints={complaints} /> : <EmptyComplaints history={history} />}
      </section>
    </>
  );
}

function ProfilePage() {
  const { user } = useOutletContext();
  return (
    <>
      <PageHeading eyebrow="Your account" title="My Profile" description="The student account currently active in this browser." />
      <section className="portal-section max-w-2xl p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-4 border-b border-slate-200 pb-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-xl font-bold text-teal-800">
            {(user.name || "S").trim().slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-950">{user.name || "Student"}</h2>
            <p className="text-sm text-slate-600">College student</p>
          </div>
        </div>
        <dl className="grid gap-5 sm:grid-cols-2">
          <div><dt className="text-xs font-semibold uppercase text-slate-500">Name</dt><dd className="mt-1 text-sm text-slate-900">{user.name || "Not provided"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-slate-500">College email</dt><dd className="mt-1 break-all text-sm text-slate-900">{user.email}</dd></div>
        </dl>
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900">
          Account verification is not connected in this prototype. Do not use this demo sign-in to submit sensitive or urgent reports.
        </p>
      </section>
    </>
  );
}

function NewComplaintPage() {
  const { user } = useOutletContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const draftId = searchParams.get("draft");
  const categoryParam = searchParams.get("category") || "";
  const [complaint, setComplaint] = useState(() => {
    const existing = draftId && readMyRecords(user.email).find((record) => record.id === draftId);
    return existing || newDraft(user.email, categories.some((item) => item.name === categoryParam) ? categoryParam : "");
  });
  const [step, setStep] = useState(1);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [descriptionError, setDescriptionError] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clarification, setClarification] = useState("");

  useEffect(() => {
    if (draftId) {
      const existing = readMyRecords(user.email).find((record) => record.id === draftId);
      if (existing) setComplaint(existing);
    }
  }, [draftId, user.email]);

  const update = (field, value) => {
    setComplaint((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setSaveError("");
    if (field === "description") setDescriptionError("");
  };

  const saveDraft = (updates = {}) => {
    try {
      const draft = { ...complaint, ...updates };
      const now = new Date().toISOString();
      const record = {
        ...draft,
        id: draft.id || (globalThis.crypto?.randomUUID?.() ?? `draft-${Date.now()}`),
        studentEmail: user.email,
        status: "Draft",
        createdAt: draft.createdAt || now,
        updatedAt: now,
      };
      const records = readMyRecords(user.email).filter((item) => item.id !== record.id);
      localStorage.setItem(recordsKey(user.email), JSON.stringify([record, ...records]));
      setComplaint(record);
      setSaved(true);
      setSaveError("");
      return true;
    } catch {
      setSaveError("This browser could not save the draft. Check available storage and try again.");
      return false;
    }
  };

  const analyzeComplaint = async (clarificationText = "") => {
    if (isAnalyzing) return;
    const description = complaint.description.trim();
    if (description.length < MIN_DESCRIPTION_LENGTH) {
      setDescriptionError(`Add a little more detail (at least ${MIN_DESCRIPTION_LENGTH} characters) so the complaint can be classified.`);
      return;
    }

    setDescriptionError("");
    setAnalysisError("");
    setIsAnalyzing(true);
    try {
      const result = await analyzeStudentComplaint(description, {
        clarification: clarificationText,
        categoryHint: complaint.category,
      });
      const category = result.category || complaint.category;
      const updates = {
        classification: result,
        category,
        subcategory: result.subcategory || "",
        authorityError: result.authority_error || "",
        recipient: result.draft?.recipient_name || "",
        recipientEmail: result.draft?.recipient_email || "",
        subject: result.draft?.subject || "",
        letter: result.draft?.body || "",
      };
      if (!saveDraft(updates)) {
        setAnalysisError("Classification finished, but the draft could not be saved. Retry or save the draft manually.");
        return;
      }
      setStep(2);
    } catch (error) {
      setAnalysisError(error.message || "We could not classify this complaint. Your text is still here; please retry.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const continueWithChosenCategory = () => {
    if (!complaint.category) {
      setAnalysisError("Choose a category to confirm, or add clarification and retry classification.");
      return;
    }
    if (saveDraft()) {
      setAnalysisError("");
      setStep(2);
    }
  };

  return (
    <>
      <PageHeading eyebrow="New complaint" title="Lodge a Complaint" description="Describe the issue in your own words. You can save your progress and return later." />
      <div className="mb-6 grid gap-2 sm:grid-cols-3" aria-label="Complaint steps">
        {["Describe", "Review & letter", "Approve & send"].map((label, index) => {
          const stepNumber = index + 1;
          return (
            <div key={label} className={`step-indicator ${step === stepNumber ? "step-indicator-active" : ""}`}>
              <span className="step-number">{stepNumber}</span>{label}
            </div>
          );
        })}
      </div>

      <div className="complaint-workspace mx-auto grid max-w-5xl items-start gap-5 xl:grid-cols-[minmax(0,1fr)_220px]">
      <section className="portal-section min-w-0 p-5 sm:p-7">
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-slate-950">What happened?</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Start with what happened. You do not need to know which department should handle it.</p>
            <label htmlFor="complaint-description" className="field-label mt-6">Describe your concern <span className="text-rose-700">(required)</span></label>
            <textarea
              id="complaint-description"
              required
              rows={7}
              minLength={MIN_DESCRIPTION_LENGTH}
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={complaint.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Describe the problem you're facing. Include where it happened, when it started, and any steps you've already taken."
              aria-invalid={Boolean(descriptionError)}
              aria-describedby="description-help description-counter description-error"
              className="field-input mt-2 min-h-48 resize-y"
            />
            <div className="mt-2 flex flex-wrap items-start justify-between gap-2 text-xs">
              <p id="description-help" className="max-w-xl leading-5 text-slate-500">Include the details you know. You can clarify anything else if the classification needs it.</p>
              <p id="description-counter" aria-live="polite" className={`shrink-0 font-medium ${complaint.description.length >= MAX_DESCRIPTION_LENGTH ? "text-rose-700" : "text-slate-500"}`}>
                {complaint.description.length.toLocaleString()} / {MAX_DESCRIPTION_LENGTH.toLocaleString()}
              </p>
            </div>
            {complaint.description.length >= MAX_DESCRIPTION_LENGTH && <p className="mt-1 text-xs text-rose-700">Character limit reached. Remove some text to make further changes.</p>}
            {descriptionError && <p id="description-error" role="alert" className="mt-2 text-sm text-rose-700">{descriptionError}</p>}
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-teal-100 bg-teal-50/70 p-3.5">
              <Sparkles size={17} className="mt-0.5 shrink-0 text-teal-800" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-slate-900">How CampusCare AI helps</p>
                <p className="mt-1 text-xs leading-5 text-slate-700">Describe your issue in your own words. Our AI will identify the appropriate department and prepare a formal complaint letter for you to review before sending.</p>
              </div>
            </div>
            {isAnalyzing && <p role="status" aria-live="polite" className="mt-4 flex items-center gap-2 text-sm font-medium text-teal-800"><Loader2 size={17} className="animate-spin" /> Analysing your complaint...</p>}
            {analysisError && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{analysisError}</div>}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-slate-950">Review your complaint and prepare a letter</h2>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">AI classification</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {complaint.classification?.category || (complaint.classification?.requires_clarification ? "Needs clarification" : "Not classified")}
                    {complaint.classification?.subcategory && <span className="font-normal text-slate-600"> · {complaint.classification.subcategory}</span>}
                  </p>
                  {complaint.classification?.requires_clarification && complaint.classification?.clarification_question && <p className="mt-2 text-sm leading-5 text-amber-900">{complaint.classification.clarification_question}</p>}
                </div>
                <ShieldCheck size={19} className="shrink-0 text-teal-800" aria-hidden="true" />
              </div>
              <label htmlFor="corrected-category" className="field-label mt-4">Correct the category if needed</label>
              <select id="corrected-category" value={complaint.category || ""} onChange={(event) => update("category", event.target.value)} className="field-input mt-2 max-w-md">
                <option value="">Choose a category</option>
                {categories.map((category) => <option key={category.name} value={category.name}>{category.name}</option>)}
              </select>
              {complaint.classification?.requires_clarification && (
                <div className="mt-4">
                  <label htmlFor="classification-clarification" className="field-label">Clarify your concern</label>
                  <textarea id="classification-clarification" rows={3} maxLength={1000} value={clarification} onChange={(event) => setClarification(event.target.value)} className="field-input mt-2 resize-y" placeholder="Add the detail requested above, then ask the AI to classify again." />
                  <button type="button" disabled={isAnalyzing || clarification.trim().length < 3} onClick={() => analyzeComplaint(clarification)} className="portal-secondary-button mt-3 disabled:cursor-not-allowed disabled:opacity-60">
                    {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {isAnalyzing ? "Analysing..." : "Retry classification"}
                  </button>
                </div>
              )}
              {analysisError && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{analysisError}</div>}
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="workflow-note">
                <span className="workflow-note-icon"><ShieldCheck size={18} /></span>
                <div><h3 className="font-semibold text-slate-900">Suggested urgency</h3><p className="mt-1 text-sm leading-5 text-slate-600">{complaint.classification?.urgency ? `${complaint.classification.urgency} — an AI suggestion, not an official determination.` : "No urgency suggestion is available yet."}</p></div>
              </div>
              <div className="workflow-note">
                <span className="workflow-note-icon"><BookOpen size={18} /></span>
                <div><h3 className="font-semibold text-slate-900">Official college rules</h3><p className="mt-1 text-sm leading-5 text-slate-600">Policy retrieval is not connected. No policy excerpts or references are available.</p></div>
              </div>
            </div>
            <div className="mt-7 border-t border-slate-200 pt-6">
              <h3 className="font-semibold text-slate-950">Letter draft</h3>
              <p className="mt-1 text-sm text-slate-600">This letter was generated from your description. Review and edit it before any approval step.</p>
              {complaint.authorityError && <p role="alert" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{complaint.authorityError}</p>}
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="letter-recipient" className="field-label">Recipient designation</label>
                  <input id="letter-recipient" value={complaint.recipient} readOnly placeholder="Awaiting verified college authority" className="field-input mt-2 bg-slate-50" />
                </div>
                <div>
                  <label htmlFor="letter-recipient-email" className="field-label">Recipient email</label>
                  <input id="letter-recipient-email" type="email" value={complaint.recipientEmail || ""} readOnly placeholder="No verified college recipient configured" className="field-input mt-2 bg-slate-50" />
                </div>
                <div>
                  <label htmlFor="letter-subject" className="field-label">Subject</label>
                  <input id="letter-subject" value={complaint.subject} onChange={(event) => update("subject", event.target.value)} placeholder="Enter a subject" className="field-input mt-2" />
                </div>
              </div>
              <label htmlFor="letter-body" className="field-label mt-4">Letter</label>
              <textarea id="letter-body" rows={8} value={complaint.letter} onChange={(event) => update("letter", event.target.value)} placeholder="The AI-generated letter will appear here." className="field-input mt-2 resize-y" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-3xl">
            <h2 className="text-lg font-bold text-slate-950">Review before sending</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Check your information carefully. Nothing will be sent from this prototype.</p>
            <div className="mt-5 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div><p className="text-xs font-semibold uppercase text-slate-500">Category</p><p className="mt-1 text-sm font-medium text-slate-900">{complaint.category || "Not selected"}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Your description</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">{complaint.description || "No description"}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Recipient</p><p className="mt-1 text-sm text-slate-800">{complaint.recipient || "Not entered"}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Recipient email</p><p className="mt-1 text-sm text-slate-800">{complaint.recipientEmail || "No configured recipient"}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Subject</p><p className="mt-1 text-sm text-slate-800">{complaint.subject || "Not entered"}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Letter</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">{complaint.letter || "No letter drafted"}</p></div>
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-5 text-amber-950">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p><strong>Email delivery is not connected.</strong> This draft cannot be approved or sent yet. No message has been sent, and no delivery status is available.</p>
            </div>
          </div>
        )}

        {saveError && <p role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{saveError}</p>}
        {saved && <p role="status" className="mt-5 flex items-center gap-2 text-sm text-teal-800"><CheckCircle2 size={17} /> Draft saved on this device.</p>}

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => step === 1 ? navigate("/dashboard") : setStep(step - 1)} className="portal-secondary-button">
            <ArrowLeft size={16} /> {step === 1 ? "Cancel" : "Back"}
          </button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={saveDraft} className="portal-secondary-button"><Save size={16} /> Save draft</button>
            {step < 3 ? (
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={step === 1 ? () => analyzeComplaint() : () => { if (saveDraft()) setStep(3); }}
                className="portal-primary-button disabled:cursor-wait disabled:opacity-60"
              >
                {step === 1 && isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {step === 1 && isAnalyzing ? "Analysing..." : step === 1 ? "Continue to review" : "Review before sending"}
              </button>
            ) : (
              <button type="button" disabled title="Email sending is not connected" className="portal-disabled-button"><Send size={16} /> Approve & send unavailable</button>
            )}
          </div>
        </div>
      </section>
      <aside className="workflow-guide hidden xl:block" aria-label="Three-step complaint workflow">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your next steps</p>
        <ol className="mt-4 space-y-4 text-sm">
          <li className={`workflow-guide-step ${step === 1 ? "current" : ""}`}><span>1</span><div><strong>Describe</strong><p>Explain the issue naturally.</p></div></li>
          <li className={`workflow-guide-step ${step === 2 ? "current" : ""}`}><span>2</span><div><strong>Review & Letter</strong><p>Check the category and draft.</p></div></li>
          <li className={`workflow-guide-step ${step === 3 ? "current" : ""}`}><span>3</span><div><strong>Approve & Send</strong><p>Sending requires your approval.</p></div></li>
        </ol>
      </aside>
      </div>
      <p className="mx-auto mt-4 max-w-5xl text-xs leading-5 text-slate-500">Classification and letter drafting run through the backend Groq service. Policy retrieval and Gmail delivery are not connected. This prototype stores drafts in this browser; authenticated Supabase sessions use the persistent complaint API.</p>
    </>
  );
}

function ComplaintDetailPage() {
  const { user } = useOutletContext();
  const { complaintId } = useParams();
  const complaint = readMyRecords(user.email).find((record) => record.id === complaintId);

  if (!complaint) {
    return (
      <div className="portal-empty-state">
        <h1 className="text-lg font-semibold text-slate-900">Complaint not found</h1>
        <p className="mt-1 text-sm text-slate-600">This complaint is not available in your saved drafts on this device.</p>
        <Link to="/complaints" className="portal-text-link mt-4">Back to My Complaints <ArrowRight size={15} /></Link>
      </div>
    );
  }

  return (
    <>
      <PageHeading eyebrow="Your saved complaint" title={complaint.subject || complaint.category || "Complaint draft"} description={`Last updated ${new Date(complaint.updatedAt).toLocaleString()}`} action={<StatusLabel status={complaint.status} />} />
      <section className="portal-section space-y-5 p-5 sm:p-7">
        <div><p className="field-label">Category</p><p className="mt-1 text-sm text-slate-900">{complaint.category || "Not selected"}</p></div>
        <div><p className="field-label">Description</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">{complaint.description || "No description"}</p></div>
        {complaint.recipient && <div><p className="field-label">Recipient</p><p className="mt-1 text-sm text-slate-900">{complaint.recipient}</p></div>}
        {complaint.subject && <div><p className="field-label">Letter subject</p><p className="mt-1 text-sm text-slate-900">{complaint.subject}</p></div>}
        {complaint.letter && <div><p className="field-label">Letter draft</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">{complaint.letter}</p></div>}
        <div className="border-t border-slate-200 pt-5">
          <p className="text-sm text-slate-600">This record is a local draft. It has not been sent to a college authority.</p>
          <Link to={`/complaints/new?draft=${encodeURIComponent(complaint.id)}`} className="portal-primary-button mt-4"><FileText size={16} /> Continue editing</Link>
        </div>
      </section>
    </>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Enter your college email and password to continue.");
      return;
    }
    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const name = normalizedEmail.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
    onLogin({ name: name || "Student", email: normalizedEmail, role: "College student" });
    setLoading(false);
    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="login-shell flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[1fr_0.82fr]">
        <section className="login-intro flex flex-col justify-between px-7 py-8 text-white sm:px-10 sm:py-10">
          <Link to="/login" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-300 font-bold text-slate-950">C</span>
            <span><span className="block font-bold">CampusCare AI</span><span className="text-xs text-slate-300">College complaint portal</span></span>
          </Link>
          <div className="my-12 max-w-lg">
            <p className="text-sm font-semibold text-teal-200">A clearer path to being heard</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">Your concern deserves a thoughtful response.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-300">Prepare a complaint in your own words, review it carefully, and keep track of your saved drafts.</p>
          </div>
          <p className="text-xs leading-5 text-slate-400">AI review and email delivery will be available after the college services are connected.</p>
        </section>
        <section className="flex items-center justify-center px-6 py-9 sm:px-10">
          <div className="w-full max-w-sm">
            <p className="text-sm font-semibold text-teal-800">Student sign in</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Welcome to CampusCare</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Use your college account to continue to the portal.</p>
            <form onSubmit={submit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="login-email" className="field-label">College email</label>
                <input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@college.edu" className="field-input mt-2" />
              </div>
              <div>
                <label htmlFor="login-password" className="field-label">Password</label>
                <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="field-input mt-2" />
              </div>
              {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
              <button type="submit" disabled={loading} className="portal-primary-button w-full justify-center disabled:cursor-wait disabled:opacity-60">{loading ? "Signing in..." : "Continue"} <ArrowRight size={17} /></button>
            </form>
            <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">Prototype sign-in only: the current app accepts any email and password. College account verification is not connected.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function StudentPortal() {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem(AUTH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (account) => {
    setUser(account);
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(account));
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />} />
      <Route element={user ? <PortalLayout user={user} onSignOut={handleSignOut} /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/complaints/new" element={<NewComplaintPage />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/history" element={<ComplaintsPage history />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/complaints/:complaintId" element={<ComplaintDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}
