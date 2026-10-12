export function Step2JsonInput({
  jsonText,
  setJsonText,
  handleAnalyzeJson,
  handleOpenBatchesStep,
  goToStep,
  isLoading,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Etapa 2: Informar JSON das Produções
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Cole o array JSON com as produções. Na próxima etapa faremos a checagem de conflitos e títulos similares lado a lado.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono">Array JSON</span>
      </div>

      <textarea
        rows={12}
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder='[ { "tipo": "TRABALHO-EM-EVENTOS", "dados_basicos": { "TITULO-DO-TRABALHO": "..." } } ]'
        className="w-full font-mono text-xs p-3.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => goToStep(1)}
          className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-all cursor-pointer"
        >
          ← Voltar para Etapa 1
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenBatchesStep}
            className="py-2.5 px-4 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-sm transition-all cursor-pointer"
          >
            Pular para Lotes por Ano (API) →
          </button>
          <button
            type="button"
            onClick={handleAnalyzeJson}
            disabled={isLoading}
            className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
          >
            {isLoading ? 'Analisando conflitos...' : 'Analisar e Verificar Conflitos (Etapa 3) →'}
          </button>
        </div>
      </div>
    </div>
  );
}

