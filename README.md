# 🌿 BharatVeda AI (भारतवेदा AI)

> **Accessible Indian Herbal & Ayurvedic Knowledge with RAG and Cloud AI (`gemini-3.5-flash-lite`)**

BharatVeda AI is an educational healthcare and botanical intelligence web application tailored for India. It connects users with authentic, classical Ayurvedic knowledge and home self-care remedies through a Retrieval-Augmented Generation (RAG) AI assistant powered by Google’s **Gemini 3.5 Flash-Lite** and **BAAI/bge-small-en-v1.5** vector embeddings.

---

## 🚀 Key Features

- **⚡ Cloud RAG with `gemini-3.5-flash-lite`**:
  Answers health inquiries using context retrieved directly from classical literature:
  - *The Complete Book of Ayurvedic Home Remedies* (Dr. Vasant Lad)
  - *Everyday Ayurveda – A Practical Guide to Healthy Living*
- **🎯 BAAI/bge-small-en-v1.5 Embeddings**:
  Semantic search over 900+ curated Ayurvedic knowledge chunks.
- **🌐 Multilingual**:
  Full support for **English**, **हिन्दी (Hindi)**, and **తెలుగు (Telugu)**.
- **🛡️ Safety-First & Emergency Triage**:
  Identifies red flag symptoms (e.g., chest pain, shortness of breath) and directs users to emergency care (**112 in India**).
- **📋 Clinician SOAP Visit Note**:
  Automatically organizes symptoms into a structured draft note (Subjective, Objective, Assessment, Plan) that patients can take to health workers or eSanjeevani consultations.
- **🌱 Plant Library**:
  Profiles for Indian medicinal plants like *Turmeric (Curcuma longa)*, *Ginger (Zingiber officinale)*, and *Ashwagandha (Withania somnifera)*.

---

## ⚡ Overcoming Vercel's 500 MB Free Tier Limit

A standard Python RAG stack using `torch`, `sentence-transformers`, and `chromadb` typically bloats above **800 MB – 1.2 GB**, exceeding Vercel's 250 MB serverless function and 500 MB bundle size limits.

**How BharatVeda AI solves this:**
1. **Offline Vector Embeddings**: The Ayurvedic documents in `docs/` were pre-chunked and embedded using `BAAI/bge-small-en-v1.5` into a lightweight, high-performance vector store (`knowledge_base.json`, only **3.8 MB**).
2. **Ultra-Lean Serverless Function (`api/chat.js`)**: Runs on Node.js using native `fetch` with **zero bulky dependencies**. Total deployment size is under **10 MB** (< 2% of Vercel's limit), guaranteeing instant cold starts and rapid deployments.

---

## 🛠️ Local Development

### 1. Prerequisites
- **Node.js** (v18 or newer)

### 2. Setup & Run
```bash
# Clone the repository
git clone https://github.com/<your-username>/BharatVeda-AI.git
cd BharatVeda-AI

# Set environment variable (optional; default key is included in api/chat.js)
cp .env.example .env

# Run local development server
npm run dev
# Or: node server.js
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🚢 Deploying to Vercel

### Option 1: Via GitHub & Vercel Dashboard (Recommended)
1. Initialize Git and push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of BharatVeda AI with RAG and Gemini 3.5 Flash-Lite"
   git branch -M main
   git remote add origin https://github.com/<your-username>/BharatVeda-AI.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your **BharatVeda-AI** repository.
4. Add your Environment Variable in Vercel settings (or locally in `.env`):
   - `GEMINI_API_KEY`: `your_gemini_api_key_here`
5. Click **Deploy**. Vercel will finish in under 30 seconds!

### Option 2: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 📂 Repository Structure

```
├── api/
│   └── chat.js               # Serverless function: RAG retrieval & Gemini 3.5 Flash-Lite
├── docs/                     # Source Ayurvedic PDFs
├── knowledge_base.json       # Precomputed BAAI/bge-small-en-v1.5 embeddings (~3.8 MB)
├── index.html                # Main single-page web app
├── app.js                    # UI logic, chat state & voice recognition
├── care.js                   # Patient profile, schedule, and eSanjeevani integration
├── care-copy.js              # Multilingual care text translations
├── data.js                   # Botanical data and core translations
├── style.css                 # Responsive stylesheet
├── server.js                 # Local development server
├── vercel.json               # Vercel deployment configuration
├── package.json              # Project metadata & start scripts
├── .env.example              # Environment variables template
└── .gitignore                # Git ignore rules
```

---

## 📜 Disclaimer
*BharatVeda AI is an educational prototype and does not replace medical advice, diagnosis, or treatment. For emergency medical symptoms in India, dial **112**.*
