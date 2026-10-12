/**
 * Escapa caracteres especiais para manter a sintaxe XML válida.
 */
export function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Desfaz o escape de entidades XML para comparação de títulos e DOIs.
 */
export function unescapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Normaliza caracteres para a faixa Latin-1 (ISO-8859-1),
 * substituindo aspas tipográficas e travessões comuns no meio acadêmico.
 */
export function sanitizeForLatin1(str) {
  const replaced = str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2026]/g, '...');
  let out = '';
  for (let i = 0; i < replaced.length; i++) {
    if (replaced.charCodeAt(i) <= 0xff) {
      out += replaced[i];
    }
  }
  return out;
}

/**
 * Normaliza título para comparação insensível a caixa, acentos, pontuação e espaços.
 */
export function normalizeTitle(title) {
  if (!title) return '';
  return unescapeXml(title)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Normaliza DOI para comparação.
 */
export function normalizeDoi(doi) {
  if (!doi) return '';
  return unescapeXml(doi)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .trim();
}

/**
 * Extrai todos os títulos e DOIs já registrados no XML original do Lattes.
 */
export function extractRegisteredProducoes(xmlString) {
  const registeredTitles = new Set();
  const registeredDois = new Set();

  // Inspeciona todas as tags <DADOS-BASICOS-...> do currículo original
  const dadosBasicosMatches = xmlString.matchAll(/<DADOS-BASICOS-[A-Z0-9_-]+\b([^>]*)\/?>/gi);
  for (const match of dadosBasicosMatches) {
    const attrs = match[1];

    const doiMatch = attrs.match(/\bDOI="([^"]*)"/i);
    if (doiMatch && doiMatch[1]) {
      const normDoi = normalizeDoi(doiMatch[1]);
      if (normDoi) registeredDois.add(normDoi);
    }

    const titleMatches = attrs.matchAll(/\bTITULO(?:-[A-Z0-9_-]+)?="([^"]*)"/gi);
    for (const tMatch of titleMatches) {
      if (tMatch[1]) {
        const normTitle = normalizeTitle(tMatch[1]);
        if (normTitle) registeredTitles.add(normTitle);
      }
    }
  }

  return { registeredTitles, registeredDois };
}

/**
 * Extrai um atributo de uma string de atributos XML.
 */
function getXmlAttr(tagOrAttrs, attrName) {
  const regex = new RegExp(`\\b${attrName}="([^"]*)"`, 'i');
  const m = tagOrAttrs.match(regex);
  return m ? unescapeXml(m[1]) : '';
}

/**
 * Calcula similaridade entre dois títulos normalizados combinando:
 * - Coeficiente de Sørensen–Dice em bigramas de caracteres
 * - Jaccard em tokens relevantes (> 2 letras)
 * - Coincidência de título base (antes de ':' ou '-')
 */
export function calculateTitleSimilarity(titleA, titleB) {
  const normA = normalizeTitle(titleA);
  const normB = normalizeTitle(titleB);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  // Verifica se um contém o outro integralmente (muito comum quando um tem subtítulo e o outro não)
  const minLen = Math.min(normA.length, normB.length);
  const maxLen = Math.max(normA.length, normB.length);
  let containmentBonus = 0;
  if (minLen >= 18 && (normA.includes(normB) || normB.includes(normA))) {
    containmentBonus = Math.max(0.78, minLen / maxLen);
  }

  // Bigramas (Dice)
  const getBigrams = (s) => {
    const clean = s.replace(/\s+/g, ' ');
    const bigrams = new Map();
    for (let i = 0; i < clean.length - 1; i++) {
      const bg = clean.slice(i, i + 2);
      bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
    }
    return bigrams;
  };

  const bgA = getBigrams(normA);
  const bgB = getBigrams(normB);
  let intersectionBg = 0;
  let totalBgA = 0;
  let totalBgB = 0;
  for (const [, count] of bgA) totalBgA += count;
  for (const [, count] of bgB) totalBgB += count;
  for (const [bg, countA] of bgA) {
    if (bgB.has(bg)) {
      intersectionBg += Math.min(countA, bgB.get(bg));
    }
  }
  const diceScore =
    totalBgA + totalBgB > 0 ? (2 * intersectionBg) / (totalBgA + totalBgB) : 0;

  // Tokens relevantes (Jaccard)
  const tokensA = new Set(normA.split(' ').filter((w) => w.length > 2));
  const tokensB = new Set(normB.split(' ').filter((w) => w.length > 2));
  let tokenInter = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) tokenInter += 1;
  }
  const tokenUnion = tokensA.size + tokensB.size - tokenInter;
  const jaccardScore = tokenUnion > 0 ? tokenInter / tokenUnion : 0;

  const combined = diceScore * 0.6 + jaccardScore * 0.4;
  return Math.max(combined, containmentBonus);
}

/**
 * Etapa 1: Pré-processa o XML original do Lattes extraindo metadados do currículo
 * e a lista estruturada de todas as produções já cadastradas para comparação rápida e visual.
 */
export function preprocessLattesXml(xmlString) {
  const { cvOpenTag, dadosGeraisBlock } = extractMinimalCurriculoEnvelope(xmlString);

  const cvTagMatch = xmlString.match(/<CURRICULO-VITAE\b([^>]*)>/i);
  const dgTagMatch = xmlString.match(/<DADOS-GERAIS\b([^>]*)>/i);

  const cvAttrs = cvTagMatch ? cvTagMatch[1] : '';
  const dgAttrs = dgTagMatch ? dgTagMatch[1] : '';

  const pesquisador = {
    nomeCompleto: getXmlAttr(dgAttrs, 'NOME-COMPLETO') || 'Pesquisador',
    nomeCitacao: getXmlAttr(dgAttrs, 'NOME-EM-CITACOES-BIBLIOGRAFICAS') || '',
    numeroIdentificador: getXmlAttr(cvAttrs, 'NUMERO-IDENTIFICADOR') || '',
    dataAtualizacao: getXmlAttr(cvAttrs, 'DATA-ATUALIZACAO') || '',
    horaAtualizacao: getXmlAttr(cvAttrs, 'HORA-ATUALIZACAO') || '',
    orcidId: getXmlAttr(dgAttrs, 'ORCID-ID') || '',
  };

  // Localiza todas as produções que possuem <DADOS-BASICOS-...> e <DETALHAMENTO-...>
  const existingItems = [];
  const itemBlockRegex =
    /<([A-Z0-9_-]+)\s+SEQUENCIA-PRODUCAO="(\d+)"[^>]*>([\s\S]*?)<\/\1>/gi;

  for (const match of xmlString.matchAll(itemBlockRegex)) {
    const tipoTag = match[1].toUpperCase();
    const sequencia = match[2];
    const innerXml = match[3];

    const dbMatch = innerXml.match(/<DADOS-BASICOS-([A-Z0-9_-]+)\b([^>]*)\/?>/i);
    if (!dbMatch) continue;
    const dbAttrs = dbMatch[2];

    const dtMatch = innerXml.match(/<DETALHAMENTO-([A-Z0-9_-]+)\b([^>]*)\/?>/i);
    const dtAttrs = dtMatch ? dtMatch[2] : '';

    // Extrai todos os possíveis atributos de título no DADOS-BASICOS
    const titles = [];
    for (const tMatch of dbAttrs.matchAll(/\b(TITULO(?:-[A-Z0-9_-]+)?)="([^"]*)"/gi)) {
      const val = unescapeXml(tMatch[2]).trim();
      if (val) {
        titles.push({ attr: tMatch[1].toUpperCase(), value: val, norm: normalizeTitle(val) });
      }
    }

    const primaryTitle = titles[0]?.value || '';
    if (!primaryTitle) continue;

    const ano =
      getXmlAttr(dbAttrs, 'ANO-DO-TRABALHO') ||
      getXmlAttr(dbAttrs, 'ANO-DO-ARTIGO') ||
      getXmlAttr(dbAttrs, 'ANO-DO-TEXTO') ||
      getXmlAttr(dbAttrs, 'ANO') ||
      getXmlAttr(dbAttrs, 'ANO-DESENVOLVIMENTO') ||
      '';

    const doi = getXmlAttr(dbAttrs, 'DOI');
    const natureza = getXmlAttr(dbAttrs, 'NATUREZA');

    const veiculo =
      getXmlAttr(dtAttrs, 'NOME-DO-EVENTO') ||
      getXmlAttr(dtAttrs, 'TITULO-DO-PERIODICO-OU-REVISTA') ||
      getXmlAttr(dtAttrs, 'TITULO-DO-LIVRO') ||
      getXmlAttr(dtAttrs, 'TITULO-DOS-ANAIS-OU-PROCEEDINGS') ||
      getXmlAttr(dtAttrs, 'FINALIDADE') ||
      getXmlAttr(dtAttrs, 'INSTITUICAO-PROMOTORA') ||
      '';

    const autores = [];
    for (const aMatch of innerXml.matchAll(/<AUTORES\b([^>]*)\/?>/gi)) {
      const nome = getXmlAttr(aMatch[1], 'NOME-COMPLETO-DO-AUTOR');
      if (nome) autores.push(nome);
    }

    existingItems.push({
      sequencia,
      tipo: tipoTag,
      titulo: primaryTitle,
      titles,
      normTitle: normalizeTitle(primaryTitle),
      ano,
      doi,
      normDoi: normalizeDoi(doi),
      natureza,
      veiculo,
      autores,
    });
  }

  // Contagem por tipo para exibir resumo na Etapa 1
  const contagemPorTipo = {};
  existingItems.forEach((it) => {
    contagemPorTipo[it.tipo] = (contagemPorTipo[it.tipo] || 0) + 1;
  });

  return {
    pesquisador,
    cvOpenTag,
    dadosGeraisBlock,
    existingItems,
    contagemPorTipo,
    totalExistentes: existingItems.length,
  };
}

