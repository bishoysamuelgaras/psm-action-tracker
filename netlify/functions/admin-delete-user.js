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

    if (!userId) return json(400, { error: "User id is required." });
    if (userId === currentUserId) return json(400, { error: "You cannot delete your own account from here." });

    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) return json(400, { error: error.message });

    return json(200, {
      ok: true,
      message: "User deleted successfully."
    });
  } catch (error) {
    return json(error.statusCode || 500, { error: error.message || "Unexpected error" });
  }
}
