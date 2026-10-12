import {
  normalizeTitle,
  normalizeDoi,
  calculateTitleSimilarity,
} from '../utils/textSimilarity';
import { SUPPORTED_TIPOS } from './lattesConstants';
import { getItemTitle, getItemYear, getItemVeiculo, getItemDoi } from './lattesParser';

/**
 * Etapa 2 -> 3: Analisa os itens do JSON contra o XML pré-processado do Lattes.
 * Classifica cada item em:
 * - 'new': Item inédito (sem conflito)
 * - 'conflict': Possível duplicata por similaridade textual (exibido lado a lado para decisão)
 * - 'exact': Já cadastrado (100% igual por DOI ou Título normalizado, ou duplicado no próprio JSON)
 */
export function analyzeProducoesConflicts(preprocessedLattes, producoesList) {
  if (!Array.isArray(producoesList)) {
    throw new Error('O JSON deve conter um array (lista) de produções.');
  }

  const existingItems = preprocessedLattes?.existingItems || [];
  const seenInBatch = [];
  const analyzedItems = [];

  producoesList.forEach((rawItem, index) => {
    if (!rawItem || typeof rawItem !== 'object') return;
    const rawTipo = String(rawItem.tipo || '')
      .trim()
      .toUpperCase();
    if (!SUPPORTED_TIPOS.has(rawTipo)) return;

    const db = rawItem.dados_basicos || rawItem || {};
    const dt = rawItem.detalhamento || {};
    const titulo = getItemTitle(rawItem);
    const ano = getItemYear(rawItem);
    const doi = getItemDoi(rawItem);
    const veiculo = getItemVeiculo(rawItem);
    const normTitle = normalizeTitle(titulo);
    const normDoi = normalizeDoi(doi);
    const autores = (rawItem.autores || [])
      .map((a) => a.nome_autor || a.nome || a['NOME-COMPLETO-DO-AUTOR'] || a.citacao || '')
      .filter(Boolean);

    const autoresDetalhados = (rawItem.autores || []).map((a, idx) => {
      const nome = a.nome_autor || a.nome || a['NOME-COMPLETO-DO-AUTOR'] || '';
      const citacaoRaw = a.nome_citacao || a.citacao || a['NOME-PARA-CITACAO'] || '';
      const citacao = citacaoRaw ? String(citacaoRaw).split(';')[0].trim() : '';
      const idLattes = a.id_lattes || a.id_cnpq || a['NRO-ID-CNPQ'] || '';
      const ordem = parseInt(a.ordem || a['ORDEM-DE-AUTORIA'], 10) || idx + 1;
      return {
        usuario_id: a.usuario_id,
        funcao: a.funcao,
        nome_autor: nome || citacao || `Autor ${ordem}`,
        nome_citacao: citacao || nome || '',
        id_lattes: String(idLattes || ''),
        email: a.email || '',
        instituicao: a.instituicao || '',
        ordem,
      };
    });

    const volume = String(
      dt.VOLUME || dt['NUMERO-DE-VOLUMES'] || rawItem.volume || db.volume || ''
    ).trim();
    const fasciculo = String(
      dt.FASCICULO ||
        dt.SERIE ||
        dt['NUMERO-DA-SERIE'] ||
        dt['NUMERO-DA-EDICAO-REVISAO'] ||
        rawItem.fasciculo ||
        ''
    ).trim();
    const issn = String(
      dt.ISSN || dt.ISBN || dt['ISSN-ISBN'] || rawItem.issn || rawItem.isbn || ''
    ).trim();
    const resumo = String(
      rawItem.resumo ||
        db.RESUMO ||
        db.resumo ||
        rawItem.informacoes_adicionais ||
        dt.FINALIDADE ||
        ''
    ).trim();

    let bestMatch = null;
    let bestScore = 0;
    let matchReason = '';
    let status = 'new'; // 'new' | 'conflict' | 'exact'

    // 1. Verifica contra os itens existentes no XML do Lattes
    for (const existing of existingItems) {
      if (normDoi && existing.normDoi && normDoi === existing.normDoi) {
        bestMatch = existing;
        bestScore = 1;
        matchReason = 'Mesmo DOI já cadastrado no Lattes';
        status = 'exact';
        break;
      }

      let maxItemSim = calculateTitleSimilarity(titulo, existing.titulo);
      if (existing.titles && existing.titles.length > 1) {
        for (const tObj of existing.titles) {
          const s = calculateTitleSimilarity(titulo, tObj.value);
          if (s > maxItemSim) maxItemSim = s;
        }
      }

      if (maxItemSim === 1) {
        bestMatch = existing;
        bestScore = 1;
        matchReason = 'Título idêntico já cadastrado no Lattes';
        status = 'exact';
        break;
      }

      if (maxItemSim > bestScore) {
        bestScore = maxItemSim;
        bestMatch = existing;
      }
    }

    // 2. Se não deu match exato, avalia se a maior similaridade configura possível conflito
    if (status !== 'exact' && bestMatch) {
      const sameYear = ano && bestMatch.ano && ano === bestMatch.ano;
      const threshold = sameYear ? 0.52 : 0.62;

      if (bestScore >= threshold) {
        status = 'conflict';
        const pct = Math.round(bestScore * 100);
        matchReason = sameYear
          ? `Título ${pct}% similar e mesmo ano (${ano})`
          : `Título ${pct}% similar no currículo`;
      }
    }

    // 3. Verifica também duplicidade dentro do próprio lote JSON enviado
    if (status === 'new') {
      for (const prev of seenInBatch) {
        if (normDoi && prev.normDoi && normDoi === prev.normDoi) {
          status = 'exact';
          bestScore = 1;
          bestMatch = prev;
          matchReason = 'Duplicado dentro do próprio JSON (mesmo DOI)';
          break;
        }
        const batchSim = calculateTitleSimilarity(titulo, prev.titulo);
        if (batchSim === 1) {
          status = 'exact';
          bestScore = 1;
          bestMatch = prev;
          matchReason = 'Duplicado dentro do próprio JSON (mesmo título)';
          break;
        } else if (batchSim >= 0.65) {
          status = 'conflict';
          bestScore = batchSim;
          bestMatch = prev;
          matchReason = `Similar (${Math.round(batchSim * 100)}%) a outro item do próprio JSON`;
          break;
        }
      }
    }

    const entry = {
      id: `item-${index}`,
      origem: 'novo_json',
      index,
      rawItem,
      tipo: rawTipo,
      titulo: titulo || '(Sem título)',
      ano,
      doi,
      veiculo,
      periodico: veiculo,
      volume,
      fasciculo,
      issn,
      resumo,
      autores,
      autoresDetalhados,
      normTitle,
      normDoi,
      status,
      similarity: bestScore,
      matchReason,
      matchedLattesItem: bestMatch,
      selectedForExport: status === 'new',
    };

    analyzedItems.push(entry);
    seenInBatch.push({
      sequencia: `JSON #${index + 1}`,
      tipo: rawTipo,
      titulo: entry.titulo,
      normTitle,
      ano,
      doi,
      normDoi,
      veiculo,
      autores,
    });
  });

  if (analyzedItems.length === 0) {
    throw new Error(
      'Nenhuma produção com tipo suportado pelo LMPLCurriculo.DTD foi encontrada no JSON.'
    );
  }

  return analyzedItems;
}