/**
 * Obtém o título principal de um item do JSON, independentemente da chave usada.
 */
export function getItemTitle(item) {
  const db = item.dados_basicos || item || {};
  return (
    db['TITULO-DO-TRABALHO'] ||
    db.TITULO ||
    db['TITULO-DO-ARTIGO'] ||
    db['TITULO-DO-LIVRO'] ||
    db['TITULO-DO-CAPITULO-DO-LIVRO'] ||
    db['TITULO-DO-TEXTO'] ||
    db['TITULO-DO-SOFTWARE'] ||
    db['TITULO-DO-PRODUTO'] ||
    db['TITULO-DO-PROCESSO'] ||
    db['TITULO-DO-TRABALHO-TECNICO'] ||
    db.titulo ||
    item.titulo ||
    ''
  );
}

/**
 * Obtém o ano de um item do JSON.
 */
export function getItemYear(item) {
  const db = item.dados_basicos || item || {};
  const dt = item.detalhamento || {};
  return String(
    db['ANO-DO-TRABALHO'] ||
      db['ANO-DO-ARTIGO'] ||
      db['ANO-DO-TEXTO'] ||
      db.ANO ||
      dt['ANO-DE-REALIZACAO'] ||
      db.ano ||
      item.ano ||
      ''
  ).trim();
}

/**
 * Obtém o veículo/evento/periódico/finalidade de um item do JSON para exibição lado a lado.
 */
export function getItemVeiculo(item) {
  const dt = item.detalhamento || {};
  return (
    dt['NOME-DO-EVENTO'] ||
    dt['TITULO-DO-PERIODICO-OU-REVISTA'] ||
    dt['TITULO-DO-LIVRO'] ||
    dt['TITULO-DOS-ANAIS-OU-PROCEEDINGS'] ||
    dt.FINALIDADE ||
    dt['INSTITUICAO-PROMOTORA'] ||
    ''
  );
}

/**
 * Obtém o DOI de um item do JSON.
 */
export function getItemDoi(item) {
  const db = item.dados_basicos || item || {};
  return db.DOI || db.doi || item.DOI || item.doi || '';
}

const SUPPORTED_TIPOS = new Set([
  'TRABALHO-EM-EVENTOS',
  'TRABALHOS-EM-EVENTOS',
  'DEMAIS-TRABALHOS',
  'OUTRA-PRODUCAO',
  'ARTIGO-PUBLICADO',
  'ARTIGOS-PUBLICADOS',
  'ARTIGO-ACEITO-PARA-PUBLICACAO',
  'ARTIGOS-ACEITOS-PARA-PUBLICACAO',
  'LIVRO-PUBLICADO-OU-ORGANIZADO',
  'LIVROS-PUBLICADOS-OU-ORGANIZADOS',
  'CAPITULO-DE-LIVRO-PUBLICADO',
  'CAPITULOS-DE-LIVROS-PUBLICADOS',
  'TEXTO-EM-JORNAL-OU-REVISTA',
  'TEXTOS-EM-JORNAIS-OU-REVISTAS',
  'OUTRA-PRODUCAO-BIBLIOGRAFICA',
  'SOFTWARE',
  'PRODUTO-TECNOLOGICO',
  'PROCESSOS-OU-TECNICAS',
  'TRABALHO-TECNICO',
  'APRESENTACAO-DE-TRABALHO',
  'CURSO-DE-CURTA-DURACAO-MINISTRADO',
  'DESENVOLVIMENTO-DE-MATERIAL-DIDATICO-OU-INSTRUCIONAL',
  'ORGANIZACAO-DE-EVENTO',
  'RELATORIO-DE-PESQUISA',
  'OUTRA-PRODUCAO-TECNICA',
]);

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

    const titulo = getItemTitle(rawItem);
    const ano = getItemYear(rawItem);
    const doi = getItemDoi(rawItem);
    const veiculo = getItemVeiculo(rawItem);
    const normTitle = normalizeTitle(titulo);
    const normDoi = normalizeDoi(doi);
    const autores = (rawItem.autores || [])
      .map((a) => a.nome || a['NOME-COMPLETO-DO-AUTOR'] || a.citacao || '')
      .filter(Boolean);

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

      // Compara com todos os títulos (português/inglês) registrados naquele item do Lattes
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
      index,
      rawItem,
      tipo: rawTipo,
      titulo: titulo || '(Sem título)',
      ano,
      doi,
      veiculo,
      autores,
      normTitle,
      normDoi,
      status, // 'new' | 'conflict' | 'exact'
      similarity: bestScore,
      matchReason,
      matchedLattesItem: bestMatch,
      // Por padrão, apenas os inéditos ('new') vêm marcados para exportar.
      // Conflitos ('conflict') e já cadastrados ('exact') vêm desmarcados para evitar duplicatas no CNPq,
      // mas o usuário pode marcar qualquer um na Etapa 3 se desejar incluir.
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

const VALID_NATUREZA_EVENTO = new Set(['COMPLETO', 'RESUMO', 'RESUMO_EXPANDIDO']);
const VALID_NATUREZA_ARTIGO = new Set(['COMPLETO', 'RESUMO', 'NAO_INFORMADO']);
const VALID_MEIO_DIVULGACAO = new Set([
  'IMPRESSO',
  'WEB',
  'MEIO_MAGNETICO',
  'MEIO_DIGITAL',
  'FILME',
  'HIPERTEXTO',
  'OUTRO',
  'VARIOS',
  'NAO_INFORMADO',
]);
const VALID_CLASSIFICACAO_EVENTO = new Set([
  'INTERNACIONAL',
  'NACIONAL',
  'REGIONAL',
  'LOCAL',
  'NAO_INFORMADO',
]);
const VALID_SIM_NAO = new Set(['SIM', 'NAO']);

function normalizeEnum(val, validSet, fallback) {
  if (!val) return fallback;
  const upper = String(val)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
  return validSet.has(upper) ? upper : fallback;
}

/**
 * Extrai a tag raiz <CURRICULO-VITAE ...> e o bloco mínimo <DADOS-GERAIS ...><RESUMO-CV .../></DADOS-GERAIS>
 * conforme o formato aceito na importação de novos itens do Lattes.
 */
export function extractMinimalCurriculoEnvelope(originalXmlString) {
  const cvMatch = originalXmlString.match(/<CURRICULO-VITAE\b[^>]*>/i);
  if (!cvMatch) {
    throw new Error('Estrutura XML inválida: tag <CURRICULO-VITAE> não encontrada.');
  }

  let cvOpenTag = cvMatch[0];
  if (!/\bSISTEMA-ORIGEM-XML=/i.test(cvOpenTag)) {
    cvOpenTag = cvOpenTag.replace(
      /^<CURRICULO-VITAE\b/i,
      '<CURRICULO-VITAE SISTEMA-ORIGEM-XML="LATTES_OFFLINE"'
    );
  }

  const dgMatch = originalXmlString.match(/<DADOS-GERAIS\b[^>]*>/i);
  if (!dgMatch) {
    throw new Error('Estrutura XML inválida: tag <DADOS-GERAIS> não encontrada.');
  }

  const dgOpenTag = dgMatch[0].replace(/\/\s*>$/, '>');
  const resumoMatch = originalXmlString.match(/<RESUMO-CV\b[^>]*\/?>/i);
  let resumoTag = '';
  if (resumoMatch) {
    resumoTag = resumoMatch[0].endsWith('/>')
      ? resumoMatch[0]
      : resumoMatch[0].replace(/>$/, '/>');
  }

  return {
    cvOpenTag,
    dadosGeraisBlock: `${dgOpenTag}${resumoTag}</DADOS-GERAIS>`,
  };
}

function buildAutoresXml(autores = []) {
  let autoresXml = '';
  autores.forEach((autor, idx) => {
    const nomeCompleto = escapeXml(autor.nome || autor['NOME-COMPLETO-DO-AUTOR'] || '');
    const nomeCitacao = escapeXml(autor.citacao || autor['NOME-PARA-CITACAO'] || '');
    const ordem = escapeXml(autor['ORDEM-DE-AUTORIA'] || autor.ordem || idx + 1);
    const cpf = escapeXml(autor.cpf || autor.CPF || '');
    const idCnpq = escapeXml(autor.id_cnpq || autor['NRO-ID-CNPQ'] || '');
    const cpfAttr = cpf ? ` CPF="${cpf}"` : '';

    autoresXml += `<AUTORES NOME-COMPLETO-DO-AUTOR="${nomeCompleto}" NOME-PARA-CITACAO="${nomeCitacao}" NRO-ID-CNPQ="${idCnpq}" ORDEM-DE-AUTORIA="${ordem}"${cpfAttr}/>`;
  });
  return autoresXml;
}

/**
 * Gera um arquivo XML enxuto (seguindo LMPLCurriculo.DTD e doc/lattes_novos_itens.xml)
 * contendo apenas o cabeçalho DADOS-GERAIS/RESUMO-CV e as produções do JSON
 * que ainda NÃO estão registradas no XML original do currículo.
 */
