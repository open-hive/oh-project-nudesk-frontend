export function WaveDecoration({ className }: { className?: string }) {
  return (
    <div className={`flex justify-center mb-3 ${className || ""}`}>
      <svg
        width="28"
        height="12"
        viewBox="0 0 28 12"
        fill="none"
        className="text-orange-400"
      >
        <path
          d="M1 6c3-4 5-4 7 0s4 4 7 0 4-4 7 0 4 4 5 0"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
