const STEPS = [
  { id: 1, title: '1. Pré-processar Lattes', subtitle: 'Ler currículo atual' },
  { id: 2, title: '2. Informar JSON', subtitle: 'Colar produções' },
  { id: 3, title: '3. Revisar Conflitos', subtitle: 'Comparar lado a lado' },
  { id: 4, title: '4. Baixar XML', subtitle: 'Exportar novos itens' },
  { id: 5, title: '5. Lotes por Ano (API)', subtitle: 'Cadastrar publicações' },
];

export function StepperNav({
  currentStep,
  goToStep,
  hasPreprocessedLattes,
  hasAnalyzedItems,
  hasExportResult,
}) {
  return (
    <nav aria-label="Etapas" className="mb-8">
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted =
            (step.id === 1 && hasPreprocessedLattes) ||
            (step.id === 2 && hasAnalyzedItems) ||
            (step.id === 3 && hasExportResult) ||
            (step.id === 4 && hasExportResult && currentStep === 5);
          const canNavigate =
            step.id === 1 ||
            (step.id === 2 && hasPreprocessedLattes) ||
            (step.id === 3 && hasAnalyzedItems) ||
            (step.id === 4 && hasExportResult) ||
            (step.id === 5 && hasPreprocessedLattes);

          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!canNavigate}
                onClick={() => canNavigate && goToStep(step.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : isCompleted
                      ? 'bg-white text-slate-800 border-blue-200 hover:border-blue-400 cursor-pointer'
                      : canNavigate
                        ? 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {step.title}
                  </span>
                  {isCompleted && !isActive && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mt-1 ${
                    isActive ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  {step.subtitle}
                </p>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

