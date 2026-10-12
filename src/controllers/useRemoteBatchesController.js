import { useState } from 'react';
import {
  buildProcessedItemsForBatches,
  buildRemotePublicacaoPayload,
} from '../models/remotePublicacaoMapper';
import { postRemotePublicacao } from '../services/remotePublicacaoService';
import { copyJsonToClipboard, downloadJsonFile } from '../services/fileService';

const INITIAL_REMOTE_CONFIG = {
  apiUrl: 'http://localhost/api/remote/publicacao',
  bearerToken: '',
  usuarioId: 1,
  funcaoTitular: 'Autor Principal',
  projetosIdsText: '1',
  vincularTitular: true,
  forceTipo: '',
  filterOrigem: 'all', // 'all' | 'novo_json' | 'xml'
  filterTipo: 'all',
  filterYear: 'all',
};

export function useRemoteBatchesController({
  preprocessedLattes,
  setFeedback,
  clearFeedback,
}) {
  const [remoteConfig, setRemoteConfig] = useState(INITIAL_REMOTE_CONFIG);
  const [batchItems, setBatchItems] = useState([]);
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [activeSendingYear, setActiveSendingYear] = useState(null);

  const syncBatchItems = (lattesData, analyzedData) => {
    const rawConsolidated = buildProcessedItemsForBatches(lattesData, analyzedData);
    setBatchItems((prev) => {
      const prevMap = new Map(prev.map((p) => [p.batchItemId, p]));
      return rawConsolidated.map((item) => {
        const existing = prevMap.get(item.batchItemId);
        return {
          ...item,
          selectedForBatch: existing ? existing.selectedForBatch : true,
          customPayloadText: existing ? existing.customPayloadText : null,
          sendStatus: existing ? existing.sendStatus : 'idle',
          sendMessage: existing ? existing.sendMessage : '',
        };
      });
    });
  };

  const resetBatchItems = () => {
    setBatchItems([]);
  };

  const updateRemoteConfig = (field, value) => {
    setRemoteConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleBatchItemSelection = (batchItemId, forceValue) => {
    setBatchItems((prev) =>
      prev.map((item) =>
        item.batchItemId === batchItemId
          ? {
              ...item,
              selectedForBatch:
                typeof forceValue === 'boolean' ? forceValue : !item.selectedForBatch,
            }
          : item
      )
    );
  };

  const toggleYearBatchSelection = (batchItemIds, selected) => {
    const idSet = new Set(batchItemIds);
    setBatchItems((prev) =>
      prev.map((item) =>
        idSet.has(item.batchItemId) ? { ...item, selectedForBatch: selected } : item
      )
    );
  };

  const updateBatchItemCustomPayload = (batchItemId, customPayloadText) => {
    setBatchItems((prev) =>
      prev.map((item) =>
        item.batchItemId === batchItemId ? { ...item, customPayloadText } : item
      )
    );
  };

  const getEffectivePayloadForItem = (item) => {
    if (item.customPayloadText !== null && item.customPayloadText !== undefined) {
      return JSON.parse(item.customPayloadText);
    }
    return buildRemotePublicacaoPayload(item, preprocessedLattes?.pesquisador, remoteConfig);
  };

  const sendOneItemToApi = async (item) => {
    let payload;
    try {
      payload = getEffectivePayloadForItem(item);
    } catch (parseErr) {
      setBatchItems((prev) =>
        prev.map((it) =>
          it.batchItemId === item.batchItemId
            ? {
                ...it,
                sendStatus: 'error',
                sendMessage: `JSON inválido: ${parseErr.message}`,
              }
            : it
        )
      );
      return false;
    }

    setBatchItems((prev) =>
      prev.map((it) =>
        it.batchItemId === item.batchItemId
          ? { ...it, sendStatus: 'sending', sendMessage: 'Enviando...' }
          : it
      )
    );

    try {
      const { status, detail } = await postRemotePublicacao({
        apiUrl: remoteConfig.apiUrl,
        bearerToken: remoteConfig.bearerToken,
        payload,
      });

      setBatchItems((prev) =>
        prev.map((it) =>
          it.batchItemId === item.batchItemId
            ? {
                ...it,
                sendStatus: 'success',
                sendMessage: `Cadastrado (HTTP ${status})${detail ? ` • ${detail}` : ''}`,
              }
            : it
        )
      );
      return true;
    } catch (err) {
      setBatchItems((prev) =>
        prev.map((it) =>
          it.batchItemId === item.batchItemId
            ? {
                ...it,
                sendStatus: 'error',
                sendMessage: err.message || 'Falha de conexão com a API',
              }
            : it
        )
      );
      return false;
    }
  };

  const handleSendSingleItem = async (item) => {
    clearFeedback();
    setIsSendingBatch(true);
    try {
      const ok = await sendOneItemToApi(item);
      if (ok) {
        setFeedback('success', `Publicação "${item.titulo.slice(0, 60)}..." enviada com sucesso!`);
      } else {
        setFeedback(
          'error',
          `Falha ao enviar "${item.titulo.slice(0, 60)}...". Verifique o detalhe no card.`
        );
      }
    } finally {
      setIsSendingBatch(false);
    }
  };

  const handleSendBatchList = async (itemsToSend, labelLote = 'selecionado') => {
    clearFeedback();
    const selected = itemsToSend.filter((it) => it.selectedForBatch);
    if (selected.length === 0) {
      setFeedback('error', `Nenhum item selecionado no lote ${labelLote} para envio.`);
      return;
    }

    setIsSendingBatch(true);
    setActiveSendingYear(labelLote);
    let okCount = 0;
    let failCount = 0;

    try {
      for (const item of selected) {
        const ok = await sendOneItemToApi(item);
        if (ok) okCount += 1;
        else failCount += 1;
      }

      if (failCount === 0) {
        setFeedback(
          'success',
          `Lote ${labelLote} concluído: ${okCount} ${okCount === 1 ? 'publicação cadastrada' : 'publicações cadastradas'} com sucesso na API!`
        );
      } else {
        setFeedback(
          'error',
          `Lote ${labelLote} finalizado com ${okCount} sucesso(s) e ${failCount} falha(s). Confira o status individual nos itens.`
        );
      }
    } finally {
      setIsSendingBatch(false);
      setActiveSendingYear(null);
    }
  };

  const handleCopyYearBatchJson = async (yearKey, itemsOfYear) => {
    clearFeedback();
    const selected = itemsOfYear.filter((it) => it.selectedForBatch);
    if (selected.length === 0) {
      setFeedback('error', `Selecione ao menos 1 item no lote de ${yearKey} para copiar.`);
      return;
    }

    try {
      const payloads = selected.map((it) => getEffectivePayloadForItem(it));
      await copyJsonToClipboard(payloads);
      setFeedback(
        'success',
        `JSON do Lote ${yearKey} (${payloads.length} ${payloads.length === 1 ? 'publicação' : 'publicações'}) copiado para a área de transferência!`
      );
    } catch (err) {
      setFeedback('error', 'Erro ao copiar JSON do lote: ' + (err.message || ''));
    }
  };

  const handleDownloadYearBatchJson = (yearKey, itemsOfYear) => {
    clearFeedback();
    const selected = itemsOfYear.filter((it) => it.selectedForBatch);
    if (selected.length === 0) {
      setFeedback('error', `Selecione ao menos 1 item no lote de ${yearKey} para baixar.`);
      return;
    }

    try {
      const payloads = selected.map((it) => getEffectivePayloadForItem(it));
      downloadJsonFile(payloads, `lote_publicacoes_${yearKey}.json`);
      setFeedback(
        'success',
        `Arquivo lote_publicacoes_${yearKey}.json (${payloads.length} itens) baixado com sucesso!`
      );
    } catch (err) {
      setFeedback('error', 'Erro ao gerar JSON do lote: ' + (err.message || ''));
    }
  };

  return {
    remoteConfig,
    updateRemoteConfig,
    batchItems,
    syncBatchItems,
    resetBatchItems,
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
  };
}

