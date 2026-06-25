import { requireUserManagementPermission } from "./_shared/require-user-management.js";

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { adminClient, currentUserId } = await requireUserManagementPermission(event);
    const body = JSON.parse(event.body || "{}");
    const userId = String(body.userId || "").trim();
    const password = String(body.password || "");

    if (!userId) return json(400, { error: "User id is required." });
    if (password.length < 8) return json(400, { error: "Password must be at least 8 characters." });
    if (userId === currentUserId && password.length < 10) return json(400, { error: "Use at least 10 characters when updating your own password from admin tools." });

    const { error } = await adminClient.auth.admin.updateUserById(userId, { password });
    if (error) return json(400, { error: error.message });

    return json(200, {
      ok: true,
      message: "Password updated successfully."
    });
  } catch (error) {
    return json(error.statusCode || 500, { error: error.message || "Unexpected error" });
  }
}
