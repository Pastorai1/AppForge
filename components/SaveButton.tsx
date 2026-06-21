"use client";

export function SaveButton({
  saved,
  busy,
  onClick,
}: {
  saved: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={busy}
      aria-pressed={saved}
      className={`chip shrink-0 ${
        saved ? "chip-active" : "hover:border-primary"
      }`}
      title={saved ? "Saved — click to remove" : "Save for later"}
    >
      {saved ? "✓ Saved" : "☆ Save"}
    </button>
  );
}
