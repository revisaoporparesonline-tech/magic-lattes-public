export function AppHeader({ onOpenCoffee, isCoffeeOpen, onOpenTutorial }) {
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          Compatível com LMPLCurriculo.DTD • ISO-8859-1 • Integração CNPq Lattes
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenTutorial && (
            <button
              type="button"
              onClick={() => onOpenTutorial('export')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs transition-all cursor-pointer"
              title="Passo a passo de como exportar e importar no Lattes"
            >
              <span>📖</span>
              <span>Tutorial Lattes</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCoffee}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
              isCoffeeOpen
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200 hover:border-amber-300'
            }`}
            title="Apoie o desenvolvedor com um café via PIX"
          >
            <span>☕</span>
            <span>Me pague um café</span>
          </button>
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Lattes Sync &amp; Merger
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Pré-processe seu currículo Lattes, compare possíveis duplicatas, exporte produções inéditas e envie lotes para o Lattes ou RevisãoOnline.
        </p>
      </div>
    </header>
  );
}
