import { useState, useId } from 'react';
import * as XLSX from 'xlsx';
import {
  SPREADSHEET_FIELD_DEFINITIONS,
  detectColumnMapping,
  convertSpreadsheetRowsToProducoes,
} from '../../models/spreadsheetParser';

const POPULAR_TYPES = [
  { value: 'ARTIGO-PUBLICADO', label: 'Artigo em Periódico / Revista Científica' },
  { value: 'TRABALHO-EM-EVENTOS', label: 'Trabalho em Eventos (Congresso, Simpósio, Anais)' },
  { value: 'LIVRO-PUBLICADO-OU-ORGANIZADO', label: 'Livro Publicado ou Organizado' },
  { value: 'CAPITULO-DE-LIVRO-PUBLICADO', label: 'Capítulo de Livro Publicado' },
  { value: 'TEXTO-EM-JORNAL-OU-REVISTA', label: 'Texto em Jornal ou Revista de Notícias' },
  { value: 'SOFTWARE', label: 'Software / Programa de Computador' },
  { value: 'TRABALHO-TECNICO', label: 'Trabalho Técnico' },
  { value: 'APRESENTACAO-DE-TRABALHO', label: 'Apresentação de Trabalho / Palestra' },
  { value: 'RELATORIO-DE-PESQUISA', label: 'Relatório de Pesquisa' },
];

