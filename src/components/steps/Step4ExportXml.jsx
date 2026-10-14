export function Step4ExportXml({
  exportResult,
  analyzedItems,
  handleDownloadXml,
  handleOpenBatchesStep,
  goToStep,
  onOpenCoffee,
  onOpenTutorial,
  enviarRevisaoOnline = false,
  setEnviarRevisaoOnline,
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

        <div className="flex items-center gap-2">
          {onOpenTutorial && (
            <button
              type="button"
              onClick={() => onOpenTutorial('import')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all cursor-pointer"
            >
              <span>📖</span>
              <span>Como importar no Lattes?</span>
            </button>
          )}

          <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
            Pronto para o CNPq
          </span>
        </div>
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

      {/* Opção para Enviar RevisãoOnline */}
      {setEnviarRevisaoOnline && (
        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/70 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-950">
                <input
                  type="checkbox"
                  checked={enviarRevisaoOnline}
                  onChange={(e) => setEnviarRevisaoOnline(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span>Enviar RevisãoOnline</span>
              </label>
              <p className="text-xs text-indigo-800 mt-0.5">
                Marque esta opção caso deseje enviar estas publicações em lote para a API do RevisãoOnline (habilita o Passo 5).
              </p>
            </div>

            {enviarRevisaoOnline && (
              <button
                type="button"
                onClick={handleOpenBatchesStep}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Avançar para Etapa 5: RevisãoOnline →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Card de Apoio (Me pague um café) */}
      {onOpenCoffee && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">☕</span>
            <div>
              <p className="text-xs font-bold text-amber-950">
                O Magic Lattes economizou seu tempo com o CNPq?
              </p>
              <p className="text-xs text-amber-800">
                Se este projeto lhe foi útil, considere me pagar um cafézinho via PIX!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenCoffee}
            className="py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            ☕ Pagar um café com PIX
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => goToStep(3)}
          className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-all cursor-pointer"
        >
          ← Voltar para Revisão de Conflitos
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {onOpenTutorial && (
            <button
              type="button"
              onClick={() => onOpenTutorial('import')}
              className="py-3 px-5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm transition-all cursor-pointer"
            >
              📖 Tutorial: Como Importar no Lattes
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadXml}
            className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            ⬇ Baixar lattes_novos_itens.xml
          </button>

          {enviarRevisaoOnline && (
            <button
              type="button"
              onClick={handleOpenBatchesStep}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              Avançar para Etapa 5: RevisãoOnline →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
