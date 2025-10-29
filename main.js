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

  // -----------------------
  // Add new entry
  // -----------------------
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

  // -----------------------
  // "Enter" key trigger for Add Entry
  // -----------------------
  inputAmount.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // prevents accidental form submission or reload
      addListBtn.click();     // perform the same action as clicking Add Entry
    }
  });

  // -----------------------
  // Load saved data on start
  // -----------------------
  loadState();
});

// ----------------------
// Logic for hidden menu
// ----------------------
const menu = document.querySelector('#menu');
const hiddenMenu = document.querySelector('.hidden-menu');

menu.addEventListener('click', () => {
  menu.classList.toggle('active');
  hiddenMenu.classList.toggle('active');
});