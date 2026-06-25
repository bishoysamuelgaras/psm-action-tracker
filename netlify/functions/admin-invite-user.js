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
    const { adminClient } = await requireUserManagementPermission(event);
    const body = JSON.parse(event.body || "{}");
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.fullName || "").trim();
    const roleCode = String(body.roleCode || "viewer").trim();
    const departmentId = body.departmentId ? String(body.departmentId) : null;
    const employeeCode = body.employeeCode ? String(body.employeeCode).trim() : null;
    const jobTitle = body.jobTitle ? String(body.jobTitle).trim() : null;

    if (!email || !fullName) return json(400, { error: "Email and full name are required." });

    const redirectTo = process.env.APP_URL || process.env.URL || undefined;
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo
    });

    if (error) return json(400, { error: error.message });

    const userId = data.user?.id;
    if (!userId) return json(500, { error: "Invite succeeded but no user id was returned." });

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        full_name: fullName,
        role_code: roleCode,
        department_id: departmentId,
        employee_code: employeeCode,
        job_title: jobTitle,
        is_active: true
      })
      .eq("id", userId);

    if (updateError) return json(400, { error: updateError.message });

    return json(200, { ok: true, message: `Invite sent to ${email}`, userId });
  } catch (error) {
    return json(error.statusCode || 500, { error: error.message || "Unexpected error" });
  }
}
