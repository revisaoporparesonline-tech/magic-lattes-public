import { useMemo } from 'react';
import { mapLattesTipoToRemote } from '../../models/remotePublicacaoMapper';
import { RemoteConfigPanel } from '../batches/RemoteConfigPanel';
import { YearBatchCard } from '../batches/YearBatchCard';

export function Step5RemoteBatches({
  preprocessedLattes,
  analyzedItems,
  exportResult,
  remoteConfig,
  updateRemoteConfig,
  batchItems,
  toggleBatchItemSelection,
  toggleYearBatchSelection,
  updateBatchItemCustomPayload,
  getEffectivePayloadForItem,
  isSendingBatch,
  activeSendingYear,
  handleSendSingleItem,
  handleSendBatchList,
  handleCopyYearBatchJson,
  handleDownloadYearBatchJson,
  goToStep,
}) {
  const filteredBatchItems = useMemo(() => {
    return batchItems.filter((item) => {
      if (remoteConfig.filterOrigem !== 'all' && item.origem !== remoteConfig.filterOrigem) {
        return false;
      }
      const mappedTipo = remoteConfig.forceTipo || mapLattesTipoToRemote(item.tipo);
      if (remoteConfig.filterTipo !== 'all' && mappedTipo !== remoteConfig.filterTipo) {
        return false;
      }
      return true;
    });
  }, [batchItems, remoteConfig.filterOrigem, remoteConfig.filterTipo, remoteConfig.forceTipo]);

  const batchesByYear = useMemo(() => {
    const groups = new Map();
    filteredBatchItems.forEach((item) => {
      const yearKey = item.ano && String(item.ano).trim() ? String(item.ano).trim() : 'Sem Ano';
      if (!groups.has(yearKey)) {
        groups.set(yearKey, []);
      }
      groups.get(yearKey).push(item);
    });

    const sortedEntries = Array.from(groups.entries()).sort(([yearA], [yearB]) => {
      if (yearA === 'Sem Ano') return 1;
      if (yearB === 'Sem Ano') return -1;
      return Number(yearB) - Number(yearA);
    });

    return sortedEntries.map(([year, items]) => ({
      year,
      items,
    }));
  }, [filteredBatchItems]);

  const visibleBatchesByYear = useMemo(() => {
    if (remoteConfig.filterYear === 'all') return batchesByYear;
    return batchesByYear.filter((b) => b.year === remoteConfig.filterYear);
  }, [batchesByYear, remoteConfig.filterYear]);

  const totalVisibleSelected = useMemo(() => {
    return visibleBatchesByYear.reduce(
      (acc, b) => acc + b.items.filter((it) => it.selectedForBatch).length,
      0
    );
  }, [visibleBatchesByYear]);

  const allVisibleItems = useMemo(() => {
    return visibleBatchesByYear.flatMap((b) => b.items);
  }, [visibleBatchesByYear]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800 mb-1.5">
            POST • Bearer Auth • Lotes Agrupados por Ano
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Etapa 5: Cadastrar Publicações do Lattes em Lotes por Ano
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Envie as produções do currículo processado (XML + novos itens aprovados) agrupadas por ano para o endpoint de publicações.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSendBatchList(allVisibleItems, 'Todos os Anos Visíveis')}
            disabled={isSendingBatch || totalVisibleSelected === 0}
            className={`py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-sm transition-all ${
              isSendingBatch || totalVisibleSelected === 0
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
            }`}
          >
            {isSendingBatch
              ? `Enviando Lote (${activeSendingYear || '...'})...`
              : `🚀 Enviar Todos os Selecionados (${totalVisibleSelected})`}
          </button>
        </div>
      </div>

      <RemoteConfigPanel
        remoteConfig={remoteConfig}
        updateRemoteConfig={updateRemoteConfig}
        pesquisador={preprocessedLattes?.pesquisador}
      />

      {batchesByYear.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Filtrar Lotes por Ano ({batchesByYear.length}{' '}
              {batchesByYear.length === 1 ? 'ano encontrado' : 'anos encontrados'}):
            </span>
            <span className="text-xs text-slate-500">
              Total filtrado: <strong>{filteredBatchItems.length}</strong> produções
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateRemoteConfig('filterYear', 'all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                remoteConfig.filterYear === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos os Anos ({filteredBatchItems.length})
            </button>
            {batchesByYear.map((group) => {
              const isSelectedYear = remoteConfig.filterYear === group.year;
              const successInYear = group.items.filter(
                (i) => i.sendStatus === 'success'
              ).length;
              return (
                <button
                  key={group.year}
                  type="button"
                  onClick={() => updateRemoteConfig('filterYear', group.year)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelectedYear
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'
                  }`}
                >
                  <span>{group.year}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      isSelectedYear
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {group.items.length}
                  </span>
                  {successInYear > 0 && (
                    <span className="text-emerald-500 font-bold" title="Enviados com sucesso">
                      ✓{successInYear}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {visibleBatchesByYear.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm">
          Nenhuma publicação encontrada com os filtros selecionados.
        </div>
      ) : (
        <div className="space-y-6">
          {visibleBatchesByYear.map(({ year, items }) => (
            <YearBatchCard
              key={year}
              year={year}
              items={items}
              remoteConfig={remoteConfig}
              getEffectivePayloadForItem={getEffectivePayloadForItem}
              toggleBatchItemSelection={toggleBatchItemSelection}
              toggleYearBatchSelection={toggleYearBatchSelection}
              updateBatchItemCustomPayload={updateBatchItemCustomPayload}
              isSendingBatch={isSendingBatch}
              activeSendingYear={activeSendingYear}
              handleSendSingleItem={handleSendSingleItem}
              handleSendBatchList={handleSendBatchList}
              handleCopyYearBatchJson={handleCopyYearBatchJson}
              handleDownloadYearBatchJson={handleDownloadYearBatchJson}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => goToStep(exportResult ? 4 : analyzedItems.length > 0 ? 3 : 1)}
          className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-all cursor-pointer"
        >
          ← Voltar para Etapa Anterior
        </button>
        <span className="text-xs text-slate-500">
          Dica: Você pode abrir <code className="font-mono">{'{ } Ver/Editar JSON'}</code> em qualquer artigo para ajustar resumo, e-mail ou instituição antes de disparar o lote.
        </span>
      </div>
    </div>
  );
}