export function Step2SpreadsheetImport({
  onConfirmProducoes,
  handleOpenBatchesStep,
  goToStep,
  isLoading,
  enviarRevisaoOnline = false,
}) {
  const [spreadsheetFile, setSpreadsheetFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [headers, setHeaders] = useState([]);
  const [dataRows, setDataRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [defaultTipo, setDefaultTipo] = useState('ARTIGO-PUBLICADO');
  const [parsingError, setParsingError] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fileInputId = useId();

  // Processa a planilha quando um arquivo é selecionado
  const handleFileChange = async (file) => {
    setParsingError('');
    if (!file) {
      setSpreadsheetFile(null);
      setWorkbook(null);
      setSheetNames([]);
      setHeaders([]);
      setDataRows([]);
      setColumnMapping({});
      return;
    }

    setIsReadingFile(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const names = wb.SheetNames || [];

      if (names.length === 0) {
        throw new Error('A planilha selecionada não possui abas ou conteúdo.');
      }

      setSpreadsheetFile(file);
      setWorkbook(wb);
      setSheetNames(names);
      const firstSheet = names[0];
      setActiveSheet(firstSheet);

      loadSheetData(wb, firstSheet);
    } catch (err) {
      setSpreadsheetFile(null);
      setParsingError(err.message || 'Erro ao ler arquivo de planilha.');
    } finally {
      setIsReadingFile(false);
    }
  };

  // Carrega e estrutura as linhas de uma aba específica
  const loadSheetData = (wb, sheetName) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!matrix || matrix.length === 0) {
      setParsingError(`A aba "${sheetName}" está vazia.`);
      setHeaders([]);
      setDataRows([]);
      return;
    }

    // Identifica linha de cabeçalho
    let headerIdx = -1;
    for (let i = 0; i < Math.min(matrix.length, 10); i++) {
      const row = matrix[i];
      if (Array.isArray(row) && row.some((c) => String(c).trim().length > 0)) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx === -1) {
      setParsingError('Não foi possível identificar cabeçalhos nesta aba.');
      return;
    }

    const rawCols = matrix[headerIdx].map((c, idx) => {
      const val = String(c || '').trim();
      return val || `Coluna ${idx + 1}`;
    });

    const rows = [];
    for (let r = headerIdx + 1; r < matrix.length; r++) {
      const rowData = matrix[r];
      if (!Array.isArray(rowData)) continue;
      const hasContent = rowData.some((c) => c != null && String(c).trim() !== '');
      if (!hasContent) continue;

      const obj = {};
      rawCols.forEach((colName, cIdx) => {
        obj[colName] = rowData[cIdx] != null ? rowData[cIdx] : '';
      });
      rows.push(obj);
    }

    setHeaders(rawCols);
    setDataRows(rows);

    const autoMapping = detectColumnMapping(rawCols);
    setColumnMapping(autoMapping);
    setParsingError('');
  };

  const handleSheetChange = (newSheet) => {
    setActiveSheet(newSheet);
    if (workbook) {
      loadSheetData(workbook, newSheet);
    }
  };

  const handleUpdateMapping = (fieldKey, selectedHeader) => {
    setColumnMapping((prev) => ({
      ...prev,
      [fieldKey]: selectedHeader,
    }));
  };

  // Converte linhas usando o mapeamento atual
  const { producoes, totalIgnoredWithoutTitle } = convertSpreadsheetRowsToProducoes(
    dataRows,
    columnMapping,
    defaultTipo
  );

  const previewRows = producoes.slice(0, 4);
  const isTitleMapped = Boolean(columnMapping.titulo && columnMapping.titulo.trim());
  const canProceed = isTitleMapped && producoes.length > 0;

  const autoMappedCount = Object.values(columnMapping).filter(Boolean).length;

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(producoes, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleConfirm = () => {
    if (!canProceed) return;
    onConfirmProducoes(producoes);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {!spreadsheetFile ? (
        <div className="space-y-4">
          <label
            htmlFor={fileInputId}
            className="flex flex-col items-center justify-center w-full min-h-48 border-2 border-dashed rounded-2xl cursor-pointer bg-slate-50 border-slate-300 hover:bg-slate-100 hover:border-blue-400 transition-all p-6 text-center"
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">
                  Clique ou arraste sua planilha aqui
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos suportados: <strong className="text-slate-700">.xlsx, .xls, .csv</strong>
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✓ Colunas em qualquer ordem
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  ✓ Mapeamento automático de nomes
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  ✓ 100% no seu navegador
                </span>
              </div>
            </div>
            <input
              id={fileInputId}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
          </label>

          {parsingError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {parsingError}
            </div>
          )}

          {isReadingFile && (
            <p className="text-sm text-center text-slate-500 animate-pulse">
              Processando planilha...
            </p>
          )}
        </div>
      ) : (
        /* Arquivo carregado */
        <div className="space-y-6">
          {/* Card do arquivo carregado */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                XLS
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 break-all">
                  {spreadsheetFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {dataRows.length} linhas de dados encontradas • {headers.length} colunas
                  detectadas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {sheetNames.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span>Aba:</span>
                  <select
                    value={activeSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    {sheetNames.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleFileChange(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 text-xs font-medium cursor-pointer transition-colors"
              >
                Trocar arquivo
              </button>
            </div>
          </div>

          {parsingError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {parsingError}
            </div>
          )}

          {/* Configuração de Tipo Padrão */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/60 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Tipo padrão de produção:
                </label>
                <p className="text-xs text-indigo-700 mt-0.5">
                  Aplicado caso a planilha não tenha coluna de &quot;Tipo&quot; ou a célula esteja vazia.
                </p>
              </div>
              <select
                value={defaultTipo}
                onChange={(e) => setDefaultTipo(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-indigo-300 bg-white text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500"
              >
                {POPULAR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Painel De-Para (Mapeamento de Colunas) */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Mapeamento de Colunas (De-Para)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  As colunas foram associadas automaticamente pelos nomes. Você pode alterar qualquer
                  associação abaixo.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                <span>✓</span> {autoMappedCount} campos vinculados
              </span>
            </div>

            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SPREADSHEET_FIELD_DEFINITIONS.map((def) => {
                  const currentValue = columnMapping[def.key] || '';
                  const isMapped = Boolean(currentValue);

                  return (
                    <div
                      key={def.key}
                      className={`p-3 rounded-xl border transition-all ${
                        isMapped
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : def.required
                          ? 'border-amber-300 bg-amber-50/40'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          {def.label}
                          {def.required && (
                            <span className="text-red-500 text-sm leading-none" title="Obrigatório">
                              *
                            </span>
                          )}
                        </label>
                        {isMapped ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                            Mapeado
                          </span>
                        ) : def.required ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-800">
                            Necessário
                          </span>
                        ) : null}
                      </div>

                      <select
                        value={currentValue}
                        onChange={(e) => handleUpdateMapping(def.key, e.target.value)}
                        className={`w-full text-xs py-1.5 px-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 transition-all ${
                          isMapped
                            ? 'border-emerald-300 focus:ring-emerald-500 text-slate-800 font-medium'
                            : def.required
                            ? 'border-amber-300 focus:ring-amber-500 text-slate-600'
                            : 'border-slate-300 focus:ring-blue-500 text-slate-500'
                        }`}
                      >
                        <option value="">-- Não mapear --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>

                      <p className="text-[11px] text-slate-500 mt-1 truncate" title={def.description}>
                        {def.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {!isTitleMapped && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-amber-600 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Selecione qual coluna da planilha corresponde ao <strong>Título</strong> para
                    prosseguir.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pré-visualização dos Dados */}
          {canProceed && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pré-visualização dos Dados Convertidos ({producoes.length} produções)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Amostra das primeiras {previewRows.length} linhas com o mapeamento atual:
                  </p>
                </div>
                {totalIgnoredWithoutTitle > 0 && (
                  <span className="text-xs text-slate-500">
                    ({totalIgnoredWithoutTitle} linhas sem título ignoradas)
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Título</th>
                      <th className="py-2.5 px-3">Ano</th>
                      <th className="py-2.5 px-3">Periódico / Evento</th>
                      <th className="py-2.5 px-3">Autores</th>
                      <th className="py-2.5 px-3">DOI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {it.linha_planilha || idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                            {it.tipo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-xs truncate" title={it.titulo}>
                          {it.titulo}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{it.ano || '—'}</td>
                        <td
                          className="py-2.5 px-3 text-slate-600 max-w-xs truncate"
                          title={it.veiculo}
                        >
                          {it.veiculo || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                          {it.autores && it.autores.length > 0
                            ? it.autores.map((a) => a.nome).join('; ')
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {it.doi || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {producoes.length > previewRows.length && (
                <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
                  ... e mais {producoes.length - previewRows.length} produções prontas para análise.
                </div>
              )}
            </div>
          )}

          {/* Opção para inspecionar JSON gerado */}
          {canProceed && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{showJsonPreview ? '▼ Ocultar' : '▶ Ver'} JSON estruturado gerado</span>
              </button>

              {showJsonPreview && (
                <div className="mt-2 p-3 rounded-xl border border-slate-200 bg-slate-900 text-slate-100 font-mono text-xs relative">
                  <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
                    <span className="text-[11px] text-slate-400">
                      {producoes.length} itens convertidos
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-sans text-slate-200 transition-colors"
                    >
                      {copySuccess ? '✓ Copiado!' : 'Copiar JSON'}
                    </button>
                  </div>
                  <pre className="max-h-56 overflow-auto text-[11px] leading-relaxed">
                    {JSON.stringify(producoes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Botões de Ação na barra inferior */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={() => goToStep(1)}
          className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-all cursor-pointer"
        >
          ← Voltar para Etapa 1
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {enviarRevisaoOnline && (
            <button
              type="button"
              onClick={handleOpenBatchesStep}
              className="py-2.5 px-4 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-sm transition-all cursor-pointer"
            >
              Pular para RevisãoOnline (API) →
            </button>
          )}

          {spreadsheetFile && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canProceed || isLoading}
              className={`py-2.5 px-6 rounded-xl font-semibold text-sm shadow-sm transition-all cursor-pointer ${
                canProceed && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading
                ? 'Analisando conflitos...'
                : `Importar ${producoes.length} e Verificar Conflitos (Etapa 3) →`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

