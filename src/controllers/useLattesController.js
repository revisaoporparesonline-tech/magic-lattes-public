import { useState } from 'react';
import { decodeIso88591Buffer } from '../utils/xmlUtils';
import { preprocessLattesXml } from '../models/lattesParser';
import { analyzeProducoesConflicts } from '../models/lattesConflictAnalyzer';
import { buildLattesExportFromSelected } from '../models/lattesXmlBuilder';
import { downloadBlob } from '../services/fileService';
import { useRemoteBatchesController } from './useRemoteBatchesController';

export function useLattesController() {
  const [currentStep, setCurrentStep] = useState(1); // 1 | 2 | 3 | 4 | 5
  const [xmlFile, setXmlFile] = useState(null);
  const [preprocessedLattes, setPreprocessedLattes] = useState(null);
  const [jsonText, setJsonText] = useState('');
  const [analyzedItems, setAnalyzedItems] = useState([]);
  const [exportResult, setExportResult] = useState(null);

  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('idle'); // 'idle' | 'success' | 'error'
  const [isLoading, setIsLoading] = useState(false);

  const setFeedback = (type, message) => {
    setStatusType(type);
    setStatusMessage(message);
  };

  const clearFeedback = () => {
    setStatusType('idle');
    setStatusMessage('');
  };

  const remoteBatches = useRemoteBatchesController({
    preprocessedLattes,
    setFeedback,
    clearFeedback,
  });

  // Etapa 1: Selecionar e pré-processar o XML do Lattes
  const handleSelectXmlFile = async (file) => {
    clearFeedback();
    if (!file) {
      setXmlFile(null);
      setPreprocessedLattes(null);
      remoteBatches.resetBatchItems();
      return;
    }

    setIsLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const originalXml = decodeIso88591Buffer(buffer);

      const preprocessed = preprocessLattesXml(originalXml);
      setXmlFile(file);
      setPreprocessedLattes(preprocessed);
      remoteBatches.syncBatchItems(preprocessed, analyzedItems);
      setFeedback(
        'success',
        `Currículo de ${preprocessed.pesquisador.nomeCompleto} pré-processado (${preprocessed.totalExistentes} produções identificadas).`
      );
    } catch (error) {
      setXmlFile(null);
      setPreprocessedLattes(null);
      setFeedback('error', error.message || 'Erro ao ler o arquivo XML do Lattes.');
    } finally {
      setIsLoading(false);
    }
  };

  // Analisa lista de produções diretamente (ex: importadas de planilha)
  const handleAnalyzeProducoes = (producoesList) => {
    clearFeedback();
    if (!preprocessedLattes) {
      setFeedback('error', 'Conclua a Etapa 1 selecionando o XML do Lattes primeiro.');
      return;
    }

    if (!Array.isArray(producoesList) || producoesList.length === 0) {
      setFeedback('error', 'Nenhuma produção encontrada para analisar.');
      return;
    }

    setIsLoading(true);
    try {
      setJsonText(JSON.stringify(producoesList, null, 2));
      const items = analyzeProducoesConflicts(preprocessedLattes, producoesList);
      setAnalyzedItems(items);
      remoteBatches.syncBatchItems(preprocessedLattes, items);
      setExportResult(null);
      setCurrentStep(3);
      setFeedback(
        'success',
        `${items.length} ${items.length === 1 ? 'produção analisada' : 'produções analisadas'} contra o Lattes.`
      );
    } catch (error) {
      setFeedback('error', error.message || 'Ocorreu um erro ao analisar as produções.');
    } finally {
      setIsLoading(false);
    }
  };

  // Etapa 2 -> Etapa 3: Analisar JSON e cruzar conflitos com o Lattes pré-processado
  const handleAnalyzeJson = (customList = null) => {
    if (Array.isArray(customList)) {
      return handleAnalyzeProducoes(customList);
    }

    clearFeedback();
    if (!preprocessedLattes) {
      setFeedback('error', 'Conclua a Etapa 1 selecionando o XML do Lattes primeiro.');
      return;
    }

    if (!jsonText.trim()) {
      setFeedback('error', 'Cole o JSON com as produções que deseja analisar.');
      return;
    }

    setIsLoading(true);
    try {
      let producoes;
      try {
        producoes = JSON.parse(jsonText);
      } catch (jsonErr) {
        throw new Error('O texto colado não é um formato JSON válido: ' + jsonErr.message, {
          cause: jsonErr,
        });
      }

      const items = analyzeProducoesConflicts(preprocessedLattes, producoes);
      setAnalyzedItems(items);
      remoteBatches.syncBatchItems(preprocessedLattes, items);
      setExportResult(null);
      setCurrentStep(3);
    } catch (error) {
      setFeedback('error', error.message || 'Ocorreu um erro ao analisar o JSON.');
    } finally {
      setIsLoading(false);
    }
  };

  // Etapa 3: Alternar seleção de um item individual (incluir vs ignorar)
  const toggleItemSelection = (id, forceValue) => {
    clearFeedback();
    setAnalyzedItems((prev) => {
      const next = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              selectedForExport:
                typeof forceValue === 'boolean' ? forceValue : !item.selectedForExport,
            }
          : item
      );
      remoteBatches.syncBatchItems(preprocessedLattes, next);
      return next;
    });
  };

  // Etapa 3 -> Etapa 4: Gerar o XML final apenas com os itens selecionados
  const handlePrepareExport = () => {
    clearFeedback();
    const selectedRaw = analyzedItems
      .filter((it) => it.selectedForExport)
      .map((it) => it.rawItem);

    if (selectedRaw.length === 0) {
      setFeedback(
        'error',
        'Selecione pelo menos 1 produção para exportar para o arquivo XML do Lattes, ou avance direto para a Etapa 5 (Lotes por Ano).'
      );
      return;
    }

    try {
      const result = buildLattesExportFromSelected(preprocessedLattes, selectedRaw);
      setExportResult(result);
      remoteBatches.syncBatchItems(preprocessedLattes, analyzedItems);
      setCurrentStep(4);
    } catch (error) {
      setFeedback('error', error.message || 'Erro ao gerar o XML de exportação.');
    }
  };

  // Etapa 4: Baixar o arquivo lattes_novos_itens.xml
  const handleDownloadXml = () => {
    if (!exportResult?.blob) return;
    downloadBlob(exportResult.blob, 'lattes_novos_itens.xml');
    setFeedback(
      'success',
      `Arquivo lattes_novos_itens.xml (${exportResult.totalInseridos} ${exportResult.totalInseridos === 1 ? 'item' : 'itens'}) baixado com sucesso!`
    );
  };

  // Navegar para a Etapa 5 sincronizando os itens
  const handleOpenBatchesStep = () => {
    clearFeedback();
    if (!preprocessedLattes) {
      setFeedback('error', 'Selecione e processe o XML do Lattes na Etapa 1 primeiro.');
      return;
    }
    remoteBatches.syncBatchItems(preprocessedLattes, analyzedItems);
    setCurrentStep(5);
  };

  const goToStep = (step) => {
    clearFeedback();
    if (step === 5) {
      remoteBatches.syncBatchItems(preprocessedLattes, analyzedItems);
    }
    setCurrentStep(step);
  };

  return {
    currentStep,
    goToStep,
    xmlFile,
    preprocessedLattes,
    handleSelectXmlFile,
    jsonText,
    setJsonText,
    handleAnalyzeJson,
    handleAnalyzeProducoes,
    analyzedItems,
    toggleItemSelection,
    handlePrepareExport,
    exportResult,
    handleDownloadXml,
    handleOpenBatchesStep,
    statusMessage,
    statusType,
    isLoading,
    ...remoteBatches,
  };
}