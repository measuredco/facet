function bindSettingsToggle() {
  const settingsBtn = document.getElementById("settingsBtn");
  const sidebar = document.getElementById("sidebarPanel");
  if (!settingsBtn || !sidebar) return;

  const openClass = "is-sidebar-open";
  const closedClass = "is-sidebar-closed";

  function syncExpandedState() {
    const isVisible = window.getComputedStyle(sidebar).display !== "none";
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

  settingsBtn.setAttribute("aria-controls", "sidebarPanel");

  settingsBtn.addEventListener("click", () => {
    const isVisible = window.getComputedStyle(sidebar).display !== "none";
    if (isVisible) {
      document.body.classList.remove(openClass);
      document.body.classList.add(closedClass);
    } else {
      document.body.classList.remove(closedClass);
      document.body.classList.add(openClass);
    }
    syncExpandedState();
    notifyLayoutChange();
  });

  syncExpandedState();
  window.addEventListener("resize", syncExpandedState);
}

function bindExportMenu() {
  const exportMenu = document.getElementById("exportMenu");
  const downloadBtn = document.getElementById("downloadBtn");
  const exportMenuPanel = document.getElementById("exportMenuPanel");
  if (!exportMenu || !downloadBtn || !exportMenuPanel) return;
  const menuItems = Array.from(
    exportMenuPanel.querySelectorAll('[role="menuitem"]'),
  );
  if (menuItems.length === 0) return;

  function setOpenState(isOpen) {
    exportMenuPanel.hidden = !isOpen;
    downloadBtn.setAttribute("aria-expanded", String(isOpen));
  }

  function openMenu(focusIndex = 0) {
    setOpenState(true);
    menuItems[focusIndex]?.focus();
  }

  function closeMenu(restoreButtonFocus = false) {
    setOpenState(false);
    if (restoreButtonFocus) {
      downloadBtn.focus();
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
    downloadBtn.dispatchEvent(chooseEvent);
  }

  downloadBtn.addEventListener("click", () => {
    const isOpen = downloadBtn.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
      return;
    }
    openMenu(0);
  });

  downloadBtn.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenu(0);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      closeMenu();
    }
  });

  exportMenuPanel.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.tagName !== "BUTTON") return;
    emitChoose(target);
    closeMenu(true);
  });

  exportMenuPanel.addEventListener("keydown", (event) => {
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

  exportMenu.addEventListener("focusout", (event) => {
    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node)) {
      closeMenu();
      return;
    }
    if (!exportMenu.contains(nextTarget)) {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (exportMenu.contains(target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeMenu();
  });

  setOpenState(false);
}

function bindDownloadLiveRegion() {
  const liveRegion = document.getElementById("downloadLiveRegion");
  const downloadBtn = document.getElementById("downloadBtn");
  if (!downloadBtn) return;
  if (!liveRegion) return;
  let announceTimeoutId = null;

  downloadBtn.addEventListener("choose", (event) => {
    const customEvent = event;
    if (!(customEvent instanceof CustomEvent)) return;
    const detail = customEvent.detail;
    if (!detail || typeof detail !== "object") return;

    const choice = detail.choice;
    if (!(choice instanceof HTMLElement)) return;
    const choiceLabel = choice.textContent?.trim() ?? "";
    if (!choiceLabel) return;

    if (announceTimeoutId !== null) {
      window.clearTimeout(announceTimeoutId);
    }
    liveRegion.textContent = "";
    announceTimeoutId = window.setTimeout(() => {
      liveRegion.textContent = `Downloaded current composition as ${choiceLabel.toUpperCase()} file`;
      announceTimeoutId = null;
    }, 10);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  bindDownloadLiveRegion();
  bindExportMenu();
  bindSettingsToggle();
});
