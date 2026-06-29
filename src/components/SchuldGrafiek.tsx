interface Props {
  hypotheek: number;
  jaarsrente: number;
  looptijdJaar: number;
}

function euro(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function bereken(hypotheek: number, r: number, n: number): { ann: number[]; lin: number[] } {
  const maandRente = r / 12;
  const aantalMaanden = n * 12;
  const ann: number[] = [];
  const lin: number[] = [];

  for (let jaar = 0; jaar <= n; jaar++) {
    // Lineair: schuld daalt gelijkmatig
    lin.push(Math.max(0, hypotheek - (hypotheek / n) * jaar));

    // Annuïtair: restschuld na `jaar * 12` maanden
    if (maandRente === 0) {
      ann.push(Math.max(0, hypotheek - (hypotheek / aantalMaanden) * jaar * 12));
    } else {
      const factor = Math.pow(1 + maandRente, aantalMaanden);
      const factorT = Math.pow(1 + maandRente, jaar * 12);
      ann.push(Math.max(0, hypotheek * (factor - factorT) / (factor - 1)));
    }
  }

  return { ann, lin };
}

export function SchuldGrafiek({ hypotheek, jaarsrente, looptijdJaar }: Props) {
  const W = 320;
  const H = 160;
  const PAD = { top: 12, right: 12, bottom: 28, left: 48 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const { ann, lin } = bereken(hypotheek, jaarsrente, looptijdJaar);

  function toX(jaar: number) {
    return PAD.left + (jaar / looptijdJaar) * plotW;
  }
  function toY(schuld: number) {
    return PAD.top + plotH - (schuld / hypotheek) * plotH;
  }

  function lijn(punten: number[]) {
    return punten.map((s, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(s).toFixed(1)}`).join(' ');
  }

  // Y-as labels (0%, 50%, 100%)
  const yLabels = [0, 0.5, 1].map(f => ({ schuld: hypotheek * f, y: toY(hypotheek * f) }));

  // X-as labels (elke 10 jaar)
  const xLabels: number[] = [];
  for (let j = 0; j <= looptijdJaar; j += 10) xLabels.push(j);

  // Halvering punt (waar annuïtair 50% is)
  const halvIdx = ann.findIndex(s => s <= hypotheek * 0.5);
  const halvJaar = halvIdx > 0 ? halvIdx : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <p className="text-sm font-semibold text-[#0D1F3C] mb-1">Schuldverloop over {looptijdJaar} jaar</p>
      <p className="text-xs text-gray-400 mb-4">Hoe snel daalt jouw hypotheek bij annuïtair vs lineair</p>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
        {/* Grid lijnen */}
        {yLabels.map(({ y }, i) => (
          <line key={i} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
            stroke="#f3f4f6" strokeWidth="1" />
        ))}

        {/* Y-as labels */}
        {yLabels.map(({ schuld, y }) => (
          <text key={schuld} x={PAD.left - 4} y={y + 4} textAnchor="end"
            fontSize="9" fill="#9ca3af">
            {schuld === 0 ? '0' : schuld === hypotheek ? euro(hypotheek).replace('€ ', '€') : euro(schuld / 1000).replace('€ ', '') + 'k'}
          </text>
        ))}

        {/* X-as labels */}
        {xLabels.map(j => (
          <text key={j} x={toX(j)} y={H - 4} textAnchor="middle"
            fontSize="9" fill="#9ca3af">
            {j === 0 ? 'nu' : `${j}j`}
          </text>
        ))}

        {/* Lineair lijn */}
        <path d={lijn(lin)} fill="none" stroke="#3094C6" strokeWidth="2" strokeLinecap="round" />

        {/* Annuïtair lijn */}
        <path d={lijn(ann)} fill="none" stroke="#99248F" strokeWidth="2.5" strokeLinecap="round" />

        {/* Halvering markering */}
        {halvJaar && (
          <>
            <line x1={toX(halvJaar)} y1={toY(hypotheek * 0.5)} x2={toX(halvJaar)} y2={H - PAD.bottom}
              stroke="#99248F" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
            <text x={toX(halvJaar) + 3} y={toY(hypotheek * 0.5) - 4} fontSize="8" fill="#99248F" opacity="0.8">
              50% na {halvJaar}j
            </text>
          </>
        )}
      </svg>

      {/* Legenda */}
      <div className="flex gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-[#99248F] rounded" />
          <span className="text-xs text-gray-500">Annuïtair</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-[#3094C6] rounded" />
          <span className="text-xs text-gray-500">Lineair</span>
        </div>
      </div>
    </div>
  );
}
