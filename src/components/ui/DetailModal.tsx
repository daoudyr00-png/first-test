"use client";

import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { formatDate } from "@/lib/format";

/** Read-only record view with consistent Delete / Close / Edit footer. */
export function DetailModal({
  title,
  record,
  onClose,
  onEdit,
  onDelete,
  extraActions,
  children,
  size = "lg",
}: {
  title: string;
  record: { createdAt: string; updatedAt: string };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  extraActions?: ReactNode;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  return (
    <Modal
      open
      onClose={onClose}
      size={size}
      title={title}
      description={`Added ${formatDate(record.createdAt)} · Updated ${formatDate(record.updatedAt)}`}
      footer={
        <>
          <Button
            variant="ghost"
            icon={<Trash2 size={15} />}
            onClick={onDelete}
            className="mr-auto text-[#8f1d1d] hover:bg-[#fbeaea] hover:text-[#8f1d1d]"
          >
            Delete
          </Button>
          {extraActions}
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" icon={<Pencil size={14} />} onClick={onEdit}>
            Edit
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export function RowActions({ onEdit, onDelete, label }: { onEdit: () => void; onDelete: () => void; label: string }) {
  return (
    <>
      <button type="button" onClick={onEdit} aria-label={`Edit ${label}`} title="Edit" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-ivory-deep hover:text-ink">
        <Pencil size={14} />
      </button>
      <button type="button" onClick={onDelete} aria-label={`Delete ${label}`} title="Delete" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-[#fbeaea] hover:text-[#8f1d1d]">
        <Trash2 size={14} />
      </button>
    </>
  );
}

export function UrlList({ urls }: { urls: string[] }) {
  if (!urls.length) return null;
  return (
    <ul className="space-y-1">
      {urls.map((u) => (
        <li key={u}>
          <a href={u} target="_blank" rel="noopener noreferrer" className="break-all text-[13.5px] text-wine underline-offset-2 hover:underline">
            {u}
          </a>
        </li>
      ))}
    </ul>
  );
}
