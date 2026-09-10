# AIVOA - AI Customer Complaint Management Copilot

A split-screen pharma QMS complaint intake tool. Paste an email, upload a PDF,
or type a correction into the AIVOA Copilot chat on the right, and the
"Log Customer Complaint" form on the left fills itself in, complete with an
AI-generated severity rating, risk assessment, next action, and CAPA
recommendations.

## Architecture

- **Frontend:** React + Redux Toolkit + Tailwind CSS (Vite), Inter font.
- **Backend:** FastAPI + SQLAlchemy (works with PostgreSQL, MySQL, or SQLite).
- **AI:** LangGraph orchestrating two Groq-hosted models:
  - `gemma2-9b-it` for fast routing and entity extraction
  - `llama-3.3-70b-versatile` for risk reasoning and CAPA generation

### The graph

```
router --chitchat--> chitchat_respond --> END
  |
  +--new_complaint/correction--> extraction --> completeness_checker
                                                     |
                                    missing fields --+--> responder --> END
                                                     |
                                                complete
                                                     |
                                                     v
                                          risk_assessment --> capa_recommendation --> responder --> END
```

State is threaded per `session_id` with LangGraph's `MemorySaver`, so when
you type a correction like "actually the batch number is BMX240602", the
extraction node fills in just that field and it's merged on top of whatever
was already captured, no need to resend the whole conversation.

## Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # venv\Scripts\activate on Windows
pip install -r requirements.txt
```

Fill in `.env` (copy from `.env.example`) with your Groq API key and DB URL:

```
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/aivoa_qms
```

If you skip `DATABASE_URL`, the app falls back to a local SQLite file so it
still runs out of the box.

Run it:

```bash
uvicorn app:app --reload --port 8000
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Vite's dev server proxies `/api` to `http://localhost:8000` (see
`vite.config.js`), so just open the printed local URL and the two are
already wired together.

## Try it

1. Paste something like:

   > Hi, this is Apollo Pharmacy. A customer returned Paracetamol 500mg,
   > batch PB2201, complaining that 12 tablets in a strip of 15 came out
   > discolored and crumbling. They want a refund.

2. Watch the form populate, along with a severity rating, risk assessment,
   next action, and CAPA suggestions.
3. Type a correction, e.g. "actually the batch number is BMX240602 and it
   was 48 capsules affected" - only those two fields update.
4. Try uploading a PDF complaint letter instead of pasting text.
5. Click "Save" (wire this to `POST /api/complaints/save` from the form
   once you're ready) to persist the record to the database.

## Notes on production-hardening

- CORS is wide open (`allow_origins=["*"]`) for local development. Restrict
  it to your actual frontend origin before deploying.
- PDF extraction uses PyMuPDF's text layer. Scanned/image-only PDFs will
  extract no text; add an OCR fallback (e.g. `pytesseract`) if you need to
  support those.
- `MemorySaver` keeps conversation state in process memory. Swap in
  LangGraph's SQLite/Postgres checkpointer if you need state to survive a
  backend restart or run across multiple workers.
- The completeness checker currently gates only on a fixed required-field
  list (`REQUIRED_FIELDS` in `graph.py`). Adjust that list to match your
  actual SOP.