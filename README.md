<div align="center">
  <img src="Logo.png" alt="CheatShield Logo" width="110" height="110" />
  <h1>CheatShield</h1>
  <p><strong>Lightweight Student Exam Integrity & Session Monitor</strong></p>

  <p>
    <a href="https://github.com/RatsRatata/CheatShield/releases/tag/CheatShield_v1">
      <img src="https://img.shields.io/badge/Release-CheatShield__v1-0ea5e9?style=flat-square&logo=github" alt="Release CheatShield_v1" />
    </a>
    <img src="https://img.shields.io/badge/Manifest-V3-2563eb?style=flat-square&logo=googlechrome&logoColor=white" alt="Manifest V3" />
    <img src="https://img.shields.io/badge/JavaScript-ES2023-f7df1e?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
    <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-16a34a?style=flat-square" alt="Cross-Platform" />
    <img src="https://img.shields.io/badge/Development-AI--Assisted-7c3aed?style=flat-square" alt="AI-Assisted" />
  </p>
</div>

---

## Introduction

**CheatShield** is a self-installed Chrome/Chromium browser extension built to promote academic honesty during online quizzes, coding assessments, and exams. During an active session, it logs internal browser tab switches, visits to common AI tools (such as ChatGPT, Claude, Gemini, Perplexity, and Copilot), and external application switches (`Alt+Tab` / `Cmd+Tab`), then compiles a timestamped integrity report that students can send directly to their instructor or proctor via Gmail or `.txt` download.

> **⚠️ Disclaimer:**
>
> - **AI-Assisted System:** This project was built and refined collaboratively using AI coding assistance alongside manual testing and debugging.
> - **Honor-System Tool:** CheatShield is a client-side, student-installed session logger designed for classroom assessments and lab exams. It is **not** a kernel-level lockdown browser or invasive anti-cheat system, and should be used alongside standard proctoring guidelines.
> - **Local Privacy:** Logging only runs when explicitly started by the student and stops as soon as the session ends. All session data stays locally in `chrome.storage.local` until exported by the user.

### Key Features

- **Tab & Domain Tracking:** Logs when a student switches tabs or navigates to external domains during an exam session.
- **AI Tool Detection:** Automatically flags visits to major generative AI platforms (`chatgpt.com`, `claude.ai`, `gemini.google.com`, `perplexity.ai`, `copilot.microsoft.com`, `deepseek.com`, etc.).
- **Cross-Platform App-Switch Detection:** Differentiates between internal browser tab navigation and switching out to external desktop software (`Alt+Tab` on Windows/Linux, `Cmd+Tab` on macOS).
- **Instant Report Export:** Generates a structured summary and chronological activity log ready to send via Gmail or download as a plain-text report.

---

## How to Install

### Option 1: Download the Release ZIP (Recommended)

1. Go to the **[CheatShield_v1 Release Page](https://github.com/RatsRatata/CheatShield/releases/tag/CheatShield_v1)** and download **`CheatShield.zip`** under **Assets**.
2. Extract **`CheatShield.zip`** to a folder on your computer.
3. Open Google Chrome (or any Chromium-based browser such as Brave, Edge, or Thorium) and go to:

   chrome://extensions

4. Toggle **Developer mode** ON in the top-right corner of the page.
5. Click **Load unpacked** in the top-left corner and select the extracted **`CheatShield`** folder (the directory containing `manifest.json`).
6. Click the **Extensions (puzzle piece)** icon in your browser toolbar and pin **CheatShield** for quick access before starting an exam.

### Option 2: Clone from Source

1. Clone the repository:

   git clone [https://github.com/RatsRatata/CheatShield.git](https://github.com/RatsRatata/CheatShield.git)

2. Follow steps **3–6** above and select the cloned **`CheatShield`** folder.

---

## How to Use

1. Click the **CheatShield** icon in your browser toolbar.
2. Enter your **Student Name**, **Course and Section**, and your instructor's **Email to send to** (`@gmail.com`).
3. Click **Start Exam Monitoring** and complete your exam normally.
4. Once finished, open the **CheatShield** popup and click **End Exam & Send Report** to send the generated report via Gmail or download the `.txt` log.
