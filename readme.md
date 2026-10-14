# CampusCare AI 🎓

**AI-Powered College Complaint Lodging System**

CampusCare AI is a student-focused web application designed to simplify college complaint submission. It uses artificial intelligence to classify student complaints and generate formal complaint letters, helping students prepare structured complaints for submission to the appropriate college authority.

## ✨ Features

- **AI-Powered Complaint Classification:** Uses Groq-powered language models to identify the appropriate complaint category from a student's description.
- **AI-Generated Complaint Letters:** Generates formal complaint letter drafts from the student's complaint details.
- **Student Complaint Workflow:** Provides a guided interface for describing a complaint, reviewing the generated letter, and proceeding through the complaint workflow.
- **Complaint Management:** Supports complaint submission and complaint records through the backend.
- **Database Integration:** Uses Supabase PostgreSQL for persistent application data.
- **REST API Backend:** Uses FastAPI to connect the frontend with backend services and AI functionality.
- **Student-Focused Interface:** Built with React and Vite for a responsive, interactive user experience.

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Python, FastAPI |
| AI and Language Models | Groq API |
| Database | Supabase PostgreSQL |
| API Communication | REST API |
| Testing | pytest |

## 🏗️ Architecture

```text
Student
   |
   v
React + Vite Frontend
   |
   v
FastAPI Backend
   |
   +----> Groq API
   |        |
   |        +----> Complaint Classification
   |        +----> Formal Letter Generation
   |
   +----> Supabase PostgreSQL
            |
            +----> Persistent Application Data
```

## 📁 Project Structure

```text
CampusCare/
├── backend/
│   ├── app.py
│   ├── llm_utils.py
│   ├── models.py
│   ├── schemas.py
│   ├── security.py
│   ├── services.py
│   ├── migrations/
│   ├── tests/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── StudentPortal.jsx
│   │   ├── api.js
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── data/
│   ├── index.html
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

Install the following before running the project:

- Python 3.10 or a compatible version supported by the backend dependencies
- Node.js and npm
- A Groq API key
- A Supabase project with PostgreSQL configured

### 1. Clone the repository

```bash
git clone https://github.com/atharvasrivastava2024-png/CampusCare.git
cd CampusCare
```

### 2. Configure the backend

Open a terminal in the project root and navigate to the backend:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS/Linux:**

```bash
source .venv/bin/activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Create a local `.env` file using `.env.example` as a reference. Configure the required Groq API key, Supabase credentials, and other environment variables expected by the backend.

**Important:** Use your actual environment variable names from `backend/.env.example`. Never commit real API keys, database credentials, or other secrets.

### 3. Configure the database

1. Create or select a Supabase project.
2. Configure the PostgreSQL connection using the credentials expected by the application.
3. Review the SQL migration files in `backend/migrations/`.
4. Apply the required migration to your database according to your Supabase setup.

Do not run migrations against a production database without reviewing their effects first.

### 4. Start the backend

From the `backend/` directory, run:

```bash
uvicorn app:app --reload
```

The API will generally be available at:

```text
http://127.0.0.1:8000
```

FastAPI's interactive API documentation is generally available at:

```text
http://127.0.0.1:8000/docs
```

### 5. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal, typically:

```text
http://localhost:5173
```

Ensure the frontend API configuration in `frontend/src/api.js` points to the running backend.

## 🔄 Application Workflow

1. **Describe:** The student enters a description of the college-related issue.
2. **Classify:** The backend uses a Groq-powered language model to determine an appropriate complaint category.
3. **Generate:** The AI generates a formal complaint letter draft from the available complaint information.
4. **Review:** The student reviews and edits the generated draft as needed.
5. **Proceed:** The student continues through the available complaint workflow, with application data handled by the backend and database.

AI-generated content should be reviewed by the student before it is used or submitted.

## 🧪 Testing

Backend tests are located in `backend/tests/`.

Activate the backend virtual environment and run:

```bash
cd backend
pytest
```

The test suite should be run in an environment with the necessary dependencies and configuration. External services may require suitable test configuration or mocks.

## 🔐 Security

- Keep API keys and database credentials in environment variables.
- Do not commit `.env` files or virtual environments.
- Use `.env.example` to document required configuration without exposing secrets.
- Validate incoming API requests on the backend.
- Protect student complaint data and restrict access according to the application's authentication and authorization rules.
- Review AI-generated letters before submission.

## 🚧 Current Scope and Future Enhancements

CampusCare AI is under active development. The implemented functionality should be verified against the current application before relying on it in production.

Potential future enhancements include:

- College-policy retrieval and rule-based complaint guidance using Retrieval-Augmented Generation (RAG).
- Gmail API integration for sending approved complaint letters.
- Expanded complaint tracking and status updates.
- Improved administrative workflows and analytics.
- Additional automated tests and production deployment configuration.

**Note:** College-policy RAG and Gmail API delivery are not part of the current implementation scope described here.

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Submit a pull request describing the changes.

## 📄 License

No license has been specified yet. Until a license is added to this repository, do not assume that the project is available for unrestricted reuse or redistribution.
