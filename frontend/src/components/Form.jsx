/**
 * Form.jsx
 * --------
 * Left-hand "Log Customer Complaint" panel. Every field is bound to
 * Redux state, so it updates both when the user types directly and when
 * the Copilot extracts/corrects data from chat. Fields the AI touched on
 * the most recent turn get a brief highlight ring.
 */
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setField, resetComplaint } from "../store/store";
import { AlertTriangle, RotateCcw, Save, Loader2 } from "lucide-react";
import { saveComplaintToDatabase } from "../api";

const FIELD_GROUPS = [
  {
    title: "Source & Customer",
    fields: [
      { name: "complaint_source", label: "Complaint Source", type: "text", placeholder: "e.g. Apollo Pharmacy, Direct Email" },
      { name: "customer_name", label: "Customer Name", type: "text" },
    ],
  },
  {
    title: "Product Details",
    fields: [
      { name: "product_name", label: "Product Name", type: "text" },
      { name: "product_strength", label: "Product Strength", type: "text", placeholder: "e.g. 500mg" },
      { name: "batch_number", label: "Batch/Lot Number", type: "text" },
      { name: "affected_quantity", label: "Affected Quantity", type: "text", placeholder: "e.g. 48 capsules" },
      { name: "mfg_date", label: "Mfg Date", type: "text", placeholder: "YYYY-MM-DD" },
      { name: "exp_date", label: "Exp Date", type: "text", placeholder: "YYYY-MM-DD" },
    ],
  },
  {
    title: "Complaint",
    fields: [
      { name: "complaint_category", label: "Complaint Category", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    title: "Assessment",
    fields: [
      { name: "severity", label: "Severity", type: "severity" },
      { name: "next_action", label: "Next Action", type: "textarea" },
      { name: "initial_risk_assessment", label: "Initial Risk Assessment", type: "textarea" },
    ],
  },
];

const SEVERITY_STYLES = {
  Minor: "bg-amber-100 text-amber-800 border-amber-300",
  Major: "bg-orange-100 text-orange-800 border-orange-300",
  Critical: "bg-red-100 text-red-800 border-red-300",
};

function FieldLabel({ label, highlighted }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
      {label}
      {highlighted && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
    </label>
  );
}

export default function Form() {
  const dispatch = useDispatch();
  const { data, lastUpdatedFields } = useSelector((s) => s.complaint);
  const { sessionId } = useSelector((s) => s.chat);
  const missingFields = useSelector((s) => s.chat.missingFields);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleChange = (name, value) => dispatch(setField({ field: name, value }));

  const handleSave = async () => {
    if (!data.customer_name || !data.product_name || !data.description) {
      setSaveMessage("Please fill in at least: Customer Name, Product Name, and Description");
      return;
    }
    
    setIsSaving(true);
    setSaveMessage("");
    try {
      const result = await saveComplaintToDatabase(sessionId, data);
      setSaveMessage(`✓ Complaint ${result.id.slice(0, 8)}... saved to QMS Ledger`);
      setTimeout(() => setSaveMessage(""), 4000);
    } catch (error) {
      setSaveMessage(`Error saving: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto thin-scrollbar bg-white border-r border-slate-200">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white/95 backdrop-blur px-6 py-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Log Customer Complaint</h2>
          <p className="text-xs text-slate-500">Auto-filled by AIVOA Copilot, editable anytime</p>
        </div>
        <button
          onClick={() => dispatch(resetComplaint())}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {missingFields.length > 0 && (
        <div className="mx-6 mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>Missing before risk assessment can run: {missingFields.join(", ")}</span>
        </div>
      )}

      <div className="px-6 py-5 space-y-8">
        {FIELD_GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">{group.title}</h3>
            <div className="grid grid-cols-2 gap-4">
              {group.fields.map((f) => {
                const highlighted = lastUpdatedFields.includes(f.name);
                const isFull = f.type === "textarea" || f.type === "severity";
                return (
                  <div key={f.name} className={isFull ? "col-span-2" : "col-span-1"}>
                    <FieldLabel label={f.label} highlighted={highlighted} />
                    {f.type === "textarea" && (
                      <textarea
                        value={data[f.name] || ""}
                        onChange={(e) => handleChange(f.name, e.target.value)}
                        rows={3}
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-shadow ${
                          highlighted ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200"
                        }`}
                      />
                    )}
                    {f.type === "text" && (
                      <input
                        type="text"
                        value={data[f.name] || ""}
                        placeholder={f.placeholder}
                        onChange={(e) => handleChange(f.name, e.target.value)}
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-shadow ${
                          highlighted ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200"
                        }`}
                      />
                    )}
                    {f.type === "severity" && (
                      <div className="flex gap-2">
                        {["Minor", "Major", "Critical"].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleChange("severity", level)}
                            className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                              data.severity === level
                                ? SEVERITY_STYLES[level]
                                : "border-slate-200 text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {data.capa_recommendations?.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              CAPA Recommendations
            </h3>
            <ul className="space-y-2">
              {data.capa_recommendations.map((c, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                >
                  <span className="font-semibold text-brand-600">{i + 1}.</span>
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur px-6 py-4 space-y-3">
        {saveMessage && (
          <div
            className={`text-xs p-2 rounded-lg ${
              saveMessage.startsWith("✓")
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {saveMessage}
          </div>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Commit to QMS Ledger
            </>
          )}
        </button>
      </div>
    </div>
  );
}