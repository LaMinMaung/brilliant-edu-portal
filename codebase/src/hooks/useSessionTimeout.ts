import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import pb from "../lib/pocketbase";

const TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

export function useSessionTimeout() {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const expire = () => {
      pb.authStore.clear();
      localStorage.setItem("session_expired", "1");
      navigate("/login");
    };

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(expire, TIMEOUT_MS);
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [navigate]);
}
