function bindSettingsToggle() {
  const settingsBtn = document.getElementById("settingsBtn");
  const sidebar = document.getElementById("sidebarPanel");
  if (!settingsBtn || !sidebar) return;

  function setSidebarVisible(isVisible) {
    sidebar.hidden = !isVisible;
    settingsBtn.setAttribute("aria-expanded", String(isVisible));
  }

  function notifyLayoutChange() {
    // Sidebar toggle changes layout width, so trigger p5's resize handler.
    requestAnimationFrame(() => {
      if (typeof window.windowResized === "function") {
        window.windowResized();
        return;
      }
      window.dispatchEvent(new Event("resize"));
    });
  }

  settingsBtn.addEventListener("click", () => {
    setSidebarVisible(sidebar.hidden);
    notifyLayoutChange();
  });

  setSidebarVisible(!sidebar.hidden);
}

function bindMenu(menuId, buttonId, panelId) {
  const menu = document.getElementById(menuId);
  const triggerBtn = document.getElementById(buttonId);
  const menuPanel = document.getElementById(panelId);
  if (!menu || !triggerBtn || !menuPanel) return;
  const menuItems = Array.from(menuPanel.querySelectorAll('[role="menuitem"]'));
  if (menuItems.length === 0) return;

  function setOpenState(isOpen) {
    menuPanel.hidden = !isOpen;
    triggerBtn.setAttribute("aria-expanded", String(isOpen));
  }

  function openMenu(focusIndex = 0) {
    document.dispatchEvent(
      new CustomEvent("facet:menu-opened", { detail: { menuId } }),
    );
    setOpenState(true);
    menuItems[focusIndex]?.focus();
  }

  function closeMenu(restoreButtonFocus = false) {
    setOpenState(false);
    if (restoreButtonFocus) {
      triggerBtn.focus();
    }
  }

  function focusNextItem(currentIndex) {
    const nextIndex = (currentIndex + 1) % menuItems.length;
    menuItems[nextIndex]?.focus();
  }

  function focusPrevItem(currentIndex) {
    const prevIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
    menuItems[prevIndex]?.focus();
  }

  function emitChoose(choice) {
    const chooseEvent = new CustomEvent("choose", {
      detail: {
        choice,
      },
    });
    triggerBtn.dispatchEvent(chooseEvent);
  }

  triggerBtn.addEventListener("click", () => {
    const isOpen = triggerBtn.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
      return;
    }
    openMenu(0);
  });

  triggerBtn.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenu(0);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      closeMenu();
    }
  });

  menuPanel.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.tagName !== "BUTTON") return;
    emitChoose(target);
    closeMenu(true);
  });

  menuPanel.addEventListener("keydown", (event) => {
    const currentIndex = menuItems.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusNextItem(currentIndex);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusPrevItem(currentIndex);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
    }
  });

  menu.addEventListener("focusout", (event) => {
    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node)) {
      closeMenu();
      return;
    }
    if (!menu.contains(nextTarget)) {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (menu.contains(target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const isOpen = triggerBtn.getAttribute("aria-expanded") === "true";
    if (!isOpen) return;
    closeMenu(true);
  });

  document.addEventListener("facet:menu-opened", (event) => {
    const customEvent = event;
    if (!(customEvent instanceof CustomEvent)) return;
    if (customEvent.detail?.menuId === menuId) return;
    closeMenu();
  });

  setOpenState(false);
}

