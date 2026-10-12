import { useState } from 'react';

export function BatchPublicationItem({
  item,
  remoteConfig,
  getEffectivePayloadForItem,
  toggleBatchItemSelection,
  updateBatchItemCustomPayload,
  isSendingBatch,
  handleSendSingleItem,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  let effectivePayload = null;
  let payloadError = null;
  try {
    effectivePayload = getEffectivePayloadForItem(item);
  } catch (err) {
    payloadError = err.message;
  }

  const defaultJsonString = JSON.stringify(effectivePayload || {}, null, 2);
  const currentEditorText =
    item.customPayloadText !== null && item.customPayloadText !== undefined
      ? item.customPayloadText
      : defaultJsonString;

  const matchedOwner = effectivePayload?.autores?.some(
    (a) => typeof a.usuario_id === 'number'
  );

  return (
    <div
      className={`p-4 transition-colors ${
        item.selectedForBatch ? 'bg-white' : 'bg-slate-50/60 opacity-75'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={item.selectedForBatch}
            onChange={() => toggleBatchItemSelection(item.batchItemId)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  item.origem === 'novo_json'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {item.origem === 'novo_json' ? 'Novo (JSON)' : 'XML Lattes'}
              </span>

              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                tipo: &quot;{effectivePayload?.tipo || 'periodico'}&quot;
              </span>

              <span className="text-[11px] font-mono text-slate-500">
                ({item.tipo})
              </span>

              {matchedOwner && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✓ usuario_id: {remoteConfig.usuarioId} vinculado
                </span>
              )}

              {item.customPayloadText !== null && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                  JSON Editado
                </span>
              )}
            </div>

            <p className="text-sm font-semibold text-slate-900 leading-snug">
              {effectivePayload?.titulo || item.titulo}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
              {effectivePayload?.periodico && (
                <span>
                  <strong>Periódico/Local:</strong> {effectivePayload.periodico}
                </span>
              )}
              {effectivePayload?.volume && (
                <span>
                  <strong>Vol:</strong> {effectivePayload.volume}
                </span>
              )}
              {effectivePayload?.issn && (
                <span className="font-mono">
                  <strong>ISSN/ISBN:</strong> {effectivePayload.issn}
                </span>
              )}
              {effectivePayload?.doi && (
                <span className="font-mono text-slate-500">
                  <strong>DOI:</strong> {effectivePayload.doi}
                </span>
              )}
              <span>
                <strong>Autores:</strong> {effectivePayload?.autores?.length || 0}
              </span>
            </div>

            {item.sendStatus !== 'idle' && (
              <div
                className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                  item.sendStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : item.sendStatus === 'sending'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span>
                  {item.sendStatus === 'success'
                    ? '✓'
                    : item.sendStatus === 'sending'
                      ? '⏳'
                      : '⚠'}
                </span>
                <span>{item.sendMessage}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            {isExpanded ? 'Fechar JSON' : '{ } Ver/Editar JSON'}
          </button>
          <button
            type="button"
            disabled={isSendingBatch}
            onClick={() => handleSendSingleItem(item)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isSendingBatch
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer'
            }`}
          >
            Enviar 1
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 pl-7 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600">
              Body JSON para{' '}
              <code className="font-mono text-indigo-700">
                POST {remoteConfig.apiUrl}
              </code>
              :
            </span>
            {item.customPayloadText !== null && (
              <button
                type="button"
                onClick={() => updateBatchItemCustomPayload(item.batchItemId, null)}
                className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
              >
                Restaurar mapeamento automático
              </button>
            )}
          </div>

          {payloadError && (
            <p className="text-xs text-rose-600 font-semibold">
              Erro de sintaxe JSON: {payloadError}
            </p>
          )}

          <textarea
            rows={12}
            value={currentEditorText}
            onChange={(e) =>
              updateBatchItemCustomPayload(item.batchItemId, e.target.value)
            }
            className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}

