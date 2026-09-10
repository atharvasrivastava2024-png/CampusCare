/**
 * api.js
 * ------
 * Frontend API client for the AIVOA Complaint Copilot.
 * Uses Vite's /api proxy in development and can be overridden for deployment.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

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