function bindListbox(menuId, buttonId, panelId) {
  const menu = document.getElementById(menuId);
  const triggerBtn = document.getElementById(buttonId);
  const listboxPanel = document.getElementById(panelId);
  if (!menu || !triggerBtn || !listboxPanel) return;
  const options = Array.from(listboxPanel.querySelectorAll('[role="option"]'));
  if (options.length === 0) return;

  function emitChoose(choice) {
    const chooseEvent = new CustomEvent("choose", {
      detail: {
        choice,
      },
    });
    triggerBtn.dispatchEvent(chooseEvent);
  }

  function getOptionIndex(option) {
    return options.indexOf(option);
  }

  function getSelectedOption() {
    const selected =
      options.find((option) => option.getAttribute("aria-selected") === "true") ||
      options[0];
    return selected;
  }

  function getSelectedIndex() {
    return getOptionIndex(getSelectedOption());
  }

  function setActiveOption(activeOption) {
    options.forEach((option) => {
      option.tabIndex = option === activeOption ? 0 : -1;
    });
  }

  function setSelectedOption(selectedOption) {
    options.forEach((option) => {
      option.setAttribute(
        "aria-selected",
        String(option === selectedOption),
      );
    });
    setActiveOption(selectedOption);
  }

  function setOpenState(isOpen) {
    listboxPanel.hidden = !isOpen;
    triggerBtn.setAttribute("aria-expanded", String(isOpen));
  }

  function openListbox({ moveFocus = false, focusIndex = getSelectedIndex() } = {}) {
    document.dispatchEvent(
      new CustomEvent("facet:menu-opened", { detail: { menuId } }),
    );
    setOpenState(true);
    const focusTarget = options[focusIndex] || options[0];
    setActiveOption(focusTarget);
    if (moveFocus) {
      focusTarget?.focus();
    }
  }

  function closeListbox(restoreButtonFocus = false) {
    setOpenState(false);
    if (restoreButtonFocus) {
      triggerBtn.focus();
    }
  }

  function focusNextOption(currentIndex) {
    const nextIndex = (currentIndex + 1) % options.length;
    const nextOption = options[nextIndex];
    setActiveOption(nextOption);
    nextOption?.focus();
  }

  function focusPrevOption(currentIndex) {
    const prevIndex = (currentIndex - 1 + options.length) % options.length;
    const prevOption = options[prevIndex];
    setActiveOption(prevOption);
    prevOption?.focus();
  }

  function commitSelection(option) {
    setSelectedOption(option);
    emitChoose(option);
    closeListbox(true);
  }

  triggerBtn.addEventListener("click", () => {
    const isOpen = triggerBtn.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeListbox();
      return;
    }
    openListbox({ moveFocus: true });
  });

  triggerBtn.addEventListener("keydown", (event) => {
    const isOpen = triggerBtn.getAttribute("aria-expanded") === "true";
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openListbox({ moveFocus: true });
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openListbox({ moveFocus: true });
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      openListbox({ moveFocus: true });
    }
    if (isOpen && event.key === "Home") {
      event.preventDefault();
      openListbox({ moveFocus: true, focusIndex: 0 });
    }
    if (isOpen && event.key === "End") {
      event.preventDefault();
      openListbox({ moveFocus: true, focusIndex: options.length - 1 });
    }
    if (isOpen && event.key === "Escape") {
      event.preventDefault();
      closeListbox(true);
    }
  });

  listboxPanel.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const option = target.closest('[role="option"]');
    if (!(option instanceof HTMLElement)) return;
    commitSelection(option);
  });

  listboxPanel.addEventListener("keydown", (event) => {
    const currentOption = document.activeElement;
    const currentIndex = options.indexOf(currentOption);
    if (currentIndex === -1) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusNextOption(currentIndex);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusPrevOption(currentIndex);
    }
    if (event.key === "Home") {
      event.preventDefault();
      const first = options[0];
      setActiveOption(first);
      first?.focus();
    }
    if (event.key === "End") {
      event.preventDefault();
      const last = options[options.length - 1];
      setActiveOption(last);
      last?.focus();
    }
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      const activeOption = options[currentIndex];
      if (!activeOption) return;
      commitSelection(activeOption);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeListbox(true);
    }
  });

  menu.addEventListener("focusout", (event) => {
    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node)) {
      closeListbox();
      return;
    }
    if (!menu.contains(nextTarget)) {
      closeListbox();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (menu.contains(target)) return;
    closeListbox();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const isOpen = triggerBtn.getAttribute("aria-expanded") === "true";
    if (!isOpen) return;
    closeListbox(true);
  });

  document.addEventListener("facet:menu-opened", (event) => {
    const customEvent = event;
    if (!(customEvent instanceof CustomEvent)) return;
    if (customEvent.detail?.menuId === menuId) return;
    closeListbox();
  });

  setSelectedOption(getSelectedOption());
  setOpenState(false);
}

function bindDownloadLiveRegion() {
  const liveRegion = document.getElementById("downloadLiveRegion");
  const exportBtn = document.getElementById("exportBtn");
  if (!exportBtn) return;
  if (!liveRegion) return;
  let announceTimeoutId = null;

  exportBtn.addEventListener("choose", (event) => {
    const customEvent = event;
    if (!(customEvent instanceof CustomEvent)) return;
    const detail = customEvent.detail;
    if (!detail || typeof detail !== "object") return;

    const choice = detail.choice;
    if (!(choice instanceof HTMLElement)) return;
    const choiceLabel = choice.textContent?.trim() ?? "";
    if (!choiceLabel) return;
    const normalizedChoice = choiceLabel.toLowerCase();
    const liveRegionMessageByChoice = {
      "hi-res": "Downloaded current composition as hi-res PNG file",
      vector: "Downloaded current composition as vector SVG file",
      web: "Downloaded current composition as web PNG file",
    };
    const message =
      liveRegionMessageByChoice[normalizedChoice] ??
      `Downloaded current composition as ${choiceLabel} file`;

    if (announceTimeoutId !== null) {
      window.clearTimeout(announceTimeoutId);
    }
    liveRegion.textContent = "";
    announceTimeoutId = window.setTimeout(() => {
      liveRegion.textContent = message;
      announceTimeoutId = null;
    }, 10);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  bindDownloadLiveRegion();
  bindListbox("ratioMenu", "ratioBtn", "ratioMenuPanel");
  bindMenu("exportMenu", "exportBtn", "exportMenuPanel");
  bindSettingsToggle();
});
