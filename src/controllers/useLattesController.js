import { useState } from 'react';
import { mergeProducoesIntoLattes } from '../models/lattesModel';

export function useLattesController() {
  const [xmlFile, setXmlFile] = useState(null);
  const [jsonText, setJsonText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('idle'); // 'idle' | 'success' | 'error'
  const [isLoading, setIsLoading] = useState(false);

  const handleMergeAndDownload = async () => {
    if (!xmlFile) {
      setStatusType('error');
      setStatusMessage('Por favor, selecione o arquivo XML do seu Lattes.');
      return;
    }

    if (!jsonText.trim()) {
      setStatusType('error');
      setStatusMessage('Cole o JSON com as produções que deseja importar.');
      return;
    }

    setIsLoading(true);
    setStatusType('idle');
    setStatusMessage('Processando arquivo...');

    try {
      // 1. Ler o arquivo garantindo decodificação ISO-8859-1
      const buffer = await xmlFile.arrayBuffer();
      const decoder = new TextDecoder('iso-8859-1');
      const originalXml = decoder.decode(buffer);

      // 2. Parse do JSON
      let producoes;
      try {
        producoes = JSON.parse(jsonText);
      } catch (jsonErr) {
        throw new Error('O texto colado não é um formato JSON válido: ' + jsonErr.message);
      }

      // 3. Execução das regras de negócio pelo Model
      const { blob, totalInseridos } = mergeProducoesIntoLattes(originalXml, producoes);

      // 4. Download no navegador
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'curriculo_atualizado.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setStatusType('success');
      setStatusMessage(`${totalInseridos} trabalhos integrados com sucesso! O XML já foi baixado.`);
    } catch (error) {
      setStatusType('error');
      setStatusMessage(error.message || 'Ocorreu um erro ao processar o arquivo.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    xmlFile,
    setXmlFile,
    jsonText,
    setJsonText,
    statusMessage,
    statusType,
    isLoading,
    handleMergeAndDownload,
  };
}