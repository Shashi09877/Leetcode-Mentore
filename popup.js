document.addEventListener("DOMContentLoaded", () => {
  const outputText = document.getElementById("output-text");
  const API_URL = "http://127.0.0.1:5000"; 
  let hintLevel = 0;

  // --- CONTENT FORMATTER ---
  function formatContent(text) {
    if (!text) return "";
    return text
      .replace(/\\text\{|\\mathrm\{/g, '').replace(/\\min/g, 'min').replace(/\\times/g, '×')
      .replace(/\\left|\\right|\\/g, '').replace(/\{|\}/g, '')
      .replace(/([a-zA-Z]+\(.*?\)\s*[\+\-\*\/×]\s*\(.*?\)|O\(.*?\)|[A-Z]\s*=\s*[^.\n]+)/g, 
        '<span style="font-family:monospace; background:#334155; color:#fbbf24; padding:2px 6px; border-radius:4px; font-weight:bold;">$1</span>')
      .replace(/\. (?=[A-Z])/g, '.<br><br>')
      .replace(/### (.*)/g, '<h3 style="color:#38bdf8; margin-top:20px; border-bottom:1px solid #334155;">$1</h3>')
      .replace(/## (.*)/g, '<h2 style="color:#38bdf8; margin-top:25px;">$1</h2>')
      .replace(/```(javascript|python|cpp|java)?/g, '<div style="background:#0f172a; padding:15px; border-radius:8px; font-family:monospace; color:#38bdf8; margin:15px 0; border:1px solid #334155; overflow-x:auto;">')
      .replace(/```/g, '</div>')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\n/g, '<br>');
  }

  async function getProblemTitle() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const meta = document.querySelector('meta[property="og:title"]');
          return meta ? meta.content.replace(" - LeetCode", "").trim() : "Unknown Problem";
        },
      });
      return result[0].result;
    } catch (e) { return "Unknown Problem"; }
  }

  // --- UPDATED HISTORY FUNCTION ---
  function saveToHistory(action, problemTitle) {
    chrome.storage.local.get(["history"], (data) => {
      let history = data.history || [];
      // Save the object with the title included
      history.unshift({ 
        action: action, 
        problem: problemTitle, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      });
      // Limit to last 20 entries
      chrome.storage.local.set({ history: history.slice(0, 20) });
    });
  }
  document.getElementById("favBtn").onclick = async () => {
    const title = await getProblemTitle();
    chrome.storage.local.get(["favorites"], async (data) => {
      let favs = data.favorites || [];
      if (!favs.includes(title)) {
        favs.push(title);
        chrome.storage.local.set({ favorites: favs });
      }
      // Sync to MongoDB
      try {
        await fetch(`${API_URL}/saveFavorite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemTitle: title })
        });
        outputText.innerHTML = `<h3 style="color:#ef4444">⭐ Saved!</h3><p>${title} added to cloud.</p>`;
      } catch (e) {
        outputText.innerHTML = `<h3 style="color:#ef4444">⭐ Saved Locally</h3><p>${title} saved (Offline).</p>`;
      }
    });
  };

  document.getElementById("viewFavBtn").onclick = async () => {
    outputText.innerHTML = "<i>Fetching Favorites...</i>";
    try {
      const res = await fetch(`${API_URL}/getFavorites`);
      const cloudFavs = await res.json();
      let list = cloudFavs.map(f => `<div style="padding:10px; border-bottom:1px solid #334155;">❤️ ${f.problemTitle}</div>`).join('');
      outputText.innerHTML = `<h3>❤️ My Favorites</h3>${list || "No favorites yet."}`;
    } catch (e) {
      chrome.storage.local.get(["favorites"], (data) => {
        const favs = data.favorites || [];
        let list = favs.map(f => `<div style="padding:10px; border-bottom:1px solid #334155;">📍 ${f} (Offline)</div>`).join('');
        outputText.innerHTML = `<h3>📍 Local Favorites</h3>${list || "No favorites yet."}`;
      });
    }
  };

  // --- BUTTON LISTENERS WITH HISTORY TRACKING ---

  document.getElementById("getHintBtn").addEventListener("click", async () => {
    const title = await getProblemTitle();
    outputText.innerHTML = "<i>Generating hint...</i>";
    try {
      const res = await fetch(`${API_URL}/getHints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemTitle: title, currentHintLevel: hintLevel }),
      });
      const data = await res.json();
      outputText.innerHTML = `<h3 style="color:#f59e0b">💡 Hint ${hintLevel+1}</h3>${data.hint}`;
      saveToHistory(`Hint ${hintLevel+1}`, title); // Track Title
      hintLevel = (hintLevel + 1) % 3;
    } catch (e) { outputText.innerText = "Server Error."; }
  });

  document.getElementById("getFullBtn").addEventListener("click", async () => {
    const title = await getProblemTitle();
    outputText.innerHTML = "<i>Analyzing logic...</i>";
    try {
      const res = await fetch(`${API_URL}/getExplanation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemTitle: title }),
      });
      const data = await res.json();
      outputText.innerHTML = formatContent(data.explanation);
      saveToHistory("Explanation", title); // Track Title
    } catch (e) { outputText.innerText = "Server Error."; }
  });

  document.getElementById("getStepBtn").addEventListener("click", async () => {
    const title = await getProblemTitle();
    const language = document.getElementById("languageSelect").value;
    outputText.innerHTML = "<i>Coding solutions...</i>";
    try {
      const res = await fetch(`${API_URL}/getSolution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemTitle: title, language }),
      });
      const data = await res.json();
      outputText.innerHTML = formatContent(data.solution);
      saveToHistory(`${language} Solution`, title); // Track Title
    } catch (e) { outputText.innerText = "Server Error."; }
  });

  // --- UPDATED HISTORY VIEW ---
  document.getElementById("viewHistBtn").addEventListener("click", () => {
    chrome.storage.local.get(["history"], (data) => {
      const hist = data.history || [];
      if (hist.length === 0) {
        outputText.innerHTML = "<h3>📜 History</h3><p>No activity yet.</p>";
        return;
      }
      let html = hist.map(h => `
        <div style="padding:10px; border-bottom:1px solid #334155;">
          <span style="color:#94a3b8; font-size:11px;">[${h.time}]</span> 
          <b style="color:#38bdf8;">${h.action}:</b> 
          <span style="color:#e2e8f0;">${h.problem}</span>
        </div>
      `).join('');
      outputText.innerHTML = `<h3>📜 Recent Activity</h3>${html}`;
    });
  });

  // (Include favBtn and viewFavBtn from previous steps here)
});
