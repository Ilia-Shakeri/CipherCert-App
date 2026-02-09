# 🛡️ CipherCert App - Enterprise SSL Audit & Monitoring

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**CipherCert App** is a modern, cross-platform desktop application designed for real-time SSL/TLS certificate analysis, scoring, and monitoring. It combines the raw processing power of **Python** with the sleek, reactive user interface of **Electron** and **React**.

> **Repo Link:** [https://github.com/Ilia-Shakeri/CipherCert-App](https://github.com/Ilia-Shakeri/CipherCert-App.git)

---

## 🚀 Features

* **Real-time SSL Scanning:** Deep analysis of SSL certificates for any domain.
* **Security Grading:** Automated scoring algorithm (A-F) based on certificate validity, issuer, and protocol versions.
* **Expiry Tracking:** Visual warnings for expiring or expired certificates.
* **Historical Data:** Local database (SQLite) stores all scan history for trend analysis.
* **Modern Dashboard:** Beautiful, dark-themed UI built with React, Tailwind CSS, and Recharts.
* **Cross-Platform:** Runs on Windows, Linux, and macOS.

---

## 🛠️ Tech Stack

### Frontend (UI)
* **Framework:** [Electron](https://www.electronjs.org/) & [React](https://react.dev/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/ui](https://ui.shadcn.com/)
* **Language:** TypeScript / JavaScript

### Backend (Engine)
* **Core:** [Python 3.10+](https://www.python.org/)
* **API:** [FastAPI](https://fastapi.tiangolo.com/)
* **Cryptography:** `cryptography` & `ssl` libraries
* **Database:** SQLite (via SQLAlchemy)

---

## 📦 Installation & Setup

Follow these steps to set up the development environment.

### Prerequisites
* **Node.js** (v18 or higher)
* **Python** (v3.10 or higher)
* **Git**

### 1. Clone the Repository
```bash
git clone [https://github.com/Ilia-Shakeri/CipherCert-App.git](https://github.com/Ilia-Shakeri/CipherCert-App.git)
cd CipherCert-App

```

### 2. Backend Setup (Python)

We need to create a virtual environment for the Python engine.

**Windows:**

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

```

**Linux / macOS:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

```

### 3. Frontend Setup (Node.js)

Open a new terminal (or navigate back) to the frontend folder.

```bash
cd ../frontend
npm install

```

---

## ⚡ Execution

The application uses `concurrently` to run the React dev server and the Electron window simultaneously. The Electron process automatically spawns the Python backend.

**Run the application with a single command:**

```bash
# Inside the /frontend directory
npm run electron

```

**What happens next?**

1. Vite starts the frontend server on `http://127.0.0.1:5173`.
2. Electron launches and automatically executes `backend/api.py`.
3. The application window appears.

---

## 📖 Usage Guide

### The Dashboard

* **Single Scan:** Enter a domain (e.g., `google.com`) in the top search bar and press **SCAN**.
* **Status Cards:** View quick stats on how many domains are Secure, Warning, or Expired.
* **Visual Charts:** See the trend of security scores over time.

### Scan History

* Navigate to the history section to view a log of all previous scans.
* Data is persisted locally in `backend/data/ciphercert_v2.db`.

### Application Options

* **Dark/Light Mode:** Toggle the application theme via the sidebar (if enabled).
* **Export:** (Upcoming) Export scan results to PDF or Excel.

---

## 📂 Project Structure

```text
CipherCert-App/
├── backend/                # Python Logic
│   ├── api.py              # FastAPI Server entry point
│   ├── engine.py           # SSL Scanning Logic
│   ├── models.py           # Database Models
│   ├── data/               # SQLite Database storage
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # UI Logic
│   ├── electron-main.js    # Electron Main Process
│   ├── src/                # React Source Code
│   │   ├── components/     # UI Components
│   │   └── assets/         # Images & Icons
│   ├── package.json        # Node dependencies
│   └── vite.config.ts      # Vite Configuration
│
└── README.md

```

---

## 🔧 Troubleshooting

**1. "Python not found" error:**
Ensure you have created the `venv` folder inside the `backend` directory. The application looks for the Python executable specifically at:

* Windows: `backend/venv/Scripts/python.exe`
* Linux: `backend/venv/bin/python`

**2. White screen on startup:**
Ensure ports are not blocked. The app uses port **5173** (Frontend) and **8000** (Backend). If the screen remains white, check the console `Ctrl+Shift+I` for errors.

**3. "Address already in use":**
If you restart the app frequently, a Python process might remain running. Manually kill any `python` or `uvicorn` processes in your task manager.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/NewFeature`).
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

---

## 👤 Author

**Ilia Shakeri**

* GitHub: [@Ilia-Shakeri](https://www.google.com/search?q=https://github.com/Ilia-Shakeri)

