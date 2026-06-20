export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 font-semibold ${className}`}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-white">
        {/* Anvil-ish mark */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 9h11a4 4 0 0 0 4-4M9 9v4a5 5 0 0 0 5 5h1m-9-2 -2 4h10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-white">AppForge</span>
    </span>
  );
}
