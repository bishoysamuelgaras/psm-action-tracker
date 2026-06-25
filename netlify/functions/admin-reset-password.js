import { requireUserManagementPermission } from "./_shared/require-user-management.js";

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

function generateTemporaryPassword(length = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*";
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { adminClient } = await requireUserManagementPermission(event);
    const body = JSON.parse(event.body || "{}");
    const userId = String(body.userId || "").trim();
    if (!userId) return json(400, { error: "User id is required." });

    const temporaryPassword = generateTemporaryPassword();
    const { error } = await adminClient.auth.admin.updateUserById(userId, { password: temporaryPassword });
    if (error) return json(400, { error: error.message });

    return json(200, {
      ok: true,
      temporaryPassword,
      message: "Temporary password generated successfully."
    });
  } catch (error) {
    return json(error.statusCode || 500, { error: error.message || "Unexpected error" });
  }
}
