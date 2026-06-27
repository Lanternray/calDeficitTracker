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

  let totalCalories = 0;
  let proteinTotal = 0;
  let entries = [];
  let historyEntries = [];

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
    const state = { entries, totalCalories, proteinTotal, historyEntries };
    setCookie("calorieTrackerState", JSON.stringify(state), 30);
  }

  function loadState() {
    const cookieValue = getCookie("calorieTrackerState");
    if (!cookieValue) return;

    try {
      const state = JSON.parse(cookieValue);
      if (state.entries && Array.isArray(state.entries)) {
        entries = state.entries;
        totalCalories = state.totalCalories || 0;
        renderEntries();
        updateStatus();
      }
      proteinTotal = state.proteinTotal || 0;
      updateProteinCount();
      if (state.historyEntries && Array.isArray(state.historyEntries)) {
        historyEntries = state.historyEntries;
        renderHistoryEntries();
      }
    } catch (e) {
      console.error("Error loading saved state:", e);
    }
  }

  //Status
  function updateStatus() {
    statusDisplay.textContent = `${totalCalories}`;
    if (totalCalories < 1) {
      statusDisplay.style.color = "#30b74bff";
    } else {
      statusDisplay.style.color = "#e53c39ff"; // bright green
    }
  }

  function updateProteinCount() {
    proteinCount.textContent = `${proteinTotal}`;
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
  function createEntryElement(description, amount) {
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
      totalCalories -= amount;
      entries = entries.filter(e => !(e.description === description && e.amount === amount));
      updateStatus();
      saveState();
    });

    li.appendChild(removeBtn);
    li.appendChild(textSpan);
    entriesList.appendChild(li);
  }

  function renderEntries() {
    entriesList.innerHTML = "";
    entries.forEach(entry => {
      createEntryElement(entry.description, entry.amount);
    });
  }

  //New entries
  addListBtn.addEventListener("click", () => {
    const description = inputDescrip.value.trim();
    const amount = parseFloat(inputAmount.value.trim()) || 0;

    const entry = { description, amount };
    entries.push(entry);
    createEntryElement(description, amount);

    totalCalories += amount;
    updateStatus();
    saveState();

    inputDescrip.value = "";
    inputAmount.value = "";
  });

  // Added "enter" key to trigger new entry
  inputAmount.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // prevents accidental form submission or reload
      addListBtn.click();     // perform the same action as clicking Add Entry
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

  function createHistoryEntryElement(date, amount) {
    const row = document.createElement("tr");
    row.style.color = "hsl(0,0%,80%)";

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
    removeBtn.addEventListener("click", () => {
      getHistEntriesList().removeChild(row);
      historyEntries = historyEntries.filter(e => !(e.date === date && e.amount === amount));
      saveState();
    });

    row.appendChild(removeCell);
    row.appendChild(dateCell);
    row.appendChild(amountCell);
    return row;
  }

  function renderHistoryEntries() {
    const list = getHistEntriesList();
    list.innerHTML = "";
    historyEntries.forEach(entry => {
      const row = createHistoryEntryElement(entry.date, entry.amount);
      list.appendChild(row);
    });
  }

  histAddBtn.addEventListener("click", () => {
    const date = histDate.value.trim();
    const amount = parseFloat(histAmount.value.trim()) || 0;

    if (!date) return; // don't add if date is empty

    const entry = { date, amount };
    historyEntries.push(entry);

    const row = createHistoryEntryElement(date, amount);
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

  // Load saved data on start
  loadState();
  updateProteinCount();
});

// Hidden Menu
const menu = document.querySelector('#menu');
const hiddenMenu = document.querySelector('.hidden-menu');

menu.addEventListener('click', () => {
  menu.classList.toggle('active');
  hiddenMenu.classList.toggle('active');
});
