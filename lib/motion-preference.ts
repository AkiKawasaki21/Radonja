"use client";

import { useSyncExternalStore } from "react";

export type MotionPreference = "system" | "full" | "reduced";
const storageKey = "radonja:motion";
const changeEvent = "radonja:motion-change";

function preference(): MotionPreference {
  const value = document.documentElement.dataset.motionPreference;
  return value === "full" || value === "reduced" ? value : "system";
}

function resolveMotion(value: MotionPreference) {
  return value === "reduced" || (value === "system" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function syncDocument() {
  document.documentElement.dataset.motion = resolveMotion(preference()) ? "reduced" : "full";
}

function snapshot() {
  const value = preference();
  return `${value}:${resolveMotion(value) ? "reduced" : "full"}`;
}

function subscribe(listener: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const update = () => {
    syncDocument();
    listener();
  };
  media.addEventListener("change", update);
  window.addEventListener(changeEvent, update);
  return () => {
    media.removeEventListener("change", update);
    window.removeEventListener(changeEvent, update);
  };
}

function setPreference(value: MotionPreference) {
  document.documentElement.dataset.motionPreference = value;
  try {
    if (value === "system") sessionStorage.removeItem(storageKey);
    else sessionStorage.setItem(storageKey, value);
  } catch { /* The preference still works when storage is unavailable. */ }
  syncDocument();
  window.dispatchEvent(new Event(changeEvent));
}

export function useMotionPreference() {
  const value = useSyncExternalStore(subscribe, snapshot, () => "system:full");
  const [selected, motion] = value.split(":");
  return { preference: selected as MotionPreference, reduced: motion === "reduced", setPreference };
}
