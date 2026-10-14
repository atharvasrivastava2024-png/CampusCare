/**
 * api.js
 * ------
 * Frontend API client for the AIVOA Complaint Copilot.
 * Uses Vite's /api proxy in development and can be overridden for deployment.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const STUDENT_COMPLAINT_CATEGORIES = [
  "Library",
  "Student Welfare",
  "Hostel",
  "Proctor",
  "Gym",
  "Food & Mess",
];

// Supabase Auth integration should save its short-lived access token here (or
// replace this helper with supabase.auth.getSession()). The prototype sign-in
// deliberately does not manufacture a token.
function authHeaders(json = true) {
  const token = localStorage.getItem("campuscare-access-token");
  return { ...(json ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function campusRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...authHeaders(options.body != null), ...(options.headers || {}) } });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(result.detail || `Request failed with status ${res.status}`);
  return result;
}

export function createCampusComplaint(payload) { return campusRequest("/complaints", { method: "POST", body: JSON.stringify(payload) }); }
export function listCampusComplaints(params = {}) { const query = new URLSearchParams(params).toString(); return campusRequest(`/complaints${query ? `?${query}` : ""}`); }
export function getCampusComplaint(id) { return campusRequest(`/complaints/${id}`); }
export function updateCampusComplaint(id, payload) { return campusRequest(`/complaints/${id}`, { method: "PATCH", body: JSON.stringify(payload) }); }
export function classifyCampusComplaint(id, payload) { return campusRequest(`/complaints/${id}/classify`, { method: "POST", body: JSON.stringify(payload) }); }
export function generateCampusDraft(id) { return campusRequest(`/complaints/${id}/draft`, { method: "POST" }); }
export function updateCampusDraft(id, payload) { return campusRequest(`/complaints/${id}/draft`, { method: "PATCH", body: JSON.stringify(payload) }); }
export function approveCampusDraft(id) { return campusRequest(`/complaints/${id}/approve-send`, { method: "POST" }); }

/**
 * Compatibility workflow for the current prototype login. It classifies and
 * drafts in a single request, but does not persist student data without a
 * verified Supabase session. Authenticated integrations should use the
 * Campus complaint endpoints above.
 */
export async function analyzeStudentComplaint(description, { clarification = "", categoryHint = "" } = {}) {
  const res = await fetch(`${API_BASE}/student-complaints/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description,
      clarification: clarification || null,
      category_hint: STUDENT_COMPLAINT_CATEGORIES.includes(categoryHint) ? categoryHint : null,
    }),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Complaint submission endpoint was not found. Restart the CampusCare backend so it loads the current API routes.");
    }
    throw new Error(result.detail || `Complaint analysis failed with status ${res.status}`);
  }
  return result;
}

export async function classifyStudentComplaint(description, { clarification = "", categoryHint = "" } = {}) {
  const res = await fetch(`${API_BASE}/student-complaints/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description,
      clarification: clarification || null,
      category_hint: STUDENT_COMPLAINT_CATEGORIES.includes(categoryHint) ? categoryHint : null,
    }),
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(result.detail || `Complaint classification failed with status ${res.status}`);
  }
  if (
    (result.category != null && !STUDENT_COMPLAINT_CATEGORIES.includes(result.category)) ||
    typeof result.requires_clarification !== "boolean"
  ) {
    throw new Error("The classification service returned an invalid response. Please retry.");
  }

  return result;
}

/**
 * Send a chat message to the copilot backend.
 * @param {string} sessionId - Thread ID for state persistence
 * @param {string} message - User message (raw text, correction, or chitchat)
 * @returns {Promise<{reply: string, complaint_data: object, missing_fields: string[], updated_fields: string[]}>}
 */
export async function sendChatMessage(sessionId, message) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Chat failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Upload a PDF complaint document.
 * @param {string} sessionId - Thread ID for state persistence
 * @param {File} file - PDF File object from input[type=file]
 * @returns {Promise<{reply: string, complaint_data: object, missing_fields: string[], updated_fields: string[]}>}
 */
export async function uploadComplaintDocument(sessionId, file) {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Upload failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Persist the current complaint form state to the database.
 * @param {string} sessionId - Thread ID
 * @param {object} complaintData - Full complaint object from Redux
 * @returns {Promise<{id: string, status: string}>}
 */
export async function saveComplaintToDatabase(sessionId, complaintData) {
  const res = await fetch(`${API_BASE}/complaints/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, complaint_data: complaintData }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Save failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch all saved complaints (for listing/history view).
 * @returns {Promise<Array>}
 */
export async function listSavedComplaints() {
  const res = await fetch(`${API_BASE}/complaints`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `List failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch a single saved complaint by ID.
 * @param {string} complaintId - UUID of the complaint
 * @returns {Promise<object>}
 */
export async function getComplaintById(complaintId) {
  const res = await fetch(`${API_BASE}/complaints/${complaintId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Get complaint failed with status ${res.status}`);
  }

  return res.json();
}