export function mergeProducoesIntoLattes(originalXmlString, producoesList) {
  if (!Array.isArray(producoesList)) {
    throw new Error('O JSON deve conter um array (lista) de produções.');
  }

  const { cvOpenTag, dadosGeraisBlock } = extractMinimalCurriculoEnvelope(originalXmlString);
  const { registeredTitles, registeredDois } = extractRegisteredProducoes(originalXmlString);

  // Buckets respeitando a hierarquia e ordem estrita do LMPLCurriculo.DTD
  const bibTrabalhosEventos = [];
  const bibArtigosPublicados = [];
  const bibLivrosPublicados = [];
  const bibCapitulosPublicados = [];
  const bibTextosJornais = [];
  const bibOutrasProducoes = [];
  const bibArtigosAceitos = [];

  const tecSoftwares = [];
  const tecProdutos = [];
  const tecProcessos = [];
  const tecTrabalhosTecnicos = [];
  const tecDemaisApresentacao = [];
  const tecDemaisCursoCurta = [];
  const tecDemaisMaterialDidatico = [];
  const tecDemaisOrganizacaoEvento = [];
  const tecDemaisRelatorioPesquisa = [];
  const tecDemaisOutra = [];

  const outraDemaisTrabalhos = [];

  let seqAtual = 0;
  let totalIgnorados = 0;
  let tiposReconhecidos = 0;

  producoesList.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const rawTipo = String(item.tipo || '')
      .trim()
      .toUpperCase();
    if (!rawTipo) return;

    const db = item.dados_basicos || {};
    const dt = item.detalhamento || {};
    const autores = item.autores || [];

    const itemTitle = getItemTitle(item);
    const itemDoi = getItemDoi(item);
    const normTitle = normalizeTitle(itemTitle);
    const normDoi = normalizeDoi(itemDoi);

    // Verifica se já está registrado no currículo original (ou duplicado no próprio lote)
    const isAlreadyRegistered =
      (normDoi && registeredDois.has(normDoi)) ||
      (normTitle && registeredTitles.has(normTitle));

    if (isAlreadyRegistered) {
      totalIgnorados += 1;
      tiposReconhecidos += 1;
      return;
    }

    const autoresXml = buildAutoresXml(autores);

    if (rawTipo === 'TRABALHO-EM-EVENTOS' || rawTipo === 'TRABALHOS-EM-EVENTOS') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const natureza = normalizeEnum(db.NATUREZA, VALID_NATUREZA_EVENTO, 'COMPLETO');
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');
      const flagDivulgacao = normalizeEnum(
        db['FLAG-DIVULGACAO-CIENTIFICA'],
        VALID_SIM_NAO,
        'NAO'
      );
      const classificacaoEvento = normalizeEnum(
        dt['CLASSIFICACAO-DO-EVENTO'],
        VALID_CLASSIFICACAO_EVENTO,
        'NAO_INFORMADO'
      );

      bibTrabalhosEventos.push(
        `<TRABALHO-EM-EVENTOS SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DO-TRABALHO NATUREZA="${natureza}" TITULO-DO-TRABALHO="${escapeXml(db['TITULO-DO-TRABALHO'] || db.TITULO || '')}" ANO-DO-TRABALHO="${escapeXml(db['ANO-DO-TRABALHO'] || db.ANO || '')}" PAIS-DO-EVENTO="${escapeXml(db['PAIS-DO-EVENTO'] || db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || db['HOME-PAGE'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-DO-TRABALHO-INGLES="${escapeXml(db['TITULO-DO-TRABALHO-INGLES'] || db['TITULO-INGLES'] || '')}" FLAG-DIVULGACAO-CIENTIFICA="${flagDivulgacao}"/>` +
          `<DETALHAMENTO-DO-TRABALHO CLASSIFICACAO-DO-EVENTO="${classificacaoEvento}" NOME-DO-EVENTO="${escapeXml(dt['NOME-DO-EVENTO'] || '')}" CIDADE-DO-EVENTO="${escapeXml(dt['CIDADE-DO-EVENTO'] || '')}" ANO-DE-REALIZACAO="${escapeXml(dt['ANO-DE-REALIZACAO'] || db['ANO-DO-TRABALHO'] || db.ANO || '')}" TITULO-DOS-ANAIS-OU-PROCEEDINGS="${escapeXml(dt['TITULO-DOS-ANAIS-OU-PROCEEDINGS'] || '')}" VOLUME="${escapeXml(dt.VOLUME || '')}" FASCICULO="${escapeXml(dt.FASCICULO || '')}" SERIE="${escapeXml(dt.SERIE || '')}" PAGINA-INICIAL="${escapeXml(dt['PAGINA-INICIAL'] || '')}" PAGINA-FINAL="${escapeXml(dt['PAGINA-FINAL'] || '')}" ISBN="${escapeXml(dt.ISBN || '')}" NOME-DA-EDITORA="${escapeXml(dt['NOME-DA-EDITORA'] || '')}" CIDADE-DA-EDITORA="${escapeXml(dt['CIDADE-DA-EDITORA'] || '')}" NOME-DO-EVENTO-INGLES="${escapeXml(dt['NOME-DO-EVENTO-INGLES'] || '')}"/>` +
          `${autoresXml}` +
          `</TRABALHO-EM-EVENTOS>`
      );
    } else if (rawTipo === 'DEMAIS-TRABALHOS' || rawTipo === 'OUTRA-PRODUCAO') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');

      outraDemaisTrabalhos.push(
        `<DEMAIS-TRABALHOS SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DE-DEMAIS-TRABALHOS NATUREZA="${escapeXml(db.NATUREZA || 'Outra')}" TITULO="${escapeXml(db.TITULO || db['TITULO-DO-TRABALHO'] || '')}" ANO="${escapeXml(db.ANO || db['ANO-DO-TRABALHO'] || '')}" PAIS="${escapeXml(db.PAIS || db['PAIS-DO-EVENTO'] || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}"/>` +
          `<DETALHAMENTO-DE-DEMAIS-TRABALHOS FINALIDADE="${escapeXml(dt.FINALIDADE || '')}" LOCAL="${escapeXml(dt.LOCAL || '')}"/>` +
          `${autoresXml}` +
          `</DEMAIS-TRABALHOS>`
      );
    } else if (rawTipo === 'ARTIGO-PUBLICADO' || rawTipo === 'ARTIGOS-PUBLICADOS') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const natureza = normalizeEnum(db.NATUREZA, VALID_NATUREZA_ARTIGO, 'COMPLETO');
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');
      const flagDivulgacao = normalizeEnum(
        db['FLAG-DIVULGACAO-CIENTIFICA'],
        VALID_SIM_NAO,
        'NAO'
      );

      bibArtigosPublicados.push(
        `<ARTIGO-PUBLICADO SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DO-ARTIGO NATUREZA="${natureza}" TITULO-DO-ARTIGO="${escapeXml(db['TITULO-DO-ARTIGO'] || db.TITULO || db['TITULO-DO-TRABALHO'] || '')}" ANO-DO-ARTIGO="${escapeXml(db['ANO-DO-ARTIGO'] || db.ANO || db['ANO-DO-TRABALHO'] || '')}" PAIS-DE-PUBLICACAO="${escapeXml(db['PAIS-DE-PUBLICACAO'] || db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || db['HOME-PAGE'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-DO-ARTIGO-INGLES="${escapeXml(db['TITULO-DO-ARTIGO-INGLES'] || db['TITULO-INGLES'] || '')}" FLAG-DIVULGACAO-CIENTIFICA="${flagDivulgacao}"/>` +
          `<DETALHAMENTO-DO-ARTIGO TITULO-DO-PERIODICO-OU-REVISTA="${escapeXml(dt['TITULO-DO-PERIODICO-OU-REVISTA'] || '')}" ISSN="${escapeXml(dt.ISSN || '')}" VOLUME="${escapeXml(dt.VOLUME || '')}" FASCICULO="${escapeXml(dt.FASCICULO || '')}" SERIE="${escapeXml(dt.SERIE || '')}" PAGINA-INICIAL="${escapeXml(dt['PAGINA-INICIAL'] || '')}" PAGINA-FINAL="${escapeXml(dt['PAGINA-FINAL'] || '')}" LOCAL-DE-PUBLICACAO="${escapeXml(dt['LOCAL-DE-PUBLICACAO'] || '')}"/>` +
          `${autoresXml}` +
          `</ARTIGO-PUBLICADO>`
      );
    } else if (rawTipo === 'ARTIGO-ACEITO-PARA-PUBLICACAO' || rawTipo === 'ARTIGOS-ACEITOS-PARA-PUBLICACAO') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const natureza = normalizeEnum(db.NATUREZA, VALID_NATUREZA_ARTIGO, 'COMPLETO');
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');
      const flagDivulgacao = normalizeEnum(
        db['FLAG-DIVULGACAO-CIENTIFICA'],
        VALID_SIM_NAO,
        'NAO'
      );

      bibArtigosAceitos.push(
        `<ARTIGO-ACEITO-PARA-PUBLICACAO SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DO-ARTIGO NATUREZA="${natureza}" TITULO-DO-ARTIGO="${escapeXml(db['TITULO-DO-ARTIGO'] || db.TITULO || '')}" ANO-DO-ARTIGO="${escapeXml(db['ANO-DO-ARTIGO'] || db.ANO || '')}" PAIS-DE-PUBLICACAO="${escapeXml(db['PAIS-DE-PUBLICACAO'] || db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-DO-ARTIGO-INGLES="${escapeXml(db['TITULO-DO-ARTIGO-INGLES'] || '')}" FLAG-DIVULGACAO-CIENTIFICA="${flagDivulgacao}"/>` +
          `<DETALHAMENTO-DO-ARTIGO TITULO-DO-PERIODICO-OU-REVISTA="${escapeXml(dt['TITULO-DO-PERIODICO-OU-REVISTA'] || '')}" ISSN="${escapeXml(dt.ISSN || '')}" VOLUME="${escapeXml(dt.VOLUME || '')}" FASCICULO="${escapeXml(dt.FASCICULO || '')}" SERIE="${escapeXml(dt.SERIE || '')}" PAGINA-INICIAL="${escapeXml(dt['PAGINA-INICIAL'] || '')}" PAGINA-FINAL="${escapeXml(dt['PAGINA-FINAL'] || '')}" LOCAL-DE-PUBLICACAO="${escapeXml(dt['LOCAL-DE-PUBLICACAO'] || '')}"/>` +
          `${autoresXml}` +
          `</ARTIGO-ACEITO-PARA-PUBLICACAO>`
      );
    } else if (rawTipo === 'LIVRO-PUBLICADO-OU-ORGANIZADO' || rawTipo === 'LIVROS-PUBLICADOS-OU-ORGANIZADOS') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');
      const flagDivulgacao = normalizeEnum(
        db['FLAG-DIVULGACAO-CIENTIFICA'],
        VALID_SIM_NAO,
        'NAO'
      );

      bibLivrosPublicados.push(
        `<LIVRO-PUBLICADO-OU-ORGANIZADO SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DO-LIVRO TIPO="${escapeXml(db.TIPO || 'LIVRO_PUBLICADO')}" NATUREZA="${escapeXml(db.NATUREZA || 'NAO_INFORMADO')}" TITULO-DO-LIVRO="${escapeXml(db['TITULO-DO-LIVRO'] || db.TITULO || '')}" ANO="${escapeXml(db.ANO || '')}" PAIS-DE-PUBLICACAO="${escapeXml(db['PAIS-DE-PUBLICACAO'] || db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-DO-LIVRO-INGLES="${escapeXml(db['TITULO-DO-LIVRO-INGLES'] || '')}" FLAG-DIVULGACAO-CIENTIFICA="${flagDivulgacao}"/>` +
          `<DETALHAMENTO-DO-LIVRO NUMERO-DE-VOLUMES="${escapeXml(dt['NUMERO-DE-VOLUMES'] || '')}" NUMERO-DE-PAGINAS="${escapeXml(dt['NUMERO-DE-PAGINAS'] || '')}" ISBN="${escapeXml(dt.ISBN || '')}" NUMERO-DA-EDICAO-REVISAO="${escapeXml(dt['NUMERO-DA-EDICAO-REVISAO'] || '')}" NUMERO-DA-SERIE="${escapeXml(dt['NUMERO-DA-SERIE'] || '')}" CIDADE-DA-EDITORA="${escapeXml(dt['CIDADE-DA-EDITORA'] || '')}" NOME-DA-EDITORA="${escapeXml(dt['NOME-DA-EDITORA'] || '')}"/>` +
          `${autoresXml}` +
          `</LIVRO-PUBLICADO-OU-ORGANIZADO>`
      );
    } else if (rawTipo === 'CAPITULO-DE-LIVRO-PUBLICADO' || rawTipo === 'CAPITULOS-DE-LIVROS-PUBLICADOS') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');
      const flagDivulgacao = normalizeEnum(
        db['FLAG-DIVULGACAO-CIENTIFICA'],
        VALID_SIM_NAO,
        'NAO'
      );

      bibCapitulosPublicados.push(
        `<CAPITULO-DE-LIVRO-PUBLICADO SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DO-CAPITULO TIPO="${escapeXml(db.TIPO || 'Capítulo de livro publicado')}" TITULO-DO-CAPITULO-DO-LIVRO="${escapeXml(db['TITULO-DO-CAPITULO-DO-LIVRO'] || db.TITULO || '')}" ANO="${escapeXml(db.ANO || '')}" PAIS-DE-PUBLICACAO="${escapeXml(db['PAIS-DE-PUBLICACAO'] || db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-DO-CAPITULO-DO-LIVRO-INGLES="${escapeXml(db['TITULO-DO-CAPITULO-DO-LIVRO-INGLES'] || '')}" FLAG-DIVULGACAO-CIENTIFICA="${flagDivulgacao}"/>` +
          `<DETALHAMENTO-DO-CAPITULO TITULO-DO-LIVRO="${escapeXml(dt['TITULO-DO-LIVRO'] || '')}" NUMERO-DE-VOLUMES="${escapeXml(dt['NUMERO-DE-VOLUMES'] || '')}" PAGINA-INICIAL="${escapeXml(dt['PAGINA-INICIAL'] || '')}" PAGINA-FINAL="${escapeXml(dt['PAGINA-FINAL'] || '')}" ISBN="${escapeXml(dt.ISBN || '')}" ORGANIZADORES="${escapeXml(dt.ORGANIZADORES || '')}" NUMERO-DA-EDICAO-REVISAO="${escapeXml(dt['NUMERO-DA-EDICAO-REVISAO'] || '')}" NUMERO-DA-SERIE="${escapeXml(dt['NUMERO-DA-SERIE'] || '')}" CIDADE-DA-EDITORA="${escapeXml(dt['CIDADE-DA-EDITORA'] || '')}" NOME-DA-EDITORA="${escapeXml(dt['NOME-DA-EDITORA'] || '')}"/>` +
          `${autoresXml}` +
          `</CAPITULO-DE-LIVRO-PUBLICADO>`
      );
    } else if (rawTipo === 'TEXTO-EM-JORNAL-OU-REVISTA' || rawTipo === 'TEXTOS-EM-JORNAIS-OU-REVISTAS') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');
      const flagDivulgacao = normalizeEnum(
        db['FLAG-DIVULGACAO-CIENTIFICA'],
        VALID_SIM_NAO,
        'NAO'
      );

      bibTextosJornais.push(
        `<TEXTO-EM-JORNAL-OU-REVISTA SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DO-TEXTO NATUREZA="${escapeXml(db.NATUREZA || 'NAO_INFORMADO')}" TITULO-DO-TEXTO="${escapeXml(db['TITULO-DO-TEXTO'] || db.TITULO || '')}" ANO-DO-TEXTO="${escapeXml(db['ANO-DO-TEXTO'] || db.ANO || '')}" PAIS-DE-PUBLICACAO="${escapeXml(db['PAIS-DE-PUBLICACAO'] || db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-DO-TEXTO-INGLES="${escapeXml(db['TITULO-DO-TEXTO-INGLES'] || '')}" FLAG-DIVULGACAO-CIENTIFICA="${flagDivulgacao}"/>` +
          `<DETALHAMENTO-DO-TEXTO TITULO-DO-JORNAL-OU-REVISTA="${escapeXml(dt['TITULO-DO-JORNAL-OU-REVISTA'] || '')}" ISSN="${escapeXml(dt.ISSN || '')}" DATA-DE-PUBLICACAO="${escapeXml(dt['DATA-DE-PUBLICACAO'] || '')}" VOLUME="${escapeXml(dt.VOLUME || '')}" PAGINA-INICIAL="${escapeXml(dt['PAGINA-INICIAL'] || '')}" PAGINA-FINAL="${escapeXml(dt['PAGINA-FINAL'] || '')}" LOCAL-DE-PUBLICACAO="${escapeXml(dt['LOCAL-DE-PUBLICACAO'] || '')}"/>` +
          `${autoresXml}` +
          `</TEXTO-EM-JORNAL-OU-REVISTA>`
      );
    } else if (rawTipo === 'OUTRA-PRODUCAO-BIBLIOGRAFICA') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');

      bibOutrasProducoes.push(
        `<OUTRA-PRODUCAO-BIBLIOGRAFICA SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DE-OUTRA-PRODUCAO NATUREZA="${escapeXml(db.NATUREZA || 'Outra')}" TITULO="${escapeXml(db.TITULO || db['TITULO-DO-TRABALHO'] || '')}" ANO="${escapeXml(db.ANO || '')}" PAIS-DE-PUBLICACAO="${escapeXml(db['PAIS-DE-PUBLICACAO'] || db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-INGLES="${escapeXml(db['TITULO-INGLES'] || '')}" NATUREZA-INGLES="${escapeXml(db['NATUREZA-INGLES'] || '')}" FLAG-DIVULGACAO-CIENTIFICA="${escapeXml(db['FLAG-DIVULGACAO-CIENTIFICA'] || 'NAO')}"/>` +
          `<DETALHAMENTO-DE-OUTRA-PRODUCAO EDITORA="${escapeXml(dt.EDITORA || dt['NOME-DA-EDITORA'] || '')}" CIDADE-DA-EDITORA="${escapeXml(dt['CIDADE-DA-EDITORA'] || '')}" NUMERO-DE-PAGINAS="${escapeXml(dt['NUMERO-DE-PAGINAS'] || '')}" ISSN-ISBN="${escapeXml(dt['ISSN-ISBN'] || dt.ISBN || dt.ISSN || '')}"/>` +
          `${autoresXml}` +
          `</OUTRA-PRODUCAO-BIBLIOGRAFICA>`
      );
    } else if (rawTipo === 'SOFTWARE') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');

      tecSoftwares.push(
        `<SOFTWARE SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DO-SOFTWARE NATUREZA="${escapeXml(db.NATUREZA || 'NAO_INFORMADO')}" TITULO-DO-SOFTWARE="${escapeXml(db['TITULO-DO-SOFTWARE'] || db.TITULO || '')}" ANO="${escapeXml(db.ANO || '')}" PAIS="${escapeXml(db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-DO-SOFTWARE-INGLES="${escapeXml(db['TITULO-DO-SOFTWARE-INGLES'] || '')}" FLAG-DIVULGACAO-CIENTIFICA="${normalizeEnum(db['FLAG-DIVULGACAO-CIENTIFICA'], VALID_SIM_NAO, 'NAO')}" FLAG-POTENCIAL-INOVACAO="${normalizeEnum(db['FLAG-POTENCIAL-INOVACAO'], VALID_SIM_NAO, 'NAO')}"/>` +
          `<DETALHAMENTO-DO-SOFTWARE FINALIDADE="${escapeXml(dt.FINALIDADE || '')}" PLATAFORMA="${escapeXml(dt.PLATAFORMA || '')}" AMBIENTE="${escapeXml(dt.AMBIENTE || '')}" DISPONIBILIDADE="${escapeXml(dt.DISPONIBILIDADE || 'NAO_INFORMADO')}" INSTITUICAO-FINANCIADORA="${escapeXml(dt['INSTITUICAO-FINANCIADORA'] || '')}" FINALIDADE-INGLES="${escapeXml(dt['FINALIDADE-INGLES'] || '')}"/>` +
          `${autoresXml}` +
          `</SOFTWARE>`
      );
    } else if (rawTipo === 'PRODUTO-TECNOLOGICO') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');

      tecProdutos.push(
        `<PRODUTO-TECNOLOGICO SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DO-PRODUTO-TECNOLOGICO TIPO-PRODUTO="${escapeXml(db['TIPO-PRODUTO'] || 'NAO_INFORMADO')}" NATUREZA="${escapeXml(db.NATUREZA || 'NAO_INFORMADO')}" TITULO-DO-PRODUTO="${escapeXml(db['TITULO-DO-PRODUTO'] || db.TITULO || '')}" ANO="${escapeXml(db.ANO || '')}" PAIS="${escapeXml(db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-DO-PRODUTO-INGLES="${escapeXml(db['TITULO-DO-PRODUTO-INGLES'] || '')}" FLAG-POTENCIAL-INOVACAO="${normalizeEnum(db['FLAG-POTENCIAL-INOVACAO'], VALID_SIM_NAO, 'NAO')}"/>` +
          `<DETALHAMENTO-DO-PRODUTO-TECNOLOGICO FINALIDADE="${escapeXml(dt.FINALIDADE || '')}" DISPONIBILIDADE="${escapeXml(dt.DISPONIBILIDADE || '')}" CIDADE-DO-PRODUTO="${escapeXml(dt['CIDADE-DO-PRODUTO'] || '')}" INSTITUICAO-FINANCIADORA="${escapeXml(dt['INSTITUICAO-FINANCIADORA'] || '')}" FINALIDADE-INGLES="${escapeXml(dt['FINALIDADE-INGLES'] || '')}"/>` +
          `${autoresXml}` +
          `</PRODUTO-TECNOLOGICO>`
      );
    } else if (rawTipo === 'PROCESSOS-OU-TECNICAS') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');

      tecProcessos.push(
        `<PROCESSOS-OU-TECNICAS SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DO-PROCESSOS-OU-TECNICAS NATUREZA="${escapeXml(db.NATUREZA || 'NAO_INFORMADO')}" TITULO-DO-PROCESSO="${escapeXml(db['TITULO-DO-PROCESSO'] || db.TITULO || '')}" ANO="${escapeXml(db.ANO || '')}" PAIS="${escapeXml(db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-DO-PROCESSO-INGLES="${escapeXml(db['TITULO-DO-PROCESSO-INGLES'] || '')}" FLAG-POTENCIAL-INOVACAO="${normalizeEnum(db['FLAG-POTENCIAL-INOVACAO'], VALID_SIM_NAO, 'NAO')}"/>` +
          `<DETALHAMENTO-DO-PROCESSOS-OU-TECNICAS FINALIDADE="${escapeXml(dt.FINALIDADE || '')}" DISPONIBILIDADE="${escapeXml(dt.DISPONIBILIDADE || '')}" INSTITUICAO-FINANCIADORA="${escapeXml(dt['INSTITUICAO-FINANCIADORA'] || '')}" CIDADE-DO-PROCESSO="${escapeXml(dt['CIDADE-DO-PROCESSO'] || '')}" FINALIDADE-INGLES="${escapeXml(dt['FINALIDADE-INGLES'] || '')}"/>` +
          `${autoresXml}` +
          `</PROCESSOS-OU-TECNICAS>`
      );
    } else if (rawTipo === 'TRABALHO-TECNICO') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');

      tecTrabalhosTecnicos.push(
        `<TRABALHO-TECNICO SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DO-TRABALHO-TECNICO NATUREZA="${escapeXml(db.NATUREZA || 'NAO_INFORMADO')}" TITULO-DO-TRABALHO-TECNICO="${escapeXml(db['TITULO-DO-TRABALHO-TECNICO'] || db.TITULO || '')}" ANO="${escapeXml(db.ANO || '')}" PAIS="${escapeXml(db.PAIS || 'Brasil')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-DO-TRABALHO-TECNICO-INGLES="${escapeXml(db['TITULO-DO-TRABALHO-TECNICO-INGLES'] || '')}"/>` +
          `<DETALHAMENTO-DO-TRABALHO-TECNICO FINALIDADE="${escapeXml(dt.FINALIDADE || '')}" DURACAO-EM-MESES="${escapeXml(dt['DURACAO-EM-MESES'] || '')}" NUMERO-DE-PAGINAS="${escapeXml(dt['NUMERO-DE-PAGINAS'] || '')}" DISPONIBILIDADE="${escapeXml(dt.DISPONIBILIDADE || '')}" INSTITUICAO-FINANCIADORA="${escapeXml(dt['INSTITUICAO-FINANCIADORA'] || '')}" CIDADE-DO-TRABALHO="${escapeXml(dt['CIDADE-DO-TRABALHO'] || '')}" FINALIDADE-INGLES="${escapeXml(dt['FINALIDADE-INGLES'] || '')}"/>` +
          `${autoresXml}` +
          `</TRABALHO-TECNICO>`
      );
    } else if (rawTipo === 'APRESENTACAO-DE-TRABALHO') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');
      const flagDivulgacao = normalizeEnum(
        db['FLAG-DIVULGACAO-CIENTIFICA'],
        VALID_SIM_NAO,
        'NAO'
      );

      tecDemaisApresentacao.push(
        `<APRESENTACAO-DE-TRABALHO SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DA-APRESENTACAO-DE-TRABALHO NATUREZA="${escapeXml(db.NATUREZA || 'NAO_INFORMADO')}" TITULO="${escapeXml(db.TITULO || db['TITULO-DO-TRABALHO'] || '')}" ANO="${escapeXml(db.ANO || '')}" PAIS="${escapeXml(db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-INGLES="${escapeXml(db['TITULO-INGLES'] || '')}" FLAG-DIVULGACAO-CIENTIFICA="${flagDivulgacao}"/>` +
          `<DETALHAMENTO-DA-APRESENTACAO-DE-TRABALHO NOME-DO-EVENTO="${escapeXml(dt['NOME-DO-EVENTO'] || '')}" INSTITUICAO-PROMOTORA="${escapeXml(dt['INSTITUICAO-PROMOTORA'] || '')}" LOCAL-DA-APRESENTACAO="${escapeXml(dt['LOCAL-DA-APRESENTACAO'] || '')}" CIDADE-DA-APRESENTACAO="${escapeXml(dt['CIDADE-DA-APRESENTACAO'] || '')}" NOME-DO-EVENTO-INGLES="${escapeXml(dt['NOME-DO-EVENTO-INGLES'] || '')}"/>` +
          `${autoresXml}` +
          `</APRESENTACAO-DE-TRABALHO>`
      );
    } else if (rawTipo === 'CURSO-DE-CURTA-DURACAO-MINISTRADO') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');

      tecDemaisCursoCurta.push(
        `<CURSO-DE-CURTA-DURACAO-MINISTRADO SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DE-CURSOS-CURTA-DURACAO-MINISTRADO NIVEL-DO-CURSO="${escapeXml(db['NIVEL-DO-CURSO'] || 'NAO_INFORMADO')}" TITULO="${escapeXml(db.TITULO || '')}" ANO="${escapeXml(db.ANO || '')}" PAIS="${escapeXml(db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-INGLES="${escapeXml(db['TITULO-INGLES'] || '')}" FLAG-DIVULGACAO-CIENTIFICA="${normalizeEnum(db['FLAG-DIVULGACAO-CIENTIFICA'], VALID_SIM_NAO, 'NAO')}"/>` +
          `<DETALHAMENTO-DE-CURSOS-CURTA-DURACAO-MINISTRADO PARTICIPACAO-DOS-AUTORES="${escapeXml(dt['PARTICIPACAO-DOS-AUTORES'] || 'NAO_INFORMADO')}" INSTITUICAO-PROMOTORA-DO-CURSO="${escapeXml(dt['INSTITUICAO-PROMOTORA-DO-CURSO'] || '')}" LOCAL-DO-CURSO="${escapeXml(dt['LOCAL-DO-CURSO'] || '')}" CIDADE="${escapeXml(dt.CIDADE || '')}" DURACAO="${escapeXml(dt.DURACAO || '')}" UNIDADE="${escapeXml(dt.UNIDADE || '')}" UNIDADE-INGLES="${escapeXml(dt['UNIDADE-INGLES'] || '')}"/>` +
          `${autoresXml}` +
          `</CURSO-DE-CURTA-DURACAO-MINISTRADO>`
      );
    } else if (rawTipo === 'DESENVOLVIMENTO-DE-MATERIAL-DIDATICO-OU-INSTRUCIONAL') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');

      tecDemaisMaterialDidatico.push(
        `<DESENVOLVIMENTO-DE-MATERIAL-DIDATICO-OU-INSTRUCIONAL SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DO-MATERIAL-DIDATICO-OU-INSTRUCIONAL NATUREZA="${escapeXml(db.NATUREZA || 'Outra')}" TITULO="${escapeXml(db.TITULO || '')}" ANO="${escapeXml(db.ANO || '')}" PAIS="${escapeXml(db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-INGLES="${escapeXml(db['TITULO-INGLES'] || '')}" NATUREZA-INGLES="${escapeXml(db['NATUREZA-INGLES'] || '')}" FLAG-DIVULGACAO-CIENTIFICA="${normalizeEnum(db['FLAG-DIVULGACAO-CIENTIFICA'], VALID_SIM_NAO, 'NAO')}"/>` +
          `<DETALHAMENTO-DO-MATERIAL-DIDATICO-OU-INSTRUCIONAL FINALIDADE="${escapeXml(dt.FINALIDADE || '')}" FINALIDADE-INGLES="${escapeXml(dt['FINALIDADE-INGLES'] || '')}"/>` +
          `${autoresXml}` +
          `</DESENVOLVIMENTO-DE-MATERIAL-DIDATICO-OU-INSTRUCIONAL>`
      );
    } else if (rawTipo === 'ORGANIZACAO-DE-EVENTO') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');

      tecDemaisOrganizacaoEvento.push(
        `<ORGANIZACAO-DE-EVENTO SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DA-ORGANIZACAO-DE-EVENTO TIPO="${escapeXml(db.TIPO || 'NAO_INFORMADO')}" NATUREZA="${escapeXml(db.NATUREZA || 'NAO_INFORMADO')}" TITULO="${escapeXml(db.TITULO || '')}" ANO="${escapeXml(db.ANO || '')}" PAIS="${escapeXml(db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-INGLES="${escapeXml(db['TITULO-INGLES'] || '')}" FLAG-DIVULGACAO-CIENTIFICA="${normalizeEnum(db['FLAG-DIVULGACAO-CIENTIFICA'], VALID_SIM_NAO, 'NAO')}"/>` +
          `<DETALHAMENTO-DA-ORGANIZACAO-DE-EVENTO INSTITUICAO-PROMOTORA="${escapeXml(dt['INSTITUICAO-PROMOTORA'] || '')}" DURACAO-EM-SEMANAS="${escapeXml(dt['DURACAO-EM-SEMANAS'] || '')}" FLAG-EVENTO-ITINERANTE="${escapeXml(dt['FLAG-EVENTO-ITINERANTE'] || '')}" FLAG-CATALOGO="${escapeXml(dt['FLAG-CATALOGO'] || '')}" LOCAL="${escapeXml(dt.LOCAL || '')}" CIDADE="${escapeXml(dt.CIDADE || '')}"/>` +
          `${autoresXml}` +
          `</ORGANIZACAO-DE-EVENTO>`
      );
    } else if (rawTipo === 'RELATORIO-DE-PESQUISA') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');

      tecDemaisRelatorioPesquisa.push(
        `<RELATORIO-DE-PESQUISA SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DO-RELATORIO-DE-PESQUISA TITULO="${escapeXml(db.TITULO || '')}" ANO="${escapeXml(db.ANO || '')}" PAIS="${escapeXml(db.PAIS || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-INGLES="${escapeXml(db['TITULO-INGLES'] || '')}"/>` +
          `<DETALHAMENTO-DO-RELATORIO-DE-PESQUISA NOME-DO-PROJETO="${escapeXml(dt['NOME-DO-PROJETO'] || '')}" NUMERO-DE-PAGINAS="${escapeXml(dt['NUMERO-DE-PAGINAS'] || '')}" DISPONIBILIDADE="${escapeXml(dt.DISPONIBILIDADE || '')}" INSTITUICAO-FINANCIADORA="${escapeXml(dt['INSTITUICAO-FINANCIADORA'] || '')}"/>` +
          `${autoresXml}` +
          `</RELATORIO-DE-PESQUISA>`
      );
    } else if (rawTipo === 'OUTRA-PRODUCAO-TECNICA') {
      tiposReconhecidos += 1;
      seqAtual += 1;
      const meioDivulgacao = normalizeEnum(
        db['MEIO-DE-DIVULGACAO'],
        VALID_MEIO_DIVULGACAO,
        'NAO_INFORMADO'
      );
      const flagRelevancia = normalizeEnum(db['FLAG-RELEVANCIA'], VALID_SIM_NAO, 'NAO');

      tecDemaisOutra.push(
        `<OUTRA-PRODUCAO-TECNICA SEQUENCIA-PRODUCAO="${seqAtual}">` +
          `<DADOS-BASICOS-DE-OUTRA-PRODUCAO-TECNICA NATUREZA="${escapeXml(db.NATUREZA || 'Outra')}" TITULO="${escapeXml(db.TITULO || db['TITULO-DO-TRABALHO'] || '')}" ANO="${escapeXml(db.ANO || '')}" PAIS="${escapeXml(db.PAIS || 'Brasil')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-INGLES="${escapeXml(db['TITULO-INGLES'] || '')}" NATUREZA-INGLES="${escapeXml(db['NATUREZA-INGLES'] || '')}" FLAG-DIVULGACAO-CIENTIFICA="${normalizeEnum(db['FLAG-DIVULGACAO-CIENTIFICA'], VALID_SIM_NAO, 'NAO')}"/>` +
          `<DETALHAMENTO-DE-OUTRA-PRODUCAO-TECNICA FINALIDADE="${escapeXml(dt.FINALIDADE || '')}" INSTITUICAO-PROMOTORA="${escapeXml(dt['INSTITUICAO-PROMOTORA'] || '')}" LOCAL="${escapeXml(dt.LOCAL || '')}" CIDADE="${escapeXml(dt.CIDADE || '')}" FINALIDADE-INGLES="${escapeXml(dt['FINALIDADE-INGLES'] || '')}"/>` +
          `${autoresXml}` +
          `</OUTRA-PRODUCAO-TECNICA>`
      );
    } else {
      return;
    }

    // Registra nos conjuntos para evitar duplicatas dentro do próprio JSON
    if (normDoi) registeredDois.add(normDoi);
    if (normTitle) registeredTitles.add(normTitle);
  });

  if (tiposReconhecidos === 0) {
    throw new Error(
      'Nenhuma produção com tipo suportado pelo LMPLCurriculo.DTD foi encontrada no JSON.'
    );
  }

  if (seqAtual === 0) {
    throw new Error(
      `Todas as ${totalIgnorados} produções do JSON já estão registradas no XML do Lattes.`
    );
  }

  // Monta <PRODUCAO-BIBLIOGRAFICA> na ordem estrita do DTD:
  // (TRABALHOS-EM-EVENTOS?, ARTIGOS-PUBLICADOS?, LIVROS-E-CAPITULOS?, TEXTOS-EM-JORNAIS-OU-REVISTAS?, DEMAIS-TIPOS-DE-PRODUCAO-BIBLIOGRAFICA?, ARTIGOS-ACEITOS-PARA-PUBLICACAO?)
  let producaoBibliograficaXml = '';
  const bibParts = [];
  if (bibTrabalhosEventos.length > 0) {
    bibParts.push(`<TRABALHOS-EM-EVENTOS>${bibTrabalhosEventos.join('')}</TRABALHOS-EM-EVENTOS>`);
  }
  if (bibArtigosPublicados.length > 0) {
    bibParts.push(`<ARTIGOS-PUBLICADOS>${bibArtigosPublicados.join('')}</ARTIGOS-PUBLICADOS>`);
  }
  if (bibLivrosPublicados.length > 0 || bibCapitulosPublicados.length > 0) {
    const livrosPart =
      bibLivrosPublicados.length > 0
        ? `<LIVROS-PUBLICADOS-OU-ORGANIZADOS>${bibLivrosPublicados.join('')}</LIVROS-PUBLICADOS-OU-ORGANIZADOS>`
        : '';
    const capitulosPart =
      bibCapitulosPublicados.length > 0
        ? `<CAPITULOS-DE-LIVROS-PUBLICADOS>${bibCapitulosPublicados.join('')}</CAPITULOS-DE-LIVROS-PUBLICADOS>`
        : '';
    bibParts.push(`<LIVROS-E-CAPITULOS>${livrosPart}${capitulosPart}</LIVROS-E-CAPITULOS>`);
  }
  if (bibTextosJornais.length > 0) {
    bibParts.push(
      `<TEXTOS-EM-JORNAIS-OU-REVISTAS>${bibTextosJornais.join('')}</TEXTOS-EM-JORNAIS-OU-REVISTAS>`
    );
  }
  if (bibOutrasProducoes.length > 0) {
    bibParts.push(
      `<DEMAIS-TIPOS-DE-PRODUCAO-BIBLIOGRAFICA>${bibOutrasProducoes.join('')}</DEMAIS-TIPOS-DE-PRODUCAO-BIBLIOGRAFICA>`
    );
  }
  if (bibArtigosAceitos.length > 0) {
    bibParts.push(
      `<ARTIGOS-ACEITOS-PARA-PUBLICACAO>${bibArtigosAceitos.join('')}</ARTIGOS-ACEITOS-PARA-PUBLICACAO>`
    );
  }
  if (bibParts.length > 0) {
    producaoBibliograficaXml = `<PRODUCAO-BIBLIOGRAFICA>${bibParts.join('')}</PRODUCAO-BIBLIOGRAFICA>`;
  }

  // Monta <PRODUCAO-TECNICA> na ordem estrita do DTD:
  // (CULTIVAR-REGISTRADA*, SOFTWARE*, PATENTE*, CULTIVAR-PROTEGIDA*, DESENHO-INDUSTRIAL*, MARCA*, TOPOGRAFIA-DE-CIRCUITO-INTEGRADO*, PRODUTO-TECNOLOGICO*, PROCESSOS-OU-TECNICAS*, TRABALHO-TECNICO*, DEMAIS-TIPOS-DE-PRODUCAO-TECNICA*)
  let producaoTecnicaXml = '';
  const tecParts = [];
  if (tecSoftwares.length > 0) tecParts.push(tecSoftwares.join(''));
  if (tecProdutos.length > 0) tecParts.push(tecProdutos.join(''));
  if (tecProcessos.length > 0) tecParts.push(tecProcessos.join(''));
  if (tecTrabalhosTecnicos.length > 0) tecParts.push(tecTrabalhosTecnicos.join(''));

  const tecDemaisParts = [
    ...tecDemaisApresentacao,
    ...tecDemaisCursoCurta,
    ...tecDemaisMaterialDidatico,
    ...tecDemaisOrganizacaoEvento,
    ...tecDemaisRelatorioPesquisa,
    ...tecDemaisOutra,
  ];
  if (tecDemaisParts.length > 0) {
    tecParts.push(
      `<DEMAIS-TIPOS-DE-PRODUCAO-TECNICA>${tecDemaisParts.join('')}</DEMAIS-TIPOS-DE-PRODUCAO-TECNICA>`
    );
  }
  if (tecParts.length > 0) {
    producaoTecnicaXml = `<PRODUCAO-TECNICA>${tecParts.join('')}</PRODUCAO-TECNICA>`;
  }

  // Monta <OUTRA-PRODUCAO> na ordem estrita do DTD:
  // (PRODUCAO-ARTISTICA-CULTURAL*, ORIENTACOES-CONCLUIDAS*, DEMAIS-TRABALHOS*)
  let outraProducaoXml = '';
  if (outraDemaisTrabalhos.length > 0) {
    outraProducaoXml = `<OUTRA-PRODUCAO>${outraDemaisTrabalhos.join('')}</OUTRA-PRODUCAO>`;
  }

  // Monta o documento final idêntico ao formato de doc/lattes_novos_itens.xml
  const xmlResultadoString =
    `<?xml version="1.0" encoding="ISO-8859-1" standalone="no"?>\n` +
    `${cvOpenTag}${dadosGeraisBlock}${producaoBibliograficaXml}${producaoTecnicaXml}${outraProducaoXml}</CURRICULO-VITAE>`;

  // Serialização estrita em bytes ISO-8859-1 (Latin-1)
  const sanitizado = sanitizeForLatin1(xmlResultadoString);
  const bytesIso = new Uint8Array(sanitizado.length);
  for (let i = 0; i < sanitizado.length; i++) {
    bytesIso[i] = sanitizado.charCodeAt(i) & 0xff;
  }

  const xmlBlob = new Blob([bytesIso], { type: 'text/xml;charset=ISO-8859-1' });

  return {
    blob: xmlBlob,
    totalInseridos: seqAtual,
    totalIgnorados,
  };
}