import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ActionLookups, SaveActionUpdateInput } from "@/features/actions/api/actions.api";

type ActionUpdateFormProps = {
  actionId: string;
  statuses: ActionLookups["statuses"];
  canSubmit: boolean;
  loading?: boolean;
  onSubmit: (values: SaveActionUpdateInput) => Promise<void> | void;
};

export function ActionUpdateForm({
  actionId,
  statuses,
  canSubmit,
  loading = false,
  onSubmit
}: ActionUpdateFormProps) {
  const [progressNote, setProgressNote] = useState("");
  const [progressPercent, setProgressPercent] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");

  const disabled = useMemo(() => !canSubmit || loading, [canSubmit, loading]);

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!canSubmit) return;
        await onSubmit({
          actionId,
          progressNote,
          progressPercent: progressPercent ? Number(progressPercent) : null,
          statusCode: statusCode || null,
          nextFollowUpDate: nextFollowUpDate || null
        });
        setProgressNote("");
        setProgressPercent("");
        setStatusCode("");
        setNextFollowUpDate("");
      }}
    >
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Progress note</label>
        <Textarea
          required
          disabled={disabled}
          rows={4}
          value={progressNote}
          onChange={(event) => setProgressNote(event.target.value)}
          placeholder="Describe what has been completed, pending blockers, and next step"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Progress %</label>
          <Input
            type="number"
            min={0}
            max={100}
            disabled={disabled}
            value={progressPercent}
            onChange={(event) => setProgressPercent(event.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Status update</label>
          <Select
            disabled={disabled}
            value={statusCode}
            onChange={(event) => setStatusCode(event.target.value)}
          >
            <option value="">No status change</option>
            {statuses.map((status) => (
              <option key={status.code} value={status.code}>
                {status.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Next follow-up</label>
          <Input
            type="date"
            disabled={disabled}
            value={nextFollowUpDate}
            onChange={(event) => setNextFollowUpDate(event.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={disabled}>
          {loading ? "Saving..." : "Add update"}
        </Button>
      </div>
    </form>
  );
}
