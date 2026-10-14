import { useMemo, useState } from "react";
import StudentPortal from "./StudentPortal.jsx";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  categoryBreakdown,
  complaintQueue,
  dashboardMetrics,
  issueCategories,
  policyReferences,
} from "./data/mockData";
import "./App.css";

const AUTH_KEY = "campuscare-user";

const statusStyles = {
  "Awaiting review": "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "In progress": "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  Escalated: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  Resolved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

const severityStyles = {
  Low: "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200",
  Medium: "text-amber-700 bg-amber-50 ring-1 ring-amber-200",
  High: "text-orange-700 bg-orange-50 ring-1 ring-orange-200",
  Critical: "text-rose-700 bg-rose-50 ring-1 ring-rose-200",
};

function Button({ children, className = "", variant = "primary", ...props }) {
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/20",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function ProtectedRoute({ user }) {
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function StatusPill({ label }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[label] || "bg-slate-100 text-slate-600"}`}>{label}</span>;
}

function SeverityPill({ label }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${severityStyles[label] || "bg-slate-100 text-slate-600"}`}>{label}</span>;
}

function DashboardShell({ user, title, subtitle, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Complaints", to: "/complaints", icon: FileText },
    { label: "Submit", to: "/complaints/new", icon: Plus },
    { label: "AI insights", to: "/dashboard", icon: Sparkles },
  ];

  const initials = (user?.name || "Campus User")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    navigate("/login", { replace: true });
    window.location.reload();
  };

  return (
    <div className="app-shell min-h-screen px-4 py-4 sm:px-6 xl:px-8">
      <div className="mx-auto max-w-[1450px] rounded-[28px] border border-slate-200/80 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className="flex min-h-[calc(100vh-2rem)] flex-col lg:flex-row">
          <aside className="w-full border-b border-slate-200 bg-slate-950 px-5 py-6 text-slate-100 lg:w-72 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/20 text-lg font-bold text-brand-100 ring-1 ring-brand-300/40">
                C
              </div>
              <div>
                <p className="text-lg font-bold">CampusCare AI</p>
                <p className="text-xs text-slate-400">Complaint command center</p>
              </div>
            </div>

            <nav className="mt-8 space-y-2">
              {navigation.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={label}
                  to={to}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive || (location.pathname === "/dashboard" && to === "/dashboard") ? "active" : ""}`
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Current user</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500/20 text-sm font-semibold text-brand-100">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{user?.name || "Campus Admin"}</p>
                  <p className="text-xs text-slate-400">{user?.role || "Student affairs office"}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </aside>

          <main className="flex-1 bg-slate-50/70">
            <header className="flex flex-col gap-4 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 xl:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-brand-600">CampusCare</p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                </div>

                <div className="flex items-center gap-3">
                  <button type="button" className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
                    <Bell size={18} />
                  </button>
                  <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:flex">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                      {initials}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-800">{user?.name || "Campus Admin"}</p>
                      <p className="text-[11px] text-slate-500">{user?.email || "campus@college.edu"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">{subtitle}</p>
                <div className="flex items-center gap-3">
                  <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-600 sm:flex">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Secure intake enabled
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                    <TrendingUp size={14} />
                    AI triage live
                  </div>
                </div>
              </div>
            </header>

            <div className="p-4 sm:p-6 xl:p-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please enter your campus email and password.");
      return;
    }

    if (form.password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 700));

    const email = form.email.trim().toLowerCase();
    const name = email
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    onLogin({
      name: name || "Campus Admin",
      email,
      role: "Student Affairs Office",
    });

    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,91,253,0.12),_transparent_30%),linear-gradient(135deg,#edf4ff_0%,#f8fafc_52%,#eefaf7_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 shadow-[0_30px_70px_rgba(15,23,42,0.08)] backdrop-blur-sm lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative flex flex-col justify-between bg-slate-950 px-6 py-8 text-slate-100 sm:px-10 lg:px-12">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/20 text-lg font-bold text-brand-100 ring-1 ring-brand-300/40">
                C
              </div>
              <div>
                <p className="text-lg font-bold">CampusCare AI</p>
                <p className="text-xs text-slate-400">College complaint management</p>
              </div>
            </div>

            <div className="mt-12 max-w-md">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-100">
                <Sparkles size={14} />
                AI-powered triage and follow-up
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                Safer, faster complaint resolution for campus communities.
              </h1>
              <p className="mt-4 max-w-lg text-base text-slate-300">
                Centralize academic, safety, welfare, and facilities concerns with guided intake and evidence-backed action plans.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Students heard", value: "12k+" },
              { label: "Avg. response", value: "2.4 days" },
              { label: "AI confidence", value: "94%" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-2xl font-bold text-white">{item.value}</p>
                <p className="mt-1 text-xs text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center bg-slate-50 px-6 py-8 sm:px-10 lg:px-12">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <p className="text-sm font-medium text-brand-600">Welcome back</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Sign in</h2>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Institution email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="student@campus.edu"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  Remember me
                </label>
                <button type="button" className="font-medium text-brand-600 hover:text-brand-700">
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <AlertTriangle size={16} className="mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full py-3 text-base" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in to Portal"}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Demo access: use any campus email and a password with at least 6 characters.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ user }) {
  return (
    <DashboardShell
      user={user}
      title="Dashboard"
      subtitle="Operational overview of student complaints, risk trends, and routing performance."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{metric.label}</span>
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <div className="mt-4 text-3xl font-black tracking-tight text-slate-900">{metric.value}</div>
            <div className="mt-2 text-xs text-slate-500">{metric.delta}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Complaint intake funnel</h2>
              <p className="text-sm text-slate-500">AI-driven triage and routing this week</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
              <ShieldCheck size={14} />
              94% eligible for auto-routing
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              { title: "Submitted", value: "142", detail: "New cases" },
              { title: "Reviewed", value: "96", detail: "Within SLA" },
              { title: "Resolved", value: "62", detail: "Closed this week" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{item.title}</p>
                <p className="mt-3 text-3xl font-black text-slate-900">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Priority queue</h2>
            <span className="text-xs font-medium text-rose-600">3 urgent</span>
          </div>

          <div className="mt-5 space-y-4">
            {complaintQueue.slice(0, 3).map((complaint) => (
              <div key={complaint.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{complaint.id}</p>
                  <StatusPill label={complaint.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{complaint.student}</p>
                <p className="mt-1 text-xs text-slate-500">{complaint.summary}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent complaints</h2>
            <Link to="/complaints" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Case</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {complaintQueue.map((complaint) => (
                    <tr key={complaint.id} className="border-t border-slate-200">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-800">{complaint.student}</p>
                          <p className="text-xs text-slate-500">{complaint.id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{complaint.category}</td>
                      <td className="px-4 py-3"><StatusPill label={complaint.status} /></td>
                      <td className="px-4 py-3"><SeverityPill label={complaint.severity} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Category mix</h2>
          <div className="mt-5 space-y-4">
            {categoryBreakdown.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.name}</span>
                  <span className="font-semibold text-slate-800">{item.value}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function ComplaintsPage({ user }) {
  const [query, setQuery] = useState("");

  const filteredComplaints = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return complaintQueue;

    return complaintQueue.filter((complaint) =>
      [complaint.id, complaint.student, complaint.category, complaint.campus, complaint.summary]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query]);

  return (
    <DashboardShell
      user={user}
      title="My Complaints"
      subtitle="Review submitted cases, monitor progress, and prepare committee actions."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search complaints, students, or ticket ID"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
          />
        </div>

        <div className="flex items-center gap-3">
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Filter size={16} />
            Filter
          </button>
          <Link to="/complaints/new">
            <Button type="button" className="px-3.5 py-2.5">
              <Plus size={16} />
              New complaint
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Complaint</th>
                <th className="px-4 py-3 font-medium">Campus</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.id} className="border-t border-slate-200 hover:bg-slate-50/80">
                  <td className="px-4 py-4">
                    <Link to={`/complaints/${complaint.id}`} className="block">
                      <p className="font-semibold text-slate-900">{complaint.student}</p>
                      <p className="text-xs text-slate-500">{complaint.id}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{complaint.campus}</td>
                  <td className="px-4 py-4 text-slate-600">{complaint.category}</td>
                  <td className="px-4 py-4"><StatusPill label={complaint.status} /></td>
                  <td className="px-4 py-4"><SeverityPill label={complaint.severity} /></td>
                  <td className="px-4 py-4 text-slate-600">{complaint.submitted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}

function NewComplaintPage({ user }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    studentName: "Ananya Patel",
    email: "ananya@campus.edu",
    category: "Academic fairness",
    campus: "North Hall",
    severity: "Medium",
    summary:
      "The lecturer failed to share assignment rubrics before grading, and my final score does not match the published course rubric.",
    evidence: "Screenshot of rubric, email thread, and grade sheet attached.",
  });

  const progressValue = step === 1 ? 33 : step === 2 ? 66 : 100;

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleNext = () => setStep((current) => Math.min(current + 1, 3));
  const handleBack = () => setStep((current) => Math.max(current - 1, 1));

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <DashboardShell
      user={user}
      title="Submit complaint"
      subtitle="Intake workflow with AI-assisted classification, policy checks, and approval review."
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-600">New complaint</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">CampusCare intake workflow</h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Clock3 size={16} />
            Intake cycle: 48 hours
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Progress</span>
            <span>{progressValue}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${progressValue}%` }} />
          </div>
        </div>

        {submitted ? (
          <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={24} className="text-emerald-600" />
              <div>
                <h3 className="text-xl font-bold text-emerald-900">Complaint submitted for review</h3>
                <p className="mt-2 text-sm text-emerald-800">
                  Your case is queued to the Student Affairs Office. The AI triage engine identified a grading fairness risk and recommended institution review within 48 hours.
                </p>
                <div className="mt-4 flex gap-3">
                  <Link to="/complaints">
                    <Button variant="secondary">View queue</Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button>Back to dashboard</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Student name</label>
                  <input value={form.studentName} onChange={(event) => updateField("studentName", event.target.value)} className="field-input" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Campus email</label>
                  <input value={form.email} onChange={(event) => updateField("email", event.target.value)} className="field-input" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Issue category</label>
                  <select value={form.category} onChange={(event) => updateField("category", event.target.value)} className="field-input">
                    {issueCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Campus location</label>
                  <input value={form.campus} onChange={(event) => updateField("campus", event.target.value)} className="field-input" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Complaint summary</label>
                  <textarea value={form.summary} rows={5} onChange={(event) => updateField("summary", event.target.value)} className="field-input" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Evidence and supporting details</label>
                  <textarea value={form.evidence} rows={6} onChange={(event) => updateField("evidence", event.target.value)} className="field-input" />

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Incident severity</label>
                    <div className="flex gap-3">
                      {Object.keys(severityStyles).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => updateField("severity", level)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                            form.severity === level ? severityStyles[level] : "border border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 text-brand-700">
                    <Sparkles size={18} />
                    <h3 className="text-lg font-bold">AI classification</h3>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm text-slate-700">
                    <li className="rounded-2xl bg-white p-3">Likely root cause: <span className="font-semibold">Policy mismatch</span></li>
                    <li className="rounded-2xl bg-white p-3">Suggested response: <span className="font-semibold">Academic review and fairness assessment</span></li>
                    <li className="rounded-2xl bg-white p-3">Risk level: <span className="font-semibold">Medium</span></li>
                  </ul>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-brand-700">
                    <BookOpen size={18} />
                    <h3 className="text-lg font-bold">Review and policy references</h3>
                  </div>

                  <div className="mt-5 space-y-4">
                    {policyReferences.map((policy) => (
                      <div key={policy.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-800">{policy.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{policy.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 text-slate-800">
                    <MessageSquare size={18} className="text-brand-600" />
                    <h3 className="text-lg font-bold">Letter preview</h3>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700">
                    Dear Student Affairs Office,<br /><br />
                    I am writing to formally request review of the grading process affecting my coursework in {form.category.toLowerCase()}. I have attached evidence related to {form.campus} and request an objective assessment of the policy application and final outcome. I would appreciate a response and resolution within the campus review timelines.
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <div>
                {step > 1 ? (
                  <Button type="button" variant="secondary" onClick={handleBack}>
                    Back
                  </Button>
                ) : (
                  <Link to="/dashboard">
                    <Button type="button" variant="secondary">Cancel</Button>
                  </Link>
                )}
              </div>

              <Button type="button" onClick={step < 3 ? handleNext : handleSubmit}>
                {step < 3 ? "Continue" : "Submit for review"}
                <ArrowRight size={16} />
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function ComplaintDetailPage({ user }) {
  const { complaintId } = useParams();
  const complaint = complaintQueue.find((item) => item.id === complaintId);

  if (!complaint) {
    return <Navigate to="/complaints" replace />;
  }

  return (
    <DashboardShell
      user={user}
      title={`Complaint ${complaint.id}`}
      subtitle="Review the complaint summary, policy references, and proposed response plan."
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-brand-600">Complaint overview</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">{complaint.student}</h2>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill label={complaint.status} />
                <SeverityPill label={complaint.severity} />
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Category</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{complaint.category}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Campus</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{complaint.campus}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Complaint summary</p>
              <p className="mt-3 text-base leading-7 text-slate-700">{complaint.summary}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Applicant response draft</h3>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              Dear Student Affairs Office,<br /><br />
              I am writing to request an objective review of the issue reported regarding {complaint.category.toLowerCase()} at {complaint.campus}. I have attached documentation and would appreciate a swift follow-up and communication regarding the next steps.
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-brand-700">
              <ShieldCheck size={18} />
              <h3 className="text-lg font-bold">AI triage results</h3>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-50 p-3"><span className="font-semibold">Likelihood:</span> {complaint.triage}</div>
              <div className="rounded-2xl bg-slate-50 p-3"><span className="font-semibold">Suggested route:</span> Academic review board</div>
              <div className="rounded-2xl bg-slate-50 p-3"><span className="font-semibold">Evidence score:</span> 92/100</div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-brand-700">
              <BookOpen size={18} />
              <h3 className="text-lg font-bold">Policy references</h3>
            </div>
            <div className="mt-4 space-y-3">
              {policyReferences.map((policy) => (
                <div key={policy.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-800">{policy.title}</p>
                  <p className="mt-1 text-xs text-slate-600">{policy.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}

export default function App() {
  return <StudentPortal />;
}
