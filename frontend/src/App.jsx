/**
 * App.jsx
 * -------
 * Split-screen shell: Form on the left, Copilot chat on the right.
 */
import Form from "./components/Form";
import Copilot from "./components/Copilot";
import "./App.css";

export default function App() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-brand-600" />
          <h1 className="text-sm font-semibold tracking-wide text-slate-900">
            AIVOA - Customer Complaint Management Copilot
          </h1>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">Pharma QMS</span>
      </header>
      <main className="grid min-h-0 flex-1 grid-cols-2 overflow-hidden">
        <Form />
        <Copilot />
      </main>
    </div>
  );
}
