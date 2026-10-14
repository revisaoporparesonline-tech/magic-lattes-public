export function Step3ConflictReview({
  analyzedItems,
  toggleItemSelection,
  handlePrepareExport,
  handleOpenBatchesStep,
  goToStep,
  enviarRevisaoOnline = false,
}) {
  const conflictItems = analyzedItems.filter((it) => it.status === 'conflict');
  const newItems = analyzedItems.filter((it) => it.status === 'new');
  const exactItems = analyzedItems.filter((it) => it.status === 'exact');
  const selectedCount = analyzedItems.filter((it) => it.selectedForExport).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Etapa 3: Revisão de Conflitos Lado a Lado
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Verifique os possíveis conflitos detectados por similaridade de título/ano/DOI e escolha quais itens devem ir para o XML final e para os lotes da API.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            {newItems.length} Inéditos
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900">
            {conflictItems.length} Possíveis Conflitos
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700">
            {exactItems.length} Já Cadastrados (Idênticos)
          </span>
        </div>
      </div>

      {/* Seção A: Possíveis Conflitos Lado a Lado */}
      {conflictItems.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
              <span>⚠️ Possíveis Conflitos Detectados ({conflictItems.length})</span>
            </h3>
            <span className="text-xs text-slate-500">
              Desmarcados por padrão para evitar duplicatas no CNPq
            </span>
          </div>

          <div className="space-y-4">
            {conflictItems.map((item) => {
              const match = item.matchedLattesItem;
              const pct = Math.round(item.similarity * 100);
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    item.selectedForExport
                      ? 'border-blue-500 bg-blue-50/30'
                      : 'border-amber-300 bg-amber-50/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-amber-200/80">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-950">
                        {pct}% similar
                      </span>
                      <span className="text-xs font-medium text-amber-900">
                        {item.matchReason}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleItemSelection(item.id, false)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          !item.selectedForExport
                            ? 'bg-slate-800 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Ignorar (Já cadastrado)
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleItemSelection(item.id, true)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          item.selectedForExport
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Incluir mesmo assim
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3.5 border border-slate-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          Novo no JSON ({item.tipo})
                        </span>
                        {item.ano && (
                          <span className="text-xs font-semibold text-slate-600">
                            Ano: {item.ano}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {item.titulo}
                      </p>
                      {item.veiculo && (
                        <p className="text-xs text-slate-600 mt-1.5">
                          <strong>Veículo/Evento:</strong> {item.veiculo}
                        </p>
                      )}
                      {item.doi && (
                        <p className="text-xs text-slate-500 mt-1 font-mono">
                          DOI: {item.doi}
                        </p>
                      )}
                      {item.autores.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          <strong>Autores:</strong> {item.autores.join('; ')}
                        </p>
                      )}
                    </div>

                    <div className="bg-white rounded-lg p-3.5 border border-slate-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          No Lattes ({match?.tipo || 'Existente'} #{match?.sequencia})
                        </span>
                        {match?.ano && (
                          <span className="text-xs font-semibold text-slate-600">
                            Ano: {match.ano}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {match?.titulo || '—'}
                      </p>
                      {match?.veiculo && (
                        <p className="text-xs text-slate-600 mt-1.5">
                          <strong>Veículo/Evento:</strong> {match.veiculo}
                        </p>
                      )}
                      {match?.doi && (
                        <p className="text-xs text-slate-500 mt-1 font-mono">
                          DOI: {match.doi}
                        </p>
                      )}
                      {match?.autores?.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          <strong>Autores:</strong> {match.autores.join('; ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Seção B: Produções Inéditas (Sem Conflito) */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">
          ✓ Produções Inéditas Prontas para Exportar ({newItems.length})
        </h3>
        {newItems.length === 0 ? (
          <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
            Nenhuma produção totalmente inédita sem conflito foi encontrada. Verifique os itens acima ou abaixo.
          </p>
        ) : (
          <div className="space-y-2">
            {newItems.map((item) => (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  item.selectedForExport
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-slate-50 border-slate-200 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.selectedForExport}
                  onChange={() => toggleItemSelection(item.id)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-white border border-slate-200 text-slate-700">
                      {item.tipo}
                    </span>
                    {item.ano && (
                      <span className="text-xs font-semibold text-slate-600">
                        ({item.ano})
                      </span>
                    )}
                    {item.similarity > 0.25 && item.matchedLattesItem && (
                      <span className="text-[11px] text-slate-500">
                        • Maior proximidade no Lattes: {Math.round(item.similarity * 100)}% (&ldquo;{item.matchedLattesItem.titulo.slice(0, 55)}...&rdquo;)
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {item.titulo}
                  </p>
                  {item.veiculo && (
                    <p className="text-xs text-slate-600 mt-0.5">{item.veiculo}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Seção C: Já Cadastrados (Match Exato 100%) */}
      {exactItems.length > 0 && (
        <section className="space-y-3 pt-2">
          <details className="group rounded-xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-bold text-slate-700 flex items-center justify-between">
              <span>
                Já Cadastrados Ignorados Automaticamente ({exactItems.length})
              </span>
              <span className="text-xs font-normal text-slate-500 group-open:hidden">
                Clique para expandir e comparar lado a lado
              </span>
            </summary>
            <div className="mt-4 space-y-3">
              {exactItems.map((item) => {
                const match = item.matchedLattesItem;
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-600">
                        {item.matchReason}
                      </span>
                      <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.selectedForExport}
                          onChange={() => toggleItemSelection(item.id)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
                        />
                        <span>Forçar inclusão no XML</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                        <span className="font-bold text-slate-700 block mb-0.5">
                          No JSON ({item.tipo} • {item.ano || 'S/A'}):
                        </span>
                        {item.titulo}
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                        <span className="font-bold text-slate-700 block mb-0.5">
                          No Lattes ({match?.tipo} #{match?.sequencia} • {match?.ano || 'S/A'}):
                        </span>
                        {match?.titulo}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        </section>
      )}

      {/* Ações da Etapa 3 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => goToStep(2)}
          className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-all cursor-pointer"
        >
          ← Voltar para Etapa 2
        </button>
        <div className="flex flex-wrap items-center gap-3">
          {enviarRevisaoOnline && (
            <button
              type="button"
              onClick={handleOpenBatchesStep}
              className="py-2.5 px-4 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-sm transition-all cursor-pointer"
            >
              Ir para Etapa 5: RevisãoOnline →
            </button>
          )}
          <button
            type="button"
            onClick={handlePrepareExport}
            className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
          >
            Avançar para Etapa 4 ({selectedCount}{' '}
            {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}) →
          </button>
        </div>
      </div>
    </div>
  );
}

