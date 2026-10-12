export function Step4ExportXml({
  exportResult,
  analyzedItems,
  handleDownloadXml,
  handleOpenBatchesStep,
  goToStep,
}) {
  if (!exportResult) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Etapa 4: Baixar XML para o Lattes
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Arquivo <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">lattes_novos_itens.xml</code> gerado em <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">ISO-8859-1</code> contendo exclusivamente os <strong>{exportResult.totalInseridos}</strong> itens aprovados.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
          Pronto para Importar no CNPq
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Itens incluídos neste arquivo de exportação:
        </p>
        <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
          {analyzedItems
            .filter((it) => it.selectedForExport)
            .map((it) => (
              <li key={it.id}>
                <span className="font-mono font-semibold text-slate-900">[{it.tipo}]</span>{' '}
                {it.titulo} {it.ano ? `(${it.ano})` : ''}
              </li>
            ))}
        </ul>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
          Prévia do XML Gerado (lattes_novos_itens.xml):
        </label>
        <pre className="w-full max-h-60 overflow-auto font-mono text-[11px] p-3.5 rounded-xl bg-slate-900 text-slate-100">
          {exportResult.xmlString}
        </pre>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => goToStep(3)}
          className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-all cursor-pointer"
        >
          ← Voltar para Revisão de Conflitos
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadXml}
            className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            ⬇ Baixar lattes_novos_itens.xml
          </button>
          <button
            type="button"
            onClick={handleOpenBatchesStep}
            className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            Avançar para Etapa 5: Lotes por Ano (API) →
          </button>
        </div>
      </div>
    </div>
  );
}

