const EMAILJS_CONFIG = {
  serviceId: "",
  templateId: "",
  publicKey: "",
};

const setupView = document.getElementById("setup-view");
const monitorView = document.getElementById("monitor-view");
const summaryView = document.getElementById("summary-view");
const statusBadge = document.getElementById("status-badge");

let lastGeneratedReport = "";
let lastProctorEmail = "";
let lastStudentName = "";

function showView(viewName) {
  setupView.classList.toggle("hidden", viewName !== "setup");
  monitorView.classList.toggle("hidden", viewName !== "monitor");
  summaryView.classList.toggle("hidden", viewName !== "summary");

  if (viewName === "monitor") {
    statusBadge.textContent = "Monitoring Live";
    statusBadge.className = "badge live";
  } else {
    statusBadge.textContent = "Idle";
    statusBadge.className = "badge idle";
  }
}

function renderSession(session) {
  if (!session || !session.isMonitoring) {
    showView("setup");
    return;
  }

  showView("monitor");
  document.getElementById("display-student").textContent = session.studentName;
  document.getElementById("display-email").textContent = session.proctorEmail;

  const tabCount = session.events.filter(
    (e) => e.type === "TAB_SWITCH" || e.type === "AI_SITE",
  ).length;
  const aiCount = session.events.filter((e) => e.isAiFlag).length;

  document.getElementById("stat-tabs").textContent = tabCount;
  document.getElementById("stat-sites").textContent =
    session.visitedUrls.length;
  document.getElementById("stat-ai").textContent = aiCount;
  document.getElementById("event-count").textContent =
    `${session.events.length} events`;

  const list = document.getElementById("event-list");
  list.innerHTML = "";
  session.events.slice(0, 30).forEach((ev) => {
    const li = document.createElement("li");
    li.className = `event-item ${ev.isAiFlag ? "ai" : ""}`;
    li.innerHTML = `<span class="event-time">[${ev.time}]</span> ${ev.detail}`;
    list.appendChild(li);
  });
}

function buildReportText(session) {
  const endedAt = new Date().toLocaleString();
  const tabCount = session.events.filter(
    (e) => e.type === "TAB_SWITCH" || e.type === "AI_SITE",
  ).length;
  const aiEvents = session.events.filter((e) => e.isAiFlag);

  return [
    `=== CHEATSHIELD INTEGRITY REPORT ===`,
    `Student: ${session.studentName}`,
    `Proctor Email: ${session.proctorEmail}`,
    `Started: ${new Date(session.startedAt).toLocaleString()}`,
    `Ended: ${endedAt}`,
    ``,
    `--- SUMMARY ---`,
    `Tab Switches: ${tabCount}`,
    `AI Website Flags: ${aiEvents.length}`,
    `Unique Domains Opened (${session.visitedUrls.length}): ${session.visitedUrls.join(", ") || "None"}`,
    ``,
    `--- CHRONOLOGICAL LOG ---`,
    ...session.events
      .slice()
      .reverse()
      .map((e) => `[${e.time}] [${e.type}] ${e.detail}`),
  ].join("\n");
}

async function sendReportToGmail(proctorEmail, studentName, reportText) {
  if (
    EMAILJS_CONFIG.serviceId &&
    EMAILJS_CONFIG.templateId &&
    EMAILJS_CONFIG.publicKey
  ) {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.serviceId,
        template_id: EMAILJS_CONFIG.templateId,
        user_id: EMAILJS_CONFIG.publicKey,
        template_params: {
          to_email: proctorEmail,
          student_name: studentName,
          report_body: reportText,
        },
      }),
    });
    if (!res.ok) throw new Error("EmailJS API error");
    return "sent_auto";
  }
  return "fallback_ready";
}

document.getElementById("start-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const studentName = document.getElementById("student-name").value.trim();
  const proctorEmail = document.getElementById("proctor-email").value.trim();
  const flagAiSites = document.getElementById("flag-ai").checked;
  const errEl = document.getElementById("setup-error");

  if (!proctorEmail.toLowerCase().endsWith("@gmail.com")) {
    errEl.textContent = "Please enter a valid @gmail.com address.";
    errEl.classList.remove("hidden");
    return;
  }
  errEl.classList.add("hidden");

  const session = {
    isMonitoring: true,
    studentName,
    proctorEmail,
    flagAiSites,
    startedAt: Date.now(),
    events: [],
    visitedUrls: [],
  };

  await chrome.storage.local.set({ session });
  renderSession(session);
});

document.getElementById("finish-btn").addEventListener("click", async () => {
  const { session } = await chrome.storage.local.get("session");
  if (!session) return;

  session.isMonitoring = false;
  await chrome.storage.local.set({ session });

  lastGeneratedReport = buildReportText(session);
  lastProctorEmail = session.proctorEmail;
  lastStudentName = session.studentName;

  document.getElementById("report-preview").value = lastGeneratedReport;
  showView("summary");

  const statusEl = document.getElementById("send-status");
  try {
    const mode = await sendReportToGmail(
      lastProctorEmail,
      lastStudentName,
      lastGeneratedReport,
    );
    if (mode === "sent_auto") {
      statusEl.textContent = `Report automatically emailed to ${lastProctorEmail}!`;
    } else {
      statusEl.textContent = `Report ready for ${lastProctorEmail}. Click "Open in Gmail" below to send.`;
      const subject = encodeURIComponent(
        `CheatShield Report - ${lastStudentName}`,
      );
      const body = encodeURIComponent(lastGeneratedReport);
      chrome.tabs.create({
        url: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lastProctorEmail)}&su=${subject}&body=${body}`,
      });
    }
  } catch {
    statusEl.textContent = `Auto-send failed—use "Open in Gmail" or download the .txt log below.`;
  }
});

document.getElementById("mailto-btn").addEventListener("click", () => {
  const subject = encodeURIComponent(`CheatShield Report - ${lastStudentName}`);
  const body = encodeURIComponent(lastGeneratedReport);
  chrome.tabs.create({
    url: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lastProctorEmail)}&su=${subject}&body=${body}`,
  });
});

document.getElementById("download-btn").addEventListener("click", () => {
  const blob = new Blob([lastGeneratedReport], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CheatShield_${lastStudentName.replace(/\s+/g, "_")}.txt`;
  a.click();
});

document.getElementById("reset-btn").addEventListener("click", async () => {
  await chrome.storage.local.remove("session");
  showView("setup");
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.session) {
    renderSession(changes.session.newValue);
  }
});

chrome.storage.local
  .get("session")
  .then(({ session }) => renderSession(session));
