const root = document.documentElement;
const themeButton = document.querySelector("#theme-toggle");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function isDark() {
  return root.dataset.theme
    ? root.dataset.theme === "dark"
    : systemTheme.matches;
}
function updateThemeButton() {
  const dark = isDark();
  themeButton.setAttribute("aria-label", `切换至${dark ? "浅" : "深"}色主题`);
  themeButton.setAttribute("aria-pressed", String(dark));
  themeButton
    .querySelector("path")
    .setAttribute(
      "d",
      dark
        ? "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        : "M20.5 13.3A8.6 8.6 0 0 1 10.7 3.5a8.6 8.6 0 1 0 9.8 9.8Z",
    );
  document.querySelector('meta[name="theme-color"]').content = dark
    ? "#1b191d"
    : "#f4f1ec";
}
themeButton.addEventListener("click", () => {
  root.dataset.theme = isDark() ? "light" : "dark";
  try {
    localStorage.setItem("fdtd-theme", root.dataset.theme);
  } catch {
    /* Themes still work without storage. */
  }
  updateThemeButton();
});
systemTheme.addEventListener("change", updateThemeButton);
updateThemeButton();

// Tabs use the WAI-ARIA automatic activation pattern with roving focus.
document.querySelectorAll('[role="tablist"]').forEach((list) => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  function activate(tab, focus = false) {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute("aria-controls")).hidden =
        !selected;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (event) => {
      const vertical = list.getAttribute("aria-orientation") === "vertical";
      const nextKey = vertical ? "ArrowDown" : "ArrowRight";
      const previousKey = vertical ? "ArrowUp" : "ArrowLeft";
      let target;
      if (event.key === nextKey) target = (index + 1) % tabs.length;
      if (event.key === previousKey)
        target = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") target = 0;
      if (event.key === "End") target = tabs.length - 1;
      if (target !== undefined) {
        event.preventDefault();
        activate(tabs[target], true);
      }
    });
  });
});

const toast = document.querySelector("#toast");
let toastTimer;
function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3300);
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  const original = button.innerHTML;
  button.addEventListener("click", async () => {
    const source = document.getElementById(button.dataset.copy);
    const text =
      source.tagName === "P"
        ? source.textContent.replace(/\s+/g, " ").trim()
        : source.textContent.trim();
    button.disabled = true;
    try {
      // A rejected or unavailable clipboard API is reported rather than claiming success.
      await navigator.clipboard.writeText(text);
      button.textContent = "已复制 ✓";
      notify("已复制，可以粘贴到你的本地 AI 工具中。");
      setTimeout(() => {
        button.innerHTML = original;
      }, 2000);
    } catch {
      notify("复制失败，请选中所需文字手动复制。");
    } finally {
      button.disabled = false;
    }
  });
});

const menuButton = document.querySelector("#menu-toggle");
const navigation = document.querySelector("#navigation");
function setMenu(open) {
  navigation.classList.toggle("is-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "收起导航" : "展开导航");
}
menuButton.addEventListener("click", () =>
  setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
);
navigation
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton.getAttribute("aria-expanded") === "true"
  ) {
    setMenu(false);
    menuButton.focus();
  }
});
document.addEventListener("click", (event) => {
  if (
    !event.target.closest(".nav") &&
    menuButton.getAttribute("aria-expanded") === "true"
  )
    setMenu(false);
});
window
  .matchMedia("(min-width: 961px)")
  .addEventListener("change", () => setMenu(false));

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navigation.querySelectorAll("a").forEach((link) => {
          if (link.hash === `#${entry.target.id}`)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-15% 0px -55% 0px" },
  );
  document
    .querySelectorAll("main section[id]")
    .forEach((section) => sectionObserver.observe(section));
}
