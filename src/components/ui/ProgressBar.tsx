interface ProgressBarProps {
  huidigeStap: number;
  totaalStappen: number;
  label?: string;
}

export function ProgressBar({ huidigeStap, totaalStappen, label }: ProgressBarProps) {
  const pct = Math.round((huidigeStap / totaalStappen) * 100);
  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label ?? `Stap ${huidigeStap} van ${totaalStappen}`}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1ABC9C] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
