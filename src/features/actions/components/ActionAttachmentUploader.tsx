import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { actionId: string; canUpload: boolean; loading?: boolean; onUpload: (values: { actionId: string; file: File; description?: string | null }) => Promise<void> };

export function ActionAttachmentUploader({ actionId, canUpload, loading = false, onUpload }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [errorText, setErrorText] = useState("");

  const fileLabel = useMemo(() => { if (!selectedFile) return "No file selected."; const sizeMb = selectedFile.size / (1024 * 1024); return `${selectedFile.name} • ${sizeMb.toFixed(sizeMb >= 10 ? 0 : 2)} MB`; }, [selectedFile]);

  async function handleSubmit() {
    if (!selectedFile) { setErrorText("Please choose a file first."); return; }
    setErrorText("");
    try {
      await onUpload({ actionId, file: selectedFile, description: description.trim() || null });
      setSelectedFile(null);
      setDescription("");
      const fileInput = document.getElementById(`attachment-file-${actionId}`) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Attachment upload failed.");
    }
  }

  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-semibold text-slate-900">Upload attachment</div><div className="mt-4 grid gap-3"><input id={`attachment-file-${actionId}`} type="file" disabled={!canUpload || loading} className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" onChange={(event) => { setSelectedFile(event.target.files?.[0] ?? null); }} /><Input value={description} disabled={!canUpload || loading} onChange={(event) => setDescription(event.target.value)} placeholder="Optional description" /><div className="text-xs text-slate-500">{fileLabel}</div>{errorText ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorText}</div> : null}<div className="flex flex-wrap gap-2"><Button onClick={() => void handleSubmit()} disabled={!canUpload || loading || !selectedFile}>{loading ? "Uploading..." : "Upload"}</Button></div></div></div>;
}
