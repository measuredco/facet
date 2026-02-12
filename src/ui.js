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

window.addEventListener("DOMContentLoaded", () => {
  bindSettingsToggle();
});
