"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "gl_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = window.localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      setVisible(true);
    }
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 rounded-lg border border-border bg-card p-4 shadow-xl md:inset-x-auto md:right-6 md:w-[420px]">
      <p className="text-sm text-muted">
        We use minimal cookies for locale preference and analytics baseline. By continuing, you agree to this usage.
      </p>
      <button
        className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-zinc-950"
        onClick={() => {
          window.localStorage.setItem(STORAGE_KEY, "accepted");
          setVisible(false);
        }}
      >
        Accept
      </button>
    </div>
  );
}
