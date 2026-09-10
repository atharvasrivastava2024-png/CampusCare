/**
 * Copilot.jsx
 * -----------
 * Right-hand "AIVOA Copilot" chat panel. Handles pasted text, free-form
 * correction messages, and PDF uploads, dispatching to the sendMessage /
 * uploadDocument thunks in store/store.js.
 */
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Paperclip, Send, Bot, User, Loader2 } from "lucide-react";
import { sendMessage, uploadDocument, addUserMessage } from "../store/store";

function Message({ role, content }) {
  const isAssistant = role === "assistant";
  return (
    <div className={`flex gap-2.5 ${isAssistant ? "" : "flex-row-reverse"}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isAssistant ? "bg-brand-100 text-brand-600" : "bg-slate-200 text-slate-600"
        }`}
      >
        {isAssistant ? <Bot size={15} /> : <User size={15} />}
      </div>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isAssistant
            ? "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
            : "bg-brand-600 text-white rounded-tr-sm"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

export default function Copilot() {
  const dispatch = useDispatch();
  const { messages, isLoading } = useSelector((s) => s.chat);
  const [input, setInput] = useState("");
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 192)}px`;
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    dispatch(addUserMessage(trimmed));
    dispatch(sendMessage(trimmed));
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch(addUserMessage(`Uploaded: ${file.name}`));
    dispatch(uploadDocument(file));
    e.target.value = "";
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">
          <Bot size={17} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">AIVOA Copilot</h2>
          <p className="text-xs text-slate-500">Paste a complaint, upload a PDF, or make a correction</p>
        </div>
      </div>

      <div ref={scrollRef} className="thin-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {messages.map((m) => (
          <Message key={m.id} role={m.role} content={m.content} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 pl-9 text-xs text-slate-400">
            <Loader2 size={13} className="animate-spin" /> AIVOA is thinking...
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mb-1 shrink-0 text-slate-400 hover:text-brand-600 transition-colors"
            title="Upload a PDF complaint"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste a complaint email, or type a correction..."
            rows={1}
            className="max-h-48 flex-1 resize-none overflow-y-auto bg-transparent py-1 text-sm leading-5 text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="mb-1 shrink-0 rounded-lg bg-brand-600 p-1.5 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
