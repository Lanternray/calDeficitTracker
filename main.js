document.addEventListener("DOMContentLoaded", () => {
  const addListBtn = document.getElementById("addListBtn");
  const inputDescrip = document.getElementById("inputDescrip");
  const inputAmount = document.getElementById("inputAmount");
  const entriesList = document.querySelector(".entries-list ul");
  const statusDisplay = document.querySelector(".status");
  const proteinCount = document.getElementById("proteinCount");
  const proteinAmount = document.getElementById("proteinAmount");
  const proteinAddBtn = document.getElementById("proteinAddBtn");
  const proteinResetBtn = document.getElementById("proteinResetBtn");

  const histAddBtn = document.getElementById("histAddBtn");
  const histDate = document.getElementById("histDate");
  const histAmount = document.getElementById("histAmount");
  const histEntries = document.querySelector(".histEntries");
  const histResetBtn = document.getElementById("histResetBtn");

  const saveBtn = document.getElementById("saveBtn");

  const tefCount = document.getElementById("tefCount");
  const intakeCount = document.getElementById("intakeCount");

  let totalCalories = 0;
  let proteinTotal = 0;
  let entries = [];
  let historyEntries = [];
  let nextEntryId = 1;
  let nextHistoryId = 1;

  // Cookies for save state
  function setCookie(name, value, days = 30) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/`;
  }

  function getCookie(name) {
    const decodedCookie = decodeURIComponent(document.cookie);
    const parts = decodedCookie.split(";");
    for (let part of parts) {
      part = part.trim();
      if (part.startsWith(name + "=")) {
        return part.substring(name.length + 1);
      }
    }
    return "";
  }

  // Save and load state
  function saveState() {
    const state = { entries, totalCalories, proteinTotal, historyEntries, nextEntryId, nextHistoryId };
    setCookie("calorieTrackerState", JSON.stringify(state), 30);
  }

  function loadState() {
    const cookieValue = getCookie("calorieTrackerState");
    if (!cookieValue) return;

    try {
      const state = JSON.parse(cookieValue);
      if (state.entries && Array.isArray(state.entries)) {
        entries = state.entries;
        // Ensure all loaded entries have unique IDs (for backward compatibility with saved data from before IDs were added)
        let maxId = 0;
        entries.forEach(e => {
          if (e.id == null) {
            e.id = nextEntryId++;
          } else if (e.id >= maxId) {
            maxId = e.id + 1;
          }
        });
        if (maxId > nextEntryId) nextEntryId = maxId;
        totalCalories = state.totalCalories || 0;
        renderEntries();
        updateStatus();
      }
      proteinTotal = state.proteinTotal || 0;
      updateProteinCount();
      if (state.historyEntries && Array.isArray(state.historyEntries)) {
        historyEntries = state.historyEntries;
        // Ensure all loaded history entries have unique IDs
        let maxHistId = 0;
        historyEntries.forEach(e => {
          if (e.id == null) {
            e.id = nextHistoryId++;
          } else if (e.id >= maxHistId) {
            maxHistId = e.id + 1;
          }
        });
        if (maxHistId > nextHistoryId) nextHistoryId = maxHistId;
        renderHistoryEntries();
      }
      // Restore ID counters from saved state if present
      if (state.nextEntryId && state.nextEntryId > nextEntryId) nextEntryId = state.nextEntryId;
      if (state.nextHistoryId && state.nextHistoryId > nextHistoryId) nextHistoryId = state.nextHistoryId;
      updateIntakeCount();
    } catch (e) {
      console.error("Error loading saved state:", e);
    }
  }

  //Status
  function getTefValue() {
    const sum = entries.reduce((total, e) => total + (e.amount > 0 ? e.amount : 0), 0);
    return Math.round(sum * 0.1);
  }

  function updateStatus() {
    const tef = getTefValue();
    const adjusted = totalCalories - tef;
    statusDisplay.textContent = `${adjusted}`;
    if (adjusted < 1) {
      statusDisplay.style.color = "#30b74bff";
    } else {
      statusDisplay.style.color = "#e53c39ff";
    }
  }

  function updateProteinCount() {
    proteinCount.textContent = `${proteinTotal}`;
  }

  function updateTefCount() {
    const sum = entries.reduce((total, e) => total + (e.amount > 0 ? e.amount : 0), 0);
    const tef = Math.round(sum * 0.1);
    tefCount.textContent = `${tef}`;
  }

  function updateIntakeCount() {
    const sum = entries.reduce((total, e) => total + (e.amount > 0 ? e.amount : 0), 0);
    intakeCount.textContent = `${sum}`;
    updateTefCount();
  }

  //Reset Button — custom modal confirmation
  const resetBtn = document.getElementById("resetBtn");
  const confirmModal = document.getElementById("confirmModal");
  const modalYes = document.getElementById("modalYes");
  const modalNo = document.getElementById("modalNo");

  let resetTarget = null; // "main" or "history"

  function showResetModal(target) {
    resetTarget = target;
    confirmModal.style.display = "flex";
  }

  function hideResetModal() {
    confirmModal.style.display = "none";
    resetTarget = null;
  }

  function performMainReset() {
    entries = [];
    totalCalories = 0;

    entriesList.innerHTML = "";

    updateStatus();
    updateIntakeCount();
    saveState();
  }

  function performHistoryReset() {
    historyEntries = [];

    const histEntriesList = document.querySelector(".histEntries-list");
    if (histEntriesList) histEntriesList.innerHTML = "";

    saveState();
  }

  resetBtn.addEventListener("click", () => showResetModal("main"));

  modalYes.addEventListener("click", () => {
    if (resetTarget === "main") {
      performMainReset();
    } else if (resetTarget === "history") {
      performHistoryReset();
    }
    hideResetModal();
  });

  modalNo.addEventListener("click", hideResetModal);

  // Entries
  function createEntryElement(id, description, amount) {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.gap = "10px";
    li.style.marginTop = "6px";
    li.style.color = "hsl(0,0%,80%)";

    // Remove button
    const removeBtn = document.createElement("button");
    const icon = document.createElement("img");
    icon.src = "icons/remove.svg";
    icon.alt = "Remove";
    icon.style.width = "14px";
    icon.style.height = "14px";
    icon.style.verticalAlign = "middle";

    // Add image to button
    removeBtn.appendChild(icon);

    removeBtn.style.backgroundColor = "hsla(0, 0%, 0%, 0.00)";
    removeBtn.style.color = "white";
    removeBtn.style.border = "none";
    removeBtn.style.padding = "4px";
    removeBtn.style.cursor = "pointer";

    // Text span
    const textSpan = document.createElement("span");
    textSpan.textContent = `${description}: ${amount}`;

    // Remove logic
    removeBtn.addEventListener("click", () => {
      entriesList.removeChild(li);
      const entry = entries.find(e => e.id === id);
      if (entry) totalCalories -= entry.amount;
      entries = entries.filter(e => e.id !== id);
      updateStatus();
      updateIntakeCount();
      saveState();
    });

    li.appendChild(removeBtn);
    li.appendChild(textSpan);
    entriesList.appendChild(li);
  }

  function renderEntries() {
    entriesList.innerHTML = "";
    entries.forEach(entry => {
      createEntryElement(entry.id, entry.description, entry.amount);
    });
  }

  //New entries
  addListBtn.addEventListener("click", () => {
    const description = inputDescrip.value.trim();
    const amount = parseFloat(inputAmount.value.trim()) || 0;

    const entry = { id: nextEntryId++, description, amount };
    entries.push(entry);
    createEntryElement(entry.id, description, amount);

    totalCalories += amount;
    updateStatus();
    updateIntakeCount();
    saveState();

    inputDescrip.value = "";
    inputAmount.value = "";
  });

  // Added "enter" key to trigger new entry
  inputAmount.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addListBtn.click();
    }
  });

  proteinAddBtn.addEventListener("click", () => {
    const amount = parseFloat(proteinAmount.value.trim()) || 0;

    proteinTotal += amount;
    updateProteinCount();
    saveState();

    proteinAmount.value = "";
  });

  proteinAmount.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      proteinAddBtn.click();
    }
  });

  proteinResetBtn.addEventListener("click", () => {
    proteinTotal = 0;
    updateProteinCount();
    saveState();
  });

  // --- History Entries ---

  // Get the table body for history entries
  function getHistEntriesList() {
    return document.querySelector(".histEntries-list");
  }

  function createHistoryEntryElement(id, date, amount, savedEntries) {
    const row = document.createElement("tr");
    row.style.color = "hsl(0,0%,80%)";
    row.style.cursor = savedEntries && savedEntries.length > 0 ? "pointer" : "default";

    // Remove button cell
    const removeCell = document.createElement("td");
    const removeBtn = document.createElement("button");
    const icon = document.createElement("img");
    icon.src = "icons/remove.svg";
    icon.alt = "Remove";
    icon.style.width = "14px";
    icon.style.height = "14px";
    icon.style.verticalAlign = "middle";

    removeBtn.appendChild(icon);
    removeBtn.style.backgroundColor = "hsla(0, 0%, 0%, 0.00)";
    removeBtn.style.color = "white";
    removeBtn.style.border = "none";
    removeBtn.style.padding = "4px";
    removeBtn.style.cursor = "pointer";

    removeCell.appendChild(removeBtn);

    // Date cell
    const dateCell = document.createElement("td");
    dateCell.textContent = date;

    // Amount cell
    const amountCell = document.createElement("td");
    amountCell.textContent = amount;
    amountCell.className = amount > 0 ? "histAmount-positive" : "histAmount-negative";

    // Remove logic
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      getHistEntriesList().removeChild(row);
      historyEntries = historyEntries.filter(e => e.id !== id);
      saveState();
    });

    // Click on row to show summary popup (if there are saved entries)
    if (savedEntries && savedEntries.length > 0) {
      const showSummary = () => showEntrySummary(date, amount, savedEntries);
      dateCell.addEventListener("click", showSummary);
      amountCell.addEventListener("click", showSummary);
    }

    row.appendChild(removeCell);
    row.appendChild(dateCell);
    row.appendChild(amountCell);
    return row;
  }

  function renderHistoryEntries() {
    const list = getHistEntriesList();
    list.innerHTML = "";
    historyEntries.forEach(entry => {
      const saved = entry.savedEntries || [];
      const row = createHistoryEntryElement(entry.id, entry.date, entry.amount, saved);
      list.appendChild(row);
    });
  }

  histAddBtn.addEventListener("click", () => {
    const date = histDate.value.trim();
    const amount = parseFloat(histAmount.value.trim()) || 0;

    if (!date) return;

    const entry = { id: nextHistoryId++, date, amount };
    historyEntries.push(entry);

    const row = createHistoryEntryElement(entry.id, date, amount, []);
    getHistEntriesList().appendChild(row);

    saveState();

    histDate.value = "";
    histAmount.value = "";
  });

  // Enter key to trigger history add
  histAmount.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      histAddBtn.click();
    }
  });

  // History reset
  histResetBtn.addEventListener("click", () => showResetModal("history"));

  // --- Save button & Summary Modal ---

  const summaryModal = document.getElementById("summaryModal");
  const summaryDateTitle = document.getElementById("summaryDateTitle");
  const summaryContent = document.getElementById("summaryContent");
  const summaryCloseBtn = document.getElementById("summaryCloseBtn");

  function showEntrySummary(date, amount, savedEntries) {
    const sign = amount >= 0 ? "+" : "";
    summaryDateTitle.textContent = `Entries for ${date} (${sign}${amount})`;

    summaryContent.innerHTML = "";

    if (!savedEntries || savedEntries.length === 0) {
      summaryContent.innerHTML = "<p style='text-align:center;color:var(--text-muted);'>No entries saved for this record.</p>";
    } else {
      const list = document.createElement("ul");
      list.style.listStyle = "none";
      list.style.padding = "0";
      list.style.margin = "0";

      savedEntries.forEach(entry => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.padding = "6px 0";
        li.style.borderBottom = "1px solid var(--border-color)";
        li.style.color = "var(--text-primary)";

        const descSpan = document.createElement("span");
        descSpan.textContent = entry.description || "(no description)";

        const amountSpan = document.createElement("span");
        const val = parseFloat(entry.amount) || 0;
        amountSpan.textContent = val >= 0 ? `+${val}` : `${val}`;
        amountSpan.style.color = val > 0 ? "var(--success)" : "var(--danger)";
        amountSpan.style.fontWeight = "600";

        li.appendChild(descSpan);
        li.appendChild(amountSpan);
        list.appendChild(li);
      });

      summaryContent.appendChild(list);
    }

    summaryModal.style.display = "flex";
  }

  function hideEntrySummary() {
    summaryModal.style.display = "none";
  }

  summaryCloseBtn.addEventListener("click", hideEntrySummary);

  // Close summary modal when clicking outside the box
  summaryModal.addEventListener("click", (e) => {
    if (e.target === summaryModal) hideEntrySummary();
  });

  // Save button: records current status, date, and all entries to history
  saveBtn.addEventListener("click", () => {
    const statusValue = parseInt(statusDisplay.textContent, 10) || 0;
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const today = `${month}/${day}`;

    // Snapshot of all current entries
    const savedEntries = entries.map(e => ({
      description: e.description,
      amount: e.amount
    }));

    const entry = {
      id: nextHistoryId++,
      date: today,
      amount: statusValue,
      savedEntries: savedEntries
    };

    historyEntries.push(entry);

    const row = createHistoryEntryElement(entry.id, today, statusValue, savedEntries);
    getHistEntriesList().appendChild(row);

    saveState();
  });

  // Load saved data on start
  loadState();
  updateProteinCount();
  updateIntakeCount();
});

// Hidden Menu
const menu = document.querySelector('#menu');
const hiddenMenu = document.querySelector('.hidden-menu');

menu.addEventListener('click', () => {
  menu.classList.toggle('active');
  hiddenMenu.classList.toggle('active');
});