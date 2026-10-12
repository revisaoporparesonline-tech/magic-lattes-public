import { BatchPublicationItem } from './BatchPublicationItem';

export function YearBatchCard({
  year,
  items,
  remoteConfig,
  getEffectivePayloadForItem,
  toggleBatchItemSelection,
  toggleYearBatchSelection,
  updateBatchItemCustomPayload,
  isSendingBatch,
  activeSendingYear,
  handleSendSingleItem,
  handleSendBatchList,
  handleCopyYearBatchJson,
  handleDownloadYearBatchJson,
}) {
  const selectedInYear = items.filter((it) => it.selectedForBatch);
  const allSelectedInYear =
    items.length > 0 && selectedInYear.length === items.length;
  const successCount = items.filter((it) => it.sendStatus === 'success').length;
  const errorCount = items.filter((it) => it.sendStatus === 'error').length;
  const yearItemIds = items.map((it) => it.batchItemId);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="bg-slate-100/80 border-b border-slate-200 px-4 py-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelectedInYear}
              onChange={(e) => toggleYearBatchSelection(yearItemIds, e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-base font-extrabold text-slate-900">
              Lote {year}
            </span>
          </label>

          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700">
            {selectedInYear.length} de {items.length} selecionados
          </span>

          {successCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              ✓ {successCount} enviado(s)
            </span>
          )}
          {errorCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
              ⚠ {errorCount} com erro
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopyYearBatchJson(year, items)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            📋 Copiar JSON ({selectedInYear.length})
          </button>
          <button
            type="button"
            onClick={() => handleDownloadYearBatchJson(year, items)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            ⬇ Baixar .json
          </button>
          <button
            type="button"
            disabled={isSendingBatch || selectedInYear.length === 0}
            onClick={() => handleSendBatchList(items, `Ano ${year}`)}
            className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold shadow-xs transition-all ${
              isSendingBatch || selectedInYear.length === 0
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            }`}
          >
            {isSendingBatch && activeSendingYear === `Ano ${year}`
              ? 'Enviando lote...'
              : `🚀 Enviar Lote ${year} (${selectedInYear.length})`}
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <BatchPublicationItem
            key={item.batchItemId}
            item={item}
            remoteConfig={remoteConfig}
            getEffectivePayloadForItem={getEffectivePayloadForItem}
            toggleBatchItemSelection={toggleBatchItemSelection}
            updateBatchItemCustomPayload={updateBatchItemCustomPayload}
            isSendingBatch={isSendingBatch}
            handleSendSingleItem={handleSendSingleItem}
          />
        ))}
      </div>
    </section>
  );
}

