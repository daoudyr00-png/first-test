"use client";

import { useRef, useState } from "react";
import { Download, HardDrive, Trash2, Upload } from "lucide-react";
import { useDatabase } from "@/hooks/useDatabase";
import { PageHeader, LoadingBlock } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { adapter } from "@/lib/data";
import { download, stamp, toJson } from "@/lib/export";
import { parseBackup, replaceDatabase } from "@/lib/store";
import { COLLECTIONS, emptyDatabase, type Database } from "@/lib/types";

const LABELS: Record<keyof Database, string> = {
  niches: "Niches",
  problems: "Problems",
  competitors: "Competitors",
  keywords: "Keywords",
  opportunities: "Scored opportunities",
  ideas: "Product ideas",
};

export default function DataPage() {
  const { db, ready } = useDatabase();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ db: Database; name: string } | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!ready) return <LoadingBlock />;

  const total = COLLECTIONS.reduce((s, c) => s + db[c].length, 0);
  const bytes = new Blob([JSON.stringify(db)]).size;

  const onFile = async (file: File) => {
    try {
      const parsed = parseBackup(await file.text());
      setPending({ db: parsed, name: file.name });
      setMessage(null);
    } catch (e) {
      setMessage({ tone: "error", text: `Couldn't import ${file.name}: ${e instanceof Error ? e.message : "invalid file"}` });
    }
  };

  return (
    <>
      <PageHeader eyebrow="Workspace" title="Data & Backup" description="Your research lives in this browser's local storage. Back it up regularly, or move it to another device." />

      {message && (
        <div className={`mb-5 rounded-lg border px-4 py-3 text-[13px] ${message.tone === "ok" ? "border-[#d3e0d0] bg-sage-soft text-sage" : "border-[#f1cccc] bg-[#fbeaea] text-[#8f1d1d]"}`} role="status">
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader title="What's stored" description={`Storage: ${adapter.name} · approx. ${(bytes / 1024).toFixed(1)} KB`} />
          <ul className="divide-y divide-line/70">
            {COLLECTIONS.map((c) => (
              <li key={c} className="flex items-center justify-between px-5 py-2.5 text-[13.5px]">
                <span className="text-ink-soft">{LABELS[c]}</span>
                <span className="num font-medium text-ink">{db[c].length}</span>
              </li>
            ))}
            <li className="flex items-center justify-between bg-ivory/50 px-5 py-2.5 text-[13.5px]">
              <span className="font-medium text-ink">Total records</span>
              <span className="num font-display text-lg text-ink">{total}</span>
            </li>
          </ul>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wine-soft text-wine"><Download size={18} /></span>
              <div className="flex-1">
                <h2 className="text-[15px] font-semibold text-ink">Export full backup</h2>
                <p className="mt-1 text-[13px] text-muted">Downloads every record as a single JSON file you can re-import later. Individual modules also offer CSV export.</p>
                <Button
                  className="mt-3"
                  variant="primary"
                  icon={<Download size={15} />}
                  disabled={total === 0}
                  onClick={() => download(`opportunity-finder-backup-${stamp()}.json`, toJson({ app: "product-opportunity-finder", version: 1, exportedAt: new Date().toISOString(), data: db }), "application/json")}
                >
                  Download backup
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ivory-deep text-ink-soft"><Upload size={18} /></span>
              <div className="flex-1">
                <h2 className="text-[15px] font-semibold text-ink">Restore from backup</h2>
                <p className="mt-1 text-[13px] text-muted">Replaces all current data with the contents of a backup file. You&apos;ll be asked to confirm first.</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  aria-label="Backup file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                    e.target.value = "";
                  }}
                />
                <Button className="mt-3" icon={<Upload size={15} />} onClick={() => fileRef.current?.click()}>Choose backup file…</Button>
              </div>
            </div>
          </Card>

          <Card className="border-[#f1cccc] p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbeaea] text-[#8f1d1d]"><Trash2 size={18} /></span>
              <div className="flex-1">
                <h2 className="text-[15px] font-semibold text-ink">Clear all data</h2>
                <p className="mt-1 text-[13px] text-muted">Permanently deletes every record from this browser. Export a backup first if you might need it.</p>
                <Button className="mt-3" variant="danger" icon={<Trash2 size={15} />} disabled={total === 0} onClick={() => setConfirmClear(true)}>Clear all data</Button>
              </div>
            </div>
          </Card>

          <div className="flex items-start gap-3 rounded-lg border border-line bg-ivory/60 px-4 py-3 text-xs leading-relaxed text-muted">
            <HardDrive size={14} className="mt-0.5 shrink-0 text-faint" />
            <span>Local storage is tied to this browser and device. Clearing site data in your browser settings will erase it. Cloud sync is planned via a database adapter.</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pending}
        title="Replace all data?"
        confirmLabel="Replace data"
        message={
          pending && (
            <>
              <p>
                <strong className="text-ink">{pending.name}</strong> contains {COLLECTIONS.reduce((s, c) => s + pending.db[c].length, 0)} records. Your current{" "}
                {total} records will be replaced.
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {COLLECTIONS.map((c) => <li key={c}>{LABELS[c]}: <span className="num font-medium text-ink">{pending.db[c].length}</span></li>)}
              </ul>
            </>
          )
        }
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          replaceDatabase(pending.db);
          setMessage({ tone: "ok", text: `Restored ${COLLECTIONS.reduce((s, c) => s + pending.db[c].length, 0)} records from ${pending.name}.` });
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        title="Clear all data?"
        confirmLabel="Delete everything"
        message={`All ${total} records will be permanently deleted from this browser. This cannot be undone.`}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          replaceDatabase(emptyDatabase());
          setMessage({ tone: "ok", text: "All data cleared." });
        }}
      />
    </>
  );
}
