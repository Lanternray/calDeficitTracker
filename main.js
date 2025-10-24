document.addEventListener("DOMContentLoaded", () => {
  const addListBtn = document.getElementById("addListBtn");
  const inputDescrip = document.getElementById("inputDescrip");
  const inputAmount = document.getElementById("inputAmount");
  const entriesList = document.querySelector(".entries-list ul");
  const statusDisplay = document.querySelector(".status");

  let totalCalories = 0;
  let entries = [];

  // -----------------------
  // Cookie helpers
  // -----------------------
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

  // -----------------------
  // Save + load state
  // -----------------------
  function saveState() {
    const state = { entries, totalCalories };
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
    } catch (e) {
      console.error("Error loading saved state:", e);
    }
  }

  // -----------------------
  // Status + color logic
  // -----------------------
  function updateStatus() {
    statusDisplay.textContent = `Calories: ${totalCalories}`;
    if (totalCalories < 1) {
      statusDisplay.style.color = "#30b74bff";
    } else {
      statusDisplay.style.color = "#e53c39ff"; // bright green
    }
  }

    // -----------------------
  // Reset button logic
  // -----------------------
  const resetBtn = document.getElementById("resetBtn");
  resetBtn.addEventListener("click", () => {
    // Clear all data
    entries = [];
    totalCalories = 0;

    // Clear the list in the DOM
    entriesList.innerHTML = "";

    // Update display
    updateStatus();

    // Delete saved cookie
    setCookie("calorieTrackerState", "", -1); // expire immediately
  });

  // -----------------------
  // Entry creation logic
  // -----------------------
  function createEntryElement(description, amount) {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.gap = "10px";
    li.style.marginTop = "6px";
    li.style.color = "#ddd";

    // Remove button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "x";
    removeBtn.style.backgroundColor = "#9f9f9fff";
    removeBtn.style.color = "white";
    removeBtn.style.border = "none";
    removeBtn.style.borderRadius = "100vw";
    removeBtn.style.padding = "2px 8px";
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

  // -----------------------
  // Add new entry
  // -----------------------
  addListBtn.addEventListener("click", () => {
    const description = inputDescrip.value.trim();
    const amount = parseFloat(inputAmount.value.trim());
    if (description === "" || isNaN(amount)) {
      alert("Please enter both description and a valid amount.");
      return;
    }

    const entry = { description, amount };
    entries.push(entry);
    createEntryElement(description, amount);

    totalCalories += amount;
    updateStatus();
    saveState();

    inputDescrip.value = "";
    inputAmount.value = "";
  });

  // -----------------------
  // Load saved data on start
  // -----------------------
  loadState();
});
