import React from "react";
import { useToastStore } from "../lib/toast";
import { Toast } from "./Toast";

export function GlobalToast() {
  const message = useToastStore((s) => s.message);
  const tick = useToastStore((s) => s.tick);
  const hide = useToastStore((s) => s.hide);
  // Keying on tick forces Toast to remount/re-animate when the same message
  // fires twice in a row (otherwise it would be a no-op).
  return <Toast key={tick} message={message} onHide={hide} />;
}
