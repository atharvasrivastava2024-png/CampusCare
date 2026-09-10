/**
 * store.js
 * --------
 * Redux Toolkit store for the AIVOA Complaint Copilot.
 *
 * - complaintSlice mirrors every field on the left-hand form.
 * - chatSlice holds the conversation with the copilot.
 * - Two thunks (sendMessage, uploadDocument) call the FastAPI backend and,
 *   on success, merge the AI's extracted/updated fields straight into
 *   complaintSlice so the form repaints automatically. This is done via
 *   extraReducers, which is the standard RTK pattern for one slice
 *   reacting to another slice's thunk.
 */
import { configureStore, createSlice, createAsyncThunk, nanoid } from "@reduxjs/toolkit";
import { sendChatMessage, uploadComplaintDocument } from "../api";

const emptyComplaint = {
  complaint_source: "",
  customer_name: "",
  product_name: "",
  product_strength: "",
  batch_number: "",
  affected_quantity: "",
  mfg_date: "",
  exp_date: "",
  complaint_category: "",
  description: "",
  severity: "",
  next_action: "",
  initial_risk_assessment: "",
  capa_recommendations: [],
};

// ------------------------------------------------------------ thunks ----

export const sendMessage = createAsyncThunk("chat/sendMessage", async (message, { getState }) => {
  const { sessionId } = getState().chat;
  return sendChatMessage(sessionId, message);
});

export const uploadDocument = createAsyncThunk("chat/uploadDocument", async (file, { getState }) => {
  const { sessionId } = getState().chat;
  return uploadComplaintDocument(sessionId, file);
});

// -------------------------------------------------------- complaintSlice --

const complaintSlice = createSlice({
  name: "complaint",
  initialState: {
    data: emptyComplaint,
    lastUpdatedFields: [],
  },
  reducers: {
    setField(state, action) {
      const { field, value } = action.payload;
      state.data[field] = value;
    },
    resetComplaint(state) {
      state.data = emptyComplaint;
      state.lastUpdatedFields = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.data = { ...state.data, ...action.payload.complaint_data };
        state.lastUpdatedFields = action.payload.updated_fields || [];
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.data = { ...state.data, ...action.payload.complaint_data };
        state.lastUpdatedFields = action.payload.updated_fields || [];
      });
  },
});

// -------------------------------------------------------------- chatSlice --

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    sessionId: nanoid(),
    messages: [
      {
        id: nanoid(),
        role: "assistant",
        content:
          "Hi, I'm AIVOA. Paste a complaint email, upload a PDF, or just tell me what happened and I'll fill out the form for you.",
      },
    ],
    missingFields: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    addUserMessage(state, action) {
      state.messages.push({ id: nanoid(), role: "user", content: action.payload });
    },
    clearChat(state) {
      state.messages = state.messages.slice(0, 1);
      state.missingFields = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages.push({ id: nanoid(), role: "assistant", content: action.payload.reply });
        state.missingFields = action.payload.missing_fields || [];
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        state.messages.push({
          id: nanoid(),
          role: "assistant",
          content: "Sorry, something went wrong reaching the copilot backend. Please try again.",
        });
      })
      .addCase(uploadDocument.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages.push({ id: nanoid(), role: "assistant", content: action.payload.reply });
        state.missingFields = action.payload.missing_fields || [];
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        state.messages.push({
          id: nanoid(),
          role: "assistant",
          content: "I couldn't process that PDF. Please check the file and try again.",
        });
      });
  },
});

export const { setField, resetComplaint } = complaintSlice.actions;
export const { addUserMessage, clearChat } = chatSlice.actions;

export const store = configureStore({
  reducer: {
    complaint: complaintSlice.reducer,
    chat: chatSlice.reducer,
  },
});