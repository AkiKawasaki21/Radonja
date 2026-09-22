import "client-only";

const owners = new Set<symbol>();
let restore: (() => void) | undefined;

// Shared by portrait exploration and dialogs, so closing one never unlocks another.
export function acquireScrollLock() {
  const owner = Symbol("scroll-lock");
  if (!owners.size) {
    const root = document.documentElement;
    const body = document.body;
    const before = {
      overflow: root.style.overflow,
      overscroll: root.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      padding: body.style.paddingRight,
    };
    const scrollbar = window.innerWidth - root.clientWidth;
    if (scrollbar > 0) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbar}px`;
    root.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    root.dataset.scrollLocked = "true";

    const allowed = (target: EventTarget | null) => target instanceof Element && !!target.closest("[data-scroll-lock-allow]");
    const preventScroll = (event: Event) => {
      if (!allowed(event.target) && event.cancelable) event.preventDefault();
    };
    const preventKeys = (event: KeyboardEvent) => {
      if (allowed(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, button, [contenteditable=true]")) return;
      if ([" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key)) event.preventDefault();
    };
    document.addEventListener("touchmove", preventScroll, { passive: false });
    document.addEventListener("wheel", preventScroll, { passive: false });
    document.addEventListener("keydown", preventKeys);
    window.dispatchEvent(new Event("radonja:scroll-lock"));

    restore = () => {
      root.style.overflow = before.overflow;
      root.style.overscrollBehavior = before.overscroll;
      body.style.overflow = before.bodyOverflow;
      body.style.paddingRight = before.padding;
      delete root.dataset.scrollLocked;
      document.removeEventListener("touchmove", preventScroll);
      document.removeEventListener("wheel", preventScroll);
      document.removeEventListener("keydown", preventKeys);
      window.dispatchEvent(new Event("radonja:scroll-lock"));
    };
  }
  owners.add(owner);
  return () => {
    if (!owners.delete(owner)) return;
    if (!owners.size) {
      restore?.();
      restore = undefined;
    }
  };
}
