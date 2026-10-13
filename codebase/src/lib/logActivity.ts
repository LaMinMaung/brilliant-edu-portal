import pb from "./pocketbase";

/**
 * Log a system activity. Never throws — logging failures are silently swallowed
 * so they never interrupt the user-facing action.
 */
export const logActivity = async (action: string, details: string): Promise<void> => {
  const user = pb.authStore.record;
  if (!user) return;
  try {
    await pb.collection("activity_logs").create({
      user_id:   user.id,
      user_name: user.name || user.email || "Unknown",
      role:      user.role || "unknown",
      action,
      details,
      device:    navigator.userAgent,
    });
  } catch {
    // Intentionally ignored — logging must never break the app
  }
};
