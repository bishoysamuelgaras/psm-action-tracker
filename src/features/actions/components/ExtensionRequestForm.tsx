import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SaveExtensionRequestInput } from "@/features/actions/api/actions.api";

type ExtensionRequestFormProps = {
  actionId: string;
  canSubmit: boolean;
  loading?: boolean;
  onSubmit: (values: SaveExtensionRequestInput) => Promise<void> | void;
};

export function ExtensionRequestForm({
  actionId,
  canSubmit,
  loading = false,
  onSubmit
}: ExtensionRequestFormProps) {
  const [requestedUntil, setRequestedUntil] = useState("");
  const [reason, setReason] = useState("");

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!canSubmit) return;
        await onSubmit({ actionId, requestedUntil, reason });
        setRequestedUntil("");
        setReason("");
      }}
    >
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Requested new due date</label>
        <Input
          required
          type="date"
          disabled={!canSubmit || loading}
          value={requestedUntil}
          onChange={(event) => setRequestedUntil(event.target.value)}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Reason</label>
        <Textarea
          required
          rows={4}
          disabled={!canSubmit || loading}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Explain why the extension is needed and what remains to be completed"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit || loading}>
          {loading ? "Submitting..." : "Submit extension request"}
        </Button>
      </div>
    </form>
  );
}
