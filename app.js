(function () {
  "use strict";

  var STORE_KEY = "prmsc_registry_state_v1";
  var CRED_KEY = "prmsc_admin_credential_v1";

  var DEFAULT_ITEMS = [
    {
      id: "laptop-i3",
      name: "Laptop Core i3",
      category: "laptop",
      processor: "Intel Core i3",
      spec: '8 GB RAM · 256 GB SSD · 14" Display',
      totalQuantity: 0,
      issuedQuantity: 0,
    },
    {
      id: "laptop-i5",
      name: "Laptop Core i5",
      category: "laptop",
      processor: "Intel Core i5",
      spec: '16 GB RAM · 512 GB SSD · 14" Display',
      totalQuantity: 0,
      issuedQuantity: 0,
    },
    {
      id: "laptop-i7",
      name: "Laptop Core i7",
      category: "laptop",
      processor: "Intel Core i7",
      spec: '16 GB RAM · 1 TB SSD · 15.6" Display',
      totalQuantity: 0,
      issuedQuantity: 0,
    },
    {
      id: "desktop-i3",
      name: "Desktop Core i3",
      category: "desktop",
      processor: "Intel Core i3",
      spec: '8 GB RAM · 256 GB SSD · 22" Monitor',
      totalQuantity: 0,
      issuedQuantity: 0,
    },
    {
      id: "desktop-i5",
      name: "Desktop Core i5",
      category: "desktop",
      processor: "Intel Core i5",
      spec: '16 GB RAM · 512 GB SSD · 24" Monitor',
      totalQuantity: 0,
      issuedQuantity: 0,
    },
    {
      id: "desktop-i7",
      name: "Desktop Core i7",
      category: "desktop",
      processor: "Intel Core i7",
      spec: '32 GB RAM · 1 TB SSD · 27" Monitor',
      totalQuantity: 0,
      issuedQuantity: 0,
    },
  ];

  // Runtime state (session lives strictly in JS memory)
  var authenticatedUser = null;
  var activeTab = "inventory";
  var historyFilter = "All";
  var historySearch = "";
  var stockModalItemId = null;
  var stockModalMode = "add";
  var returnModalIssuanceId = null;
  var appState = loadAppState();

  // DOM Elements
  var loginView = document.getElementById("login-view");
  var appView = document.getElementById("app-view");

  var authHeading = document.getElementById("auth-heading");
  var authSubheading = document.getElementById("auth-subheading");
  var authNotice = document.getElementById("auth-notice");
  var authError = document.getElementById("auth-error");
  var authForm = document.getElementById("auth-form");
  var loginInput = document.getElementById("login-input");
  var passwordInput = document.getElementById("password-input");
  var confirmPasswordGroup = document.getElementById("confirm-password-group");
  var confirmPasswordInput = document.getElementById("confirm-password-input");
  var togglePasswordBtn = document.getElementById("toggle-password-btn");
  var authSubmitBtn = document.getElementById("auth-submit-btn");
  var resetCredsLink = document.getElementById("reset-creds-link");

  var navInventoryBtn = document.getElementById("nav-inventory-btn");
  var navHistoryBtn = document.getElementById("nav-history-btn");
  var signOutBtn = document.getElementById("sign-out-btn");
  var signedInUserEl = document.getElementById("signed-in-user");

  var kpiTotal = document.getElementById("kpi-total");
  var kpiIssued = document.getElementById("kpi-issued");
  var kpiAvailable = document.getElementById("kpi-available");
  var kpiActive = document.getElementById("kpi-active");

  var workspaceFeedback = document.getElementById("workspace-feedback");
  var tabInventory = document.getElementById("tab-inventory");
  var tabHistory = document.getElementById("tab-history");

  var fixQuantitiesPanel = document.getElementById("fix-quantities-panel");
  var fixQuantitiesForm = document.getElementById("fix-quantities-form");
  var fixQuantitiesGrid = document.getElementById("fix-quantities-grid");

  var laptopsGrid = document.getElementById("laptops-grid");
  var desktopsGrid = document.getElementById("desktops-grid");
  var laptopsAvailCount = document.getElementById("laptops-available-count");
  var desktopsAvailCount = document.getElementById("desktops-available-count");

  var issueForm = document.getElementById("issue-form");
  var issueItemSelect = document.getElementById("issue-item-select");
  var issueEmployeeName = document.getElementById("issue-employee-name");
  var issueDesignation = document.getElementById("issue-designation");
  var issueQuantity = document.getElementById("issue-quantity");
  var issueEmployeeConfirm = document.getElementById("issue-employee-confirm");
  var issueSubmitBtn = document.getElementById("issue-submit-btn");

  var activeIssuancesEmpty = document.getElementById("active-issuances-empty");
  var activeIssuancesWrap = document.getElementById("active-issuances-wrap");
  var activeIssuancesBody = document.getElementById("active-issuances-body");
  var jumpToHistoryBtn = document.getElementById("jump-to-history-btn");

  var exportCsvBtn = document.getElementById("export-csv-btn");
  var backToInventoryBtn = document.getElementById("back-to-inventory-btn");
  var historySearchInput = document.getElementById("history-search-input");
  var historyEmpty = document.getElementById("history-empty");
  var historyTableWrap = document.getElementById("history-table-wrap");
  var historyTableBody = document.getElementById("history-table-body");

  var stockModal = document.getElementById("stock-modal");
  var stockModalTitle = document.getElementById("stock-modal-title");
  var stockModalMeta = document.getElementById("stock-modal-meta");
  var stockModalLabel = document.getElementById("stock-modal-label");
  var stockModalAmount = document.getElementById("stock-modal-amount");
  var stockModalHint = document.getElementById("stock-modal-hint");
  var stockModalForm = document.getElementById("stock-modal-form");
  var modeAddBtn = document.getElementById("mode-add-btn");
  var modeSetBtn = document.getElementById("mode-set-btn");
  var closeStockModalBtn = document.getElementById("close-stock-modal-btn");
  var cancelStockModalBtn = document.getElementById("cancel-stock-modal-btn");

  var returnModal = document.getElementById("return-modal");
  var returnModalMeta = document.getElementById("return-modal-meta");
  var returnItemName = document.getElementById("return-item-name");
  var returnItemHeld = document.getElementById("return-item-held");
  var returnModalQty = document.getElementById("return-modal-qty");
  var returnModalForm = document.getElementById("return-modal-form");
  var closeReturnModalBtn = document.getElementById("close-return-modal-btn");
  var cancelReturnModalBtn = document.getElementById("cancel-return-modal-btn");

  // =========================================================================
  // Persistence Helpers
  // =========================================================================
  function createDefaultState() {
    return {
      quantitiesFixed: false,
      sequence: 1000,
      items: DEFAULT_ITEMS.map(function (it) {
        return Object.assign({}, it);
      }),
      issuances: [],
      history: [],
    };
  }

  function loadAppState() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return createDefaultState();
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items) || parsed.items.length !== 6) {
        return createDefaultState();
      }
      return {
        quantitiesFixed: Boolean(parsed.quantitiesFixed),
        sequence: typeof parsed.sequence === "number" ? parsed.sequence : 1000,
        items: parsed.items,
        issuances: Array.isArray(parsed.issuances) ? parsed.issuances : [],
        history: Array.isArray(parsed.history) ? parsed.history : [],
      };
    } catch (_err) {
      return createDefaultState();
    }
  }

  function saveAppState() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(appState));
    } catch (_err) {
      // Ignore storage quota errors gracefully
    }
  }

  function loadCredential() {
    try {
      var raw = window.localStorage.getItem(CRED_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (parsed && parsed.login && parsed.salt && parsed.hash) {
        return parsed;
      }
      return null;
    } catch (_err) {
      return null;
    }
  }

  function saveCredential(cred) {
    window.localStorage.setItem(CRED_KEY, JSON.stringify(cred));
  }

  function nextId(prefix) {
    appState.sequence += 1;
    return prefix + "-" + appState.sequence;
  }

  // =========================================================================
  // Cryptographic Hashing for Administrator Login & Password
  // =========================================================================
  function randomHex(byteCount) {
    var bytes = new Uint8Array(byteCount);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function sha256Hex(text) {
    if (window.crypto && window.crypto.subtle) {
      var encoder = new TextEncoder();
      return window.crypto.subtle.digest("SHA-256", encoder.encode(text)).then(function (buf) {
        return Array.from(new Uint8Array(buf), function (b) {
          return b.toString(16).padStart(2, "0");
        }).join("");
      });
    }
    // Fallback deterministic digest only when crypto.subtle is unavailable
    var hash = 2166136261;
    for (var i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Promise.resolve((hash >>> 0).toString(16));
  }

  // =========================================================================
  // Auth UI Setup & Verification
  // =========================================================================
  function renderAuthMode() {
    var cred = loadCredential();
    hideAuthError();

    if (!cred) {
      authHeading.textContent = "Create Administrator Login";
      authSubheading.textContent =
        "Set your PRMSC administrator login ID and password once to secure this portal.";
      confirmPasswordGroup.classList.remove("hidden");
      confirmPasswordInput.required = true;
      passwordInput.setAttribute("autocomplete", "new-password");
      passwordInput.placeholder = "Create a password (min. 4 characters)";
      authSubmitBtn.textContent = "Save Credentials & Continue";
      resetCredsLink.classList.add("hidden");
    } else {
      authHeading.textContent = "Administrator Sign In";
      authSubheading.textContent =
        "Enter your login ID and password to access hardware stock, employee issuance, and return history.";
      confirmPasswordGroup.classList.add("hidden");
      confirmPasswordInput.required = false;
      passwordInput.setAttribute("autocomplete", "current-password");
      passwordInput.placeholder = "Enter your password";
      authSubmitBtn.textContent = "Sign In to Portal";
      resetCredsLink.classList.remove("hidden");
    }
  }

  function showAuthError(msg) {
    authError.textContent = msg;
    authError.classList.remove("hidden");
  }

  function hideAuthError() {
    authError.textContent = "";
    authError.classList.add("hidden");
  }

  function showAuthNotice(msg) {
    authNotice.textContent = msg;
    authNotice.classList.remove("hidden");
  }

  function hideAuthNotice() {
    authNotice.textContent = "";
    authNotice.classList.add("hidden");
  }

  togglePasswordBtn.addEventListener("click", function () {
    var isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    confirmPasswordInput.type = isHidden ? "text" : "password";
    togglePasswordBtn.textContent = isHidden ? "Hide" : "Show";
    togglePasswordBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });

  resetCredsLink.addEventListener("click", function () {
    window.localStorage.removeItem(CRED_KEY);
    loginInput.value = "";
    passwordInput.value = "";
    confirmPasswordInput.value = "";
    hideAuthNotice();
    renderAuthMode();
    showAuthNotice("Previous portal credentials cleared. Create a new login ID and password below.");
  });

  authForm.addEventListener("submit", function (e) {
    e.preventDefault();
    hideAuthError();
    hideAuthNotice();

    var enteredLogin = loginInput.value.trim();
    var enteredPassword = passwordInput.value;

    if (!enteredLogin || !enteredPassword) {
      showAuthError("Please enter both your login ID and password.");
      return;
    }

    var existing = loadCredential();
    if (!existing) {
      if (enteredPassword.length < 4) {
        showAuthError("Password must be at least 4 characters long.");
        return;
      }
      if (enteredPassword !== confirmPasswordInput.value) {
        showAuthError("Passwords do not match. Please verify and try again.");
        return;
      }
      var salt = randomHex(16);
      sha256Hex(salt + ":" + enteredPassword).then(function (digest) {
        saveCredential({
          login: enteredLogin,
          salt: salt,
          hash: digest,
        });
        passwordInput.value = "";
        confirmPasswordInput.value = "";
        renderAuthMode();
        showAuthNotice(
          "Administrator credentials saved. Enter your login ID and password below to proceed."
        );
      });
      return;
    }

    sha256Hex(existing.salt + ":" + enteredPassword).then(function (digest) {
      var loginMatches = enteredLogin.toLowerCase() === existing.login.toLowerCase();
      var passwordMatches = digest === existing.hash;

      if (!loginMatches || !passwordMatches) {
        showAuthError(
          "Incorrect login ID or password. Access denied — please remain on the login page and try again."
        );
        return;
      }

      authenticatedUser = existing.login;
      passwordInput.value = "";
      enterPortal();
    });
  });

  function enterPortal() {
    loginView.classList.add("hidden");
    appView.classList.remove("hidden");
    signedInUserEl.textContent = "Signed in as " + authenticatedUser;
    switchTab("inventory");
    renderWorkspace();
  }

  signOutBtn.addEventListener("click", function () {
    authenticatedUser = null;
    appView.classList.add("hidden");
    loginView.classList.remove("hidden");
    loginInput.value = "";
    passwordInput.value = "";
    hideAuthError();
    hideAuthNotice();
    renderAuthMode();
  });

  // =========================================================================
  // Tab Navigation
  // =========================================================================
  function switchTab(tab) {
    activeTab = tab;
    if (tab === "inventory") {
      tabInventory.classList.remove("hidden");
      tabHistory.classList.add("hidden");
      navInventoryBtn.classList.add("is-active");
      navHistoryBtn.classList.remove("is-active");
    } else {
      tabInventory.classList.add("hidden");
      tabHistory.classList.remove("hidden");
      navInventoryBtn.classList.remove("is-active");
      navHistoryBtn.classList.add("is-active");
    }
  }

  navInventoryBtn.addEventListener("click", function () {
    switchTab("inventory");
  });

  navHistoryBtn.addEventListener("click", function () {
    switchTab("history");
    renderHistoryTable();
  });

  jumpToHistoryBtn.addEventListener("click", function () {
    switchTab("history");
    renderHistoryTable();
  });

  backToInventoryBtn.addEventListener("click", function () {
    switchTab("inventory");
  });

  // =========================================================================
  // Feedback Banner
  // =========================================================================
  function showFeedback(type, message) {
    workspaceFeedback.className =
      "alert " + (type === "error" ? "alert-error" : "alert-success");
    workspaceFeedback.innerHTML = "";

    var textSpan = document.createElement("span");
    textSpan.textContent = message;

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "modal-close";
    closeBtn.setAttribute("aria-label", "Dismiss message");
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", clearFeedback);

    workspaceFeedback.appendChild(textSpan);
    workspaceFeedback.appendChild(closeBtn);
    workspaceFeedback.classList.remove("hidden");
  }

  function clearFeedback() {
    workspaceFeedback.classList.add("hidden");
    workspaceFeedback.innerHTML = "";
  }

  // =========================================================================
  // Workspace Rendering
  // =========================================================================
  function renderWorkspace() {
    renderKpis();
    renderFixQuantitiesPanel();
    renderHardwareCards();
    renderIssueSelect();
    renderActiveIssuances();
    renderHistoryTable();
  }

  function renderKpis() {
    var total = 0;
    var issued = 0;
    for (var i = 0; i < appState.items.length; i++) {
      total += appState.items[i].totalQuantity;
      issued += appState.items[i].issuedQuantity;
    }
    var available = total - issued;
    var activeHoldings = appState.issuances.filter(function (rec) {
      return rec.quantity - rec.returnedQuantity > 0;
    }).length;

    kpiTotal.textContent = String(total);
    kpiIssued.textContent = String(issued);
    kpiAvailable.textContent = String(available);
    kpiActive.textContent = String(activeHoldings);
  }

  function renderFixQuantitiesPanel() {
    if (appState.quantitiesFixed) {
      fixQuantitiesPanel.classList.add("hidden");
      return;
    }
    fixQuantitiesPanel.classList.remove("hidden");
    fixQuantitiesGrid.innerHTML = "";

    appState.items.forEach(function (item) {
      var box = document.createElement("div");
      box.className = "setup-item-box";

      var metaWrap = document.createElement("div");
      var label = document.createElement("label");
      label.className = "setup-item-name";
      label.setAttribute("for", "fix-qty-" + item.id);
      label.textContent = item.name;

      var sub = document.createElement("span");
      sub.className = "setup-item-meta";
      sub.textContent =
        (item.category === "laptop" ? "Laptop" : "Desktop") + " · " + item.processor;

      metaWrap.appendChild(label);
      metaWrap.appendChild(sub);

      var input = document.createElement("input");
      input.id = "fix-qty-" + item.id;
      input.type = "number";
      input.min = String(item.issuedQuantity);
      input.step = "1";
      input.required = true;
      input.value = String(item.totalQuantity);
      input.className = "text-input mono-input setup-qty-input";
      input.dataset.itemId = item.id;

      box.appendChild(metaWrap);
      box.appendChild(input);
      fixQuantitiesGrid.appendChild(box);
    });
  }

  fixQuantitiesForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearFeedback();

    var inputs = fixQuantitiesGrid.querySelectorAll("input[data-item-id]");
    var nextTotals = {};
    var sum = 0;

    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      var id = inp.dataset.itemId;
      var val = Number(inp.value);
      var item = findItem(id);
      if (!Number.isInteger(val) || val < 0) {
        showFeedback("error", "Enter a valid whole number (0 or greater) for " + item.name + ".");
        return;
      }
      if (val < item.issuedQuantity) {
        showFeedback(
          "error",
          "Total for " + item.name + " cannot be less than currently issued (" + item.issuedQuantity + ")."
        );
        return;
      }
      nextTotals[id] = val;
      sum += val;
    }

    if (sum <= 0) {
      showFeedback(
        "error",
        "Please set at least 1 unit across your laptops or desktops before fixing quantities."
      );
      return;
    }

    appState.items.forEach(function (item) {
      var nextVal = nextTotals[item.id];
      item.totalQuantity = nextVal;
      if (nextVal > 0) {
        appState.history.unshift({
          id: nextId("LOG"),
          action: "Stock Updated",
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          employeeName: authenticatedUser || "Administrator",
          designation: "PRMSC Asset Store",
          quantity: nextVal,
          remainingAvailable: item.totalQuantity - item.issuedQuantity,
          timestamp: new Date().toISOString(),
        });
      }
    });

    appState.quantitiesFixed = true;
    saveAppState();
    renderWorkspace();
    showFeedback(
      "success",
      "Total quantities fixed and saved. You can now issue laptops and desktops to PRMSC employees."
    );
  });

  function renderHardwareCards() {
    laptopsGrid.innerHTML = "";
    desktopsGrid.innerHTML = "";

    var laptopAvail = 0;
    var desktopAvail = 0;

    appState.items.forEach(function (item) {
      var available = item.totalQuantity - item.issuedQuantity;
      if (item.category === "laptop") laptopAvail += available;
      else desktopAvail += available;

      var card = document.createElement("article");
      card.className = "hardware-card";

      var top = document.createElement("div");
      top.className = "hardware-card-top";

      var titleWrap = document.createElement("div");
      var h4 = document.createElement("h3");
      h4.className = "hardware-name";
      h4.textContent = item.name;
      var spec = document.createElement("p");
      spec.className = "hardware-spec";
      spec.textContent = item.spec;
      titleWrap.appendChild(h4);
      titleWrap.appendChild(spec);

      var statusBadge = document.createElement("span");
      statusBadge.className = "status-label ";
      if (!appState.quantitiesFixed) {
        statusBadge.className += "status-pending";
        statusBadge.textContent = "Awaiting Fix";
      } else if (available <= 0) {
        statusBadge.className += "status-out";
        statusBadge.textContent = "Out of Stock";
      } else if (available <= 2 && item.totalQuantity > 2) {
        statusBadge.className += "status-low";
        statusBadge.textContent = "Low Stock";
      } else {
        statusBadge.className += "status-available";
        statusBadge.textContent = "Available";
      }

      top.appendChild(titleWrap);
      top.appendChild(statusBadge);

      var stats = document.createElement("div");
      stats.className = "hardware-stats";
      stats.appendChild(createStatCell("Total Fixed", item.totalQuantity, ""));
      stats.appendChild(createStatCell("Issued", item.issuedQuantity, ""));
      stats.appendChild(
        createStatCell(
          "Available",
          available,
          available > 0 ? "stat-value-accent" : "stat-value-out"
        )
      );

      var actions = document.createElement("div");
      actions.className = "hardware-actions";

      var issueBtn = document.createElement("button");
      issueBtn.type = "button";
      issueBtn.className = "btn btn-primary";
      issueBtn.textContent = "Issue Item";
      issueBtn.disabled = !appState.quantitiesFixed || available <= 0;
      issueBtn.addEventListener("click", function () {
        issueItemSelect.value = item.id;
        issueQuantity.value = "1";
        issueEmployeeName.focus();
        issueEmployeeName.scrollIntoView({behavior: "smooth", block: "center"});
      });

      var updateBtn = document.createElement("button");
      updateBtn.type = "button";
      updateBtn.className = "btn btn-outline";
      updateBtn.textContent = "Add / Update";
      updateBtn.addEventListener("click", function () {
        openStockModal(item.id);
      });

      actions.appendChild(issueBtn);
      actions.appendChild(updateBtn);

      card.appendChild(top);
      card.appendChild(stats);
      card.appendChild(actions);

      if (item.category === "laptop") {
        laptopsGrid.appendChild(card);
      } else {
        desktopsGrid.appendChild(card);
      }
    });

    laptopsAvailCount.textContent = laptopAvail + " available";
    desktopsAvailCount.textContent = desktopAvail + " available";
  }

  function createStatCell(label, value, extraClass) {
    var cell = document.createElement("div");
    var lbl = document.createElement("span");
    lbl.className = "stat-label";
    lbl.textContent = label;
    var val = document.createElement("span");
    val.className = "stat-value " + extraClass;
    val.textContent = String(value);
    cell.appendChild(lbl);
    cell.appendChild(val);
    return cell;
  }

  function renderIssueSelect() {
    var prev = issueItemSelect.value;
    issueItemSelect.innerHTML = "";
    appState.items.forEach(function (item) {
      var avail = item.totalQuantity - item.issuedQuantity;
      var opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = item.name + " (" + avail + " available)";
      issueItemSelect.appendChild(opt);
    });
    if (prev && findItem(prev)) {
      issueItemSelect.value = prev;
    }

    var disabled = !appState.quantitiesFixed;
    issueItemSelect.disabled = disabled;
    issueEmployeeName.disabled = disabled;
    issueDesignation.disabled = disabled;
    issueQuantity.disabled = disabled;
    issueEmployeeConfirm.disabled = disabled;
    issueSubmitBtn.disabled = disabled;
    issueSubmitBtn.textContent = disabled ? "Fix Total Quantities First" : "Submit Issuance";
  }

  issueForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearFeedback();

    if (!appState.quantitiesFixed) {
      showFeedback("error", "Please fix total quantities first before issuing items.");
      return;
    }

    var item = findItem(issueItemSelect.value);
    var name = issueEmployeeName.value.trim();
    var designation = issueDesignation.value.trim();
    var qty = Number(issueQuantity.value);

    if (!name || name.length < 2) {
      showFeedback("error", "Please fill in the Employee Name blank.");
      issueEmployeeName.focus();
      return;
    }
    if (!designation || designation.length < 2) {
      showFeedback("error", "Please fill in the Designation blank.");
      issueDesignation.focus();
      return;
    }
    if (!issueEmployeeConfirm.checked) {
      showFeedback(
        "error",
        "Items may only be issued to confirmed PRMSC company employees."
      );
      return;
    }
    if (!Number.isInteger(qty) || qty < 1) {
      showFeedback("error", "Issue quantity must be a whole number of at least 1.");
      return;
    }

    var available = item.totalQuantity - item.issuedQuantity;
    if (qty > available) {
      showFeedback(
        "error",
        "Cannot issue " + qty + " unit(s); only " + available + " available for " + item.name + "."
      );
      return;
    }

    item.issuedQuantity += qty;
    var remainingAfter = item.totalQuantity - item.issuedQuantity;

    var record = {
      id: nextId("ISS"),
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      employeeName: name,
      designation: designation,
      quantity: qty,
      returnedQuantity: 0,
      issuedAt: new Date().toISOString(),
      status: "Issued",
    };
    appState.issuances.unshift(record);

    appState.history.unshift({
      id: nextId("LOG"),
      action: "Issued",
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      employeeName: name,
      designation: designation,
      quantity: qty,
      remainingAvailable: remainingAfter,
      timestamp: new Date().toISOString(),
    });

    saveAppState();
    issueEmployeeName.value = "";
    issueDesignation.value = "";
    issueQuantity.value = "1";
    renderWorkspace();
    showFeedback(
      "success",
      "Issued " + qty + " × " + item.name + " to " + name + " (" + designation + ")."
    );
  });

  // =========================================================================
  // Active Issuances Table & Return Modal
  // =========================================================================
  function renderActiveIssuances() {
    var active = appState.issuances.filter(function (rec) {
      return rec.quantity - rec.returnedQuantity > 0;
    });

    activeIssuancesBody.innerHTML = "";
    if (active.length === 0) {
      activeIssuancesEmpty.classList.remove("hidden");
      activeIssuancesWrap.classList.add("hidden");
      return;
    }

    activeIssuancesEmpty.classList.add("hidden");
    activeIssuancesWrap.classList.remove("hidden");

    active.forEach(function (rec) {
      var held = rec.quantity - rec.returnedQuantity;
      var tr = document.createElement("tr");

      var tdId = document.createElement("td");
      tdId.className = "mono-cell";
      tdId.textContent = rec.id;

      var tdName = document.createElement("td");
      tdName.textContent = rec.employeeName;
      tdName.style.fontWeight = "600";

      var tdDesig = document.createElement("td");
      tdDesig.textContent = rec.designation;

      var tdItem = document.createElement("td");
      tdItem.textContent = rec.itemName;

      var tdQty = document.createElement("td");
      tdQty.className = "num-col";
      tdQty.textContent = held + (rec.returnedQuantity > 0 ? " / " + rec.quantity : "");

      var tdDate = document.createElement("td");
      tdDate.className = "mono-cell";
      tdDate.textContent = formatShortDate(rec.issuedAt);

      var tdAct = document.createElement("td");
      tdAct.className = "action-col";

      var returnBtn = document.createElement("button");
      returnBtn.type = "button";
      returnBtn.className = "btn btn-soft btn-sm";
      returnBtn.textContent = "Return Item";
      returnBtn.addEventListener("click", function () {
        openReturnModal(rec.id);
      });
      tdAct.appendChild(returnBtn);

      tr.appendChild(tdId);
      tr.appendChild(tdName);
      tr.appendChild(tdDesig);
      tr.appendChild(tdItem);
      tr.appendChild(tdQty);
      tr.appendChild(tdDate);
      tr.appendChild(tdAct);

      activeIssuancesBody.appendChild(tr);
    });
  }

  function openReturnModal(issuanceId) {
    var rec = findIssuance(issuanceId);
    if (!rec) return;
    returnModalIssuanceId = issuanceId;
    var held = rec.quantity - rec.returnedQuantity;

    returnModalMeta.textContent = rec.employeeName + " · " + rec.designation;
    returnItemName.textContent = rec.itemName;
    returnItemHeld.textContent = "Currently held: " + held + " unit(s)";
    returnModalQty.value = String(held);
    returnModalQty.max = String(held);
    returnModal.classList.remove("hidden");
    returnModalQty.focus();
  }

  function closeReturnModal() {
    returnModalIssuanceId = null;
    returnModal.classList.add("hidden");
  }

  closeReturnModalBtn.addEventListener("click", closeReturnModal);
  cancelReturnModalBtn.addEventListener("click", closeReturnModal);

  returnModalForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearFeedback();
    var rec = findIssuance(returnModalIssuanceId);
    if (!rec) return;

    var held = rec.quantity - rec.returnedQuantity;
    var qty = Number(returnModalQty.value);
    if (!Number.isInteger(qty) || qty < 1 || qty > held) {
      showFeedback(
        "error",
        "Return quantity must be between 1 and " + held + "."
      );
      return;
    }

    var item = findItem(rec.itemId);
    item.issuedQuantity = Math.max(0, item.issuedQuantity - qty);
    rec.returnedQuantity += qty;
    rec.status = rec.returnedQuantity >= rec.quantity ? "Returned" : "Partially Returned";

    appState.history.unshift({
      id: nextId("LOG"),
      action: "Returned",
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      employeeName: rec.employeeName,
      designation: rec.designation,
      quantity: qty,
      remainingAvailable: item.totalQuantity - item.issuedQuantity,
      timestamp: new Date().toISOString(),
    });

    saveAppState();
    closeReturnModal();
    renderWorkspace();
    showFeedback(
      "success",
      "Returned " + qty + " × " + item.name + " from " + rec.employeeName + ". Added back to stock."
    );
  });

  // =========================================================================
  // Add / Update Stock Modal
  // =========================================================================
  function openStockModal(itemId) {
    var item = findItem(itemId);
    if (!item) return;
    stockModalItemId = itemId;
    setStockModalMode("add");
    stockModalTitle.textContent = "Update Stock — " + item.name;
    stockModalMeta.textContent =
      "Total: " +
      item.totalQuantity +
      " · Issued: " +
      item.issuedQuantity +
      " · Available: " +
      (item.totalQuantity - item.issuedQuantity);
    stockModal.classList.remove("hidden");
    stockModalAmount.focus();
  }

  function closeStockModal() {
    stockModalItemId = null;
    stockModal.classList.add("hidden");
  }

  function setStockModalMode(mode) {
    stockModalMode = mode;
    var item = findItem(stockModalItemId);
    if (mode === "add") {
      modeAddBtn.classList.add("is-active");
      modeSetBtn.classList.remove("is-active");
      stockModalLabel.textContent = "Units to Add";
      stockModalAmount.min = "1";
      stockModalAmount.value = "1";
      stockModalHint.textContent = "Adds newly received units to the fixed total.";
    } else {
      modeAddBtn.classList.remove("is-active");
      modeSetBtn.classList.add("is-active");
      stockModalLabel.textContent = "New Total Quantity";
      stockModalAmount.min = item ? String(item.issuedQuantity) : "0";
      stockModalAmount.value = item ? String(item.totalQuantity) : "0";
      stockModalHint.textContent =
        item && item.issuedQuantity > 0
          ? "Minimum allowed is " + item.issuedQuantity + " (currently issued units)."
          : "Sets the exact total quantity for this item.";
    }
  }

  modeAddBtn.addEventListener("click", function () {
    setStockModalMode("add");
  });
  modeSetBtn.addEventListener("click", function () {
    setStockModalMode("set");
  });
  closeStockModalBtn.addEventListener("click", closeStockModal);
  cancelStockModalBtn.addEventListener("click", closeStockModal);

  stockModalForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearFeedback();
    var item = findItem(stockModalItemId);
    if (!item) return;

    var amt = Number(stockModalAmount.value);
    if (!Number.isInteger(amt) || amt < 0) {
      showFeedback("error", "Please enter a valid whole number.");
      return;
    }

    var nextTotal = stockModalMode === "add" ? item.totalQuantity + amt : amt;
    if (stockModalMode === "add" && amt < 1) {
      showFeedback("error", "Please enter at least 1 unit to add.");
      return;
    }
    if (nextTotal < item.issuedQuantity) {
      showFeedback(
        "error",
        "Total cannot be less than currently issued units (" + item.issuedQuantity + ")."
      );
      return;
    }

    var delta = nextTotal - item.totalQuantity;
    item.totalQuantity = nextTotal;
    if (nextTotal > 0) {
      appState.quantitiesFixed = true;
    }

    if (delta !== 0) {
      appState.history.unshift({
        id: nextId("LOG"),
        action: "Stock Updated",
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        employeeName: authenticatedUser || "Administrator",
        designation: "PRMSC Asset Store",
        quantity: Math.abs(delta),
        remainingAvailable: item.totalQuantity - item.issuedQuantity,
        timestamp: new Date().toISOString(),
      });
    }

    saveAppState();
    closeStockModal();
    renderWorkspace();
    showFeedback("success", "Updated stock for " + item.name + " (Total: " + nextTotal + ").");
  });

  // =========================================================================
  // Side 2: History View (Filters, Search & CSV Export)
  // =========================================================================
  var segFilterButtons = document.querySelectorAll("#tab-history .seg-btn[data-filter]");
  segFilterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      historyFilter = btn.dataset.filter || "All";
      segFilterButtons.forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      renderHistoryTable();
    });
  });

  historySearchInput.addEventListener("input", function () {
    historySearch = historySearchInput.value.trim().toLowerCase();
    renderHistoryTable();
  });

  function getFilteredHistory() {
    return appState.history.filter(function (entry) {
      if (historyFilter !== "All" && entry.action !== historyFilter) {
        return false;
      }
      if (!historySearch) return true;
      return (
        entry.employeeName.toLowerCase().includes(historySearch) ||
        entry.designation.toLowerCase().includes(historySearch) ||
        entry.itemName.toLowerCase().includes(historySearch)
      );
    });
  }

  function renderHistoryTable() {
    var rows = getFilteredHistory();
    historyTableBody.innerHTML = "";

    if (rows.length === 0) {
      historyEmpty.classList.remove("hidden");
      historyTableWrap.classList.add("hidden");
      return;
    }

    historyEmpty.classList.add("hidden");
    historyTableWrap.classList.remove("hidden");

    rows.forEach(function (entry) {
      var tr = document.createElement("tr");

      var tdTime = document.createElement("td");
      tdTime.className = "mono-cell";
      tdTime.textContent = formatDateTime(entry.timestamp);

      var tdAct = document.createElement("td");
      var badge = document.createElement("span");
      badge.className =
        "activity-badge " +
        (entry.action === "Issued"
          ? "activity-issued"
          : entry.action === "Returned"
            ? "activity-returned"
            : "activity-stock");
      badge.textContent = entry.action;
      tdAct.appendChild(badge);

      var tdEmp = document.createElement("td");
      tdEmp.textContent = entry.employeeName;
      tdEmp.style.fontWeight = "600";

      var tdDesig = document.createElement("td");
      tdDesig.textContent = entry.designation;

      var tdItem = document.createElement("td");
      tdItem.textContent = entry.itemName;

      var tdQty = document.createElement("td");
      tdQty.className = "num-col";
      tdQty.textContent = String(entry.quantity);

      var tdAvail = document.createElement("td");
      tdAvail.className = "num-col";
      tdAvail.textContent = String(entry.remainingAvailable);

      tr.appendChild(tdTime);
      tr.appendChild(tdAct);
      tr.appendChild(tdEmp);
      tr.appendChild(tdDesig);
      tr.appendChild(tdItem);
      tr.appendChild(tdQty);
      tr.appendChild(tdAvail);

      historyTableBody.appendChild(tr);
    });
  }

  exportCsvBtn.addEventListener("click", function () {
    var rows = getFilteredHistory();
    if (rows.length === 0) return;

    var headers = [
      "Log ID",
      "Timestamp",
      "Activity",
      "Employee Name",
      "Designation",
      "Hardware Item",
      "Quantity",
      "Available After",
    ];
    function esc(v) {
      return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    }
    var lines = [headers.join(",")];
    rows.forEach(function (h) {
      lines.push(
        [
          h.id,
          h.timestamp,
          h.action,
          h.employeeName,
          h.designation,
          h.itemName,
          h.quantity,
          h.remainingAvailable,
        ]
          .map(esc)
          .join(",")
      );
    });

    var blob = new Blob([lines.join("\n")], {type: "text/csv;charset=utf-8;"});
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "prmsc-history-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // =========================================================================
  // Utilities
  // =========================================================================
  function findItem(id) {
    for (var i = 0; i < appState.items.length; i++) {
      if (appState.items[i].id === id) return appState.items[i];
    }
    return null;
  }

  function findIssuance(id) {
    for (var i = 0; i < appState.issuances.length; i++) {
      if (appState.issuances[i].id === id) return appState.issuances[i];
    }
    return null;
  }

  function formatShortDate(iso) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(iso) {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Initialize Front Page
  renderAuthMode();
})();
