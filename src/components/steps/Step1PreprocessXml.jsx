export function Step1PreprocessXml({
  xmlFile,
  preprocessedLattes,
  handleSelectXmlFile,
  handleOpenBatchesStep,
  goToStep,
  onOpenTutorial,
  enviarRevisaoOnline,
  setEnviarRevisaoOnline,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Etapa 1: Pré-processamento do XML do Lattes
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Selecione o arquivo <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">.xml</code> exportado da Plataforma Lattes para indexar todas as produções já cadastradas.
          </p>
        </div>

        {onOpenTutorial && (
          <button
            type="button"
            onClick={() => onOpenTutorial('export')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>📖</span>
            <span>Como exportar do Lattes?</span>
          </button>
        )}
      </div>

      <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer bg-slate-50 border-slate-300 hover:bg-slate-100 transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className="w-8 h-8 mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-slate-700">
            {xmlFile ? (
              <span className="font-semibold text-blue-600">{xmlFile.name}</span>
            ) : (
              'Clique para selecionar seu arquivo .xml do Lattes'
            )}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Leitura local em ISO-8859-1 • Se baixou em .zip, extraia o .xml antes de carregar
          </p>
        </div>
        <input
          type="file"
          accept=".xml"
          className="hidden"
          onChange={(e) => handleSelectXmlFile(e.target.files?.[0] || null)}
        />
      </label>

      {preprocessedLattes && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {preprocessedLattes.pesquisador.nomeCompleto}
              </h3>
              <p className="text-xs text-slate-500">
                ID Lattes: {preprocessedLattes.pesquisador.numeroIdentificador || 'Não informado'}
                {preprocessedLattes.pesquisador.dataAtualizacao
                  ? ` • Atualizado em ${preprocessedLattes.pesquisador.dataAtualizacao}`
                  : ''}
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-900 text-xs font-bold">
              {preprocessedLattes.totalExistentes} produções já registradas
            </div>
          </div>

          {Object.keys(preprocessedLattes.contagemPorTipo).length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Produções indexadas por categoria no XML:
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(preprocessedLattes.contagemPorTipo).map(([tipo, qtd]) => (
                  <span
                    key={tipo}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700"
                  >
                    <span className="font-mono text-[11px] text-slate-500">{tipo}:</span>
                    <strong className="text-slate-900">{qtd}</strong>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Nenhuma produção anterior encontrada neste XML (apenas dados gerais).
            </p>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            {setEnviarRevisaoOnline && (
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={enviarRevisaoOnline}
                  onChange={(e) => setEnviarRevisaoOnline(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Enviar RevisãoOnline (habilitar Passo 5)</span>
              </label>
            )}

            <div className="flex flex-wrap items-center gap-3 ml-auto">
              {enviarRevisaoOnline && (
                <button
                  type="button"
                  onClick={handleOpenBatchesStep}
                  className="py-2.5 px-4 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-sm transition-all cursor-pointer"
                >
                  Ir direto para RevisãoOnline →
                </button>
              )}
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
              >
                Avançar para Etapa 2: Informar Produções →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
