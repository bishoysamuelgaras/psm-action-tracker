import type { AppRole } from "@/types/auth";

export const APP_NAME = "ANRPC Action Tracker";

export const APP_TAGLINE =
  "PSM recommendations, investigations, audits, and committee follow-up in one place.";

export const DEFAULT_ACTION_STATUSES = [
  "draft",
  "open",
  "in_progress",
  "pending_verification",
  "closed",
  "verified",
  "on_hold",
  "cancelled"
] as const;

export const DEFAULT_PRIORITY_LEVELS = ["low", "medium", "high", "critical"] as const;

export const DEFAULT_SOURCE_TYPES = [
  "incident_investigation",
  "audit",
  "committee",
  "inspection",
  "management_review",
  "psm_review"
] as const;

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  psm_manager: "PSM Manager",
  action_owner: "Action Owner",
  viewer: "Viewer"
};

export const ROLE_BADGE_TONES: Record<AppRole, "red" | "green" | "blue" | "slate"> = {
  admin: "red",
  psm_manager: "green",
  action_owner: "blue",
  viewer: "slate"
};
