import React from 'react';

export function LattesView({
  xmlFile,
  setXmlFile,
  jsonText,
  setJsonText,
  statusMessage,
  statusType,
  isLoading,
  handleMergeAndDownload,
}) {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-3">
            Compatível com LMPLCurriculo.DTD
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Lattes Sync & Merger
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Exporte um XML enxuto contendo apenas as produções ainda não registradas no seu currículo Lattes, pronto para importação no CNPq.
          </p>
        </header>

        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          {/* Passo 1: Upload XML */}
          <section>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              1. Selecione o XML atual exportado da Plataforma Lattes
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-slate-50 border-slate-300 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xs text-slate-600">
                    {xmlFile ? (
                      <span className="font-semibold text-blue-600">{xmlFile.name}</span>
                    ) : (
                      'Clique para selecionar seu arquivo .xml'
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Padrão ISO-8859-1 do CNPq</p>
                </div>
                <input
                  type="file"
                  accept=".xml"
                  className="hidden"
                  onChange={(e) => setXmlFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </section>

          {/* Passo 2: JSON Input */}
          <section>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-800">
                2. JSON das Produções Mapeadas
              </label>
              <span className="text-xs text-slate-400">Formato de array de objetos</span>
            </div>
            <textarea
              rows={10}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='[ { "tipo": "TRABALHO-EM-EVENTOS", ... }, { "tipo": "DEMAIS-TRABALHOS", ... } ]'
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </section>

          {/* Botão de Ação */}
          <button
            onClick={handleMergeAndDownload}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-sm transition-all ${
              isLoading
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'
            }`}
          >
            {isLoading ? 'Filtrando e gerando XML...' : 'Exportar XML Apenas com Novos Itens'}
          </button>

          {/* Feedback de Status */}
          {statusType !== 'idle' && (
            <div
              className={`p-4 rounded-xl text-sm font-medium ${
                statusType === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusType === 'success' ? (
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span>{statusMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-slate-400">
          Processamento executado 100% no cliente. Nenhum arquivo trafega pela nuvem.
        </footer>
      </div>
    </main>
  );
}