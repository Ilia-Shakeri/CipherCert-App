# 🛡️ CipherCert App

![License](https://img.shields.io/badge/license-CC0--1.0-green.svg)
![Status](https://img.shields.io/badge/status-stable-success)

> **CipherCert App** is a professional-grade desktop application designed for real-time **SSL/TLS certificate analysis**, scoring, and monitoring. It bridges the gap between raw backend performance and modern frontend aesthetics by combining a robust **Python** engine with a sleek **Electron & React** user interface.

---

## 📊 Languages & Technologies

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)

---

## 🚀 Key Features

* **🔒 Deep SSL Inspection:** Analyzes certificate chains, issuers, expiry dates, and TLS versions.
* **💯 Automated Scoring:** Proprietary algorithm that grades domains (A-F) based on security standards.
* **📉 Trend Analysis:** Visualizes security score history over time using interactive charts.
* **⚡ High Performance:** Python-based asynchronous engine for non-blocking network scans.
* **💾 Local Persistence:** Automatically saves all scan history to a local SQLite database.
* **🎨 Modern UI:** A responsive, dark-themed dashboard built with Shadcn/UI and Tailwind CSS.

---

## 🛠️ Architecture

The application utilizes a **Client-Server** architecture running locally on the desktop:

1.  **Frontend (UI):** Built with **React (Vite)** wrapped in **Electron**. It handles user interaction and data visualization.
2.  **Backend (Engine):** A **Python (FastAPI)** server spawned automatically by Electron. It performs the heavy lifting (network scanning, crypto analysis, database management).

---

## 📦 Installation Guide

Follow these steps to set up the development environment.

### Prerequisites
* **Node.js** (v18+)
* **Python** (v3.10+)
* **Git**

### 1. Clone Repository
```bash
git clone [https://github.com/Ilia-Shakeri/CipherCert-App.git](https://github.com/Ilia-Shakeri/CipherCert-App.git)
cd CipherCert-App

```

### 2. Backend Setup (Python)

Create a virtual environment to isolate dependencies.

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

Open a new terminal in the `frontend` directory.

```bash
cd ../frontend
npm install

```

---

## ⚡ Usage & Execution

To run the application, you only need one command. This will concurrently start the React development server and the Electron window.

```bash
# Ensure you are in the /frontend directory
npm run electron

```

> **Note:** The application will automatically detect your operating system and launch the correct Python backend path.

---

## ⚙️ Options & Configuration

The application is pre-configured for immediate use, but you can modify the following:

* **Port Configuration:**
* Frontend runs on `http://127.0.0.1:5173`.
* Backend API runs on `http://127.0.0.1:8000`.


* **Database:**
* Data is stored in `backend/data/ciphercert_v2.db`.
* Delete this file to reset your scan history.



---

## 🔧 Troubleshooting

| Issue | Solution |
| --- | --- |
| **White Screen on Start** | Ensure the React server is running on port `5173`. Check console logs (`Ctrl+Shift+I`) for connection errors. |
| **"Python not found"** | Verify that the `venv` folder exists in the `backend` directory and contains Python. |
| **Scan Failed / API Error** | Check if port `8000` is occupied. Kill any rogue `python.exe` processes in Task Manager. |

---

## 📄 License

This project is dedicated to the public domain under the **CC0 1.0 Universal** license.

You can copy, modify, distribute, and perform the work, even for commercial purposes, all without asking permission.

[View Full License](https://creativecommons.org/publicdomain/zero/1.0/)

---

## 👤 Author

**Ilia Shakeri**

* GitHub: [@Ilia-Shakeri](https://www.google.com/search?q=https://github.com/Ilia-Shakeri)