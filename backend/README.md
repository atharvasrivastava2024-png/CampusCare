# CampusCare backend

Install dependencies, copy `.env.example` to `.env`, configure `DATABASE_URL`, `GROQ_API_KEY`, and `SUPABASE_JWT_SECRET`, then run `uvicorn app:app --reload --port 8000` from `backend`.

Apply `migrations/001_campuscare.sql` in Supabase and configure active `authority_mappings` rows. No recipient addresses are seeded. Complaint routes require `Authorization: Bearer <Supabase access token>`; replace the frontend prototype login with Supabase Auth and attach its access token. Gmail delivery and RAG are intentionally not implemented. Approval creates an unavailable email log and returns 503 rather than falsely reporting delivery.
