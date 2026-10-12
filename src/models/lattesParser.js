import { unescapeXml, getXmlAttr } from '../utils/xmlUtils';
import { normalizeTitle, normalizeDoi } from '../utils/textSimilarity';

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

/**
 * Extrai todos os títulos e DOIs já registrados no XML original do Lattes.
 */
export function extractRegisteredProducoes(xmlString) {
  const registeredTitles = new Set();
  const registeredDois = new Set();

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
 * Etapa 1: Pré-processa o XML original do Lattes extraindo metadados do currículo
 * e a lista estruturada de todas as produções já cadastradas.
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
      getXmlAttr(dtAttrs, 'TITULO-DO-PERIODICO-OU-REVISTA') ||
      getXmlAttr(dtAttrs, 'NOME-DO-EVENTO') ||
      getXmlAttr(dtAttrs, 'TITULO-DO-LIVRO') ||
      getXmlAttr(dtAttrs, 'TITULO-DOS-ANAIS-OU-PROCEEDINGS') ||
      getXmlAttr(dtAttrs, 'TITULO-DO-JORNAL-OU-REVISTA') ||
      getXmlAttr(dtAttrs, 'NOME-DA-EDITORA') ||
      getXmlAttr(dtAttrs, 'INSTITUICAO-PROMOTORA') ||
      getXmlAttr(dtAttrs, 'INSTITUICAO-PROMOTORA-DO-CURSO') ||
      getXmlAttr(dtAttrs, 'NOME-DO-PROJETO') ||
      getXmlAttr(dtAttrs, 'FINALIDADE') ||
      '';

    const volume = getXmlAttr(dtAttrs, 'VOLUME') || getXmlAttr(dtAttrs, 'NUMERO-DE-VOLUMES') || '';
    const fasciculo =
      getXmlAttr(dtAttrs, 'FASCICULO') ||
      getXmlAttr(dtAttrs, 'SERIE') ||
      getXmlAttr(dtAttrs, 'NUMERO-DA-SERIE') ||
      getXmlAttr(dtAttrs, 'NUMERO-DA-EDICAO-REVISAO') ||
      '';
    const issn =
      getXmlAttr(dtAttrs, 'ISSN') ||
      getXmlAttr(dtAttrs, 'ISBN') ||
      getXmlAttr(dtAttrs, 'ISSN-ISBN') ||
      '';

    const infoMatch = innerXml.match(/<INFORMACOES-ADICIONAIS\b([^>]*)\/?>/i);
    const resumo = infoMatch
      ? getXmlAttr(infoMatch[1], 'DESCRICAO-INFORMACOES-ADICIONAIS')
      : '';

    const autores = [];
    const autoresDetalhados = [];
    let autorIdx = 0;
    for (const aMatch of innerXml.matchAll(/<AUTORES\b([^>]*)\/?>/gi)) {
      autorIdx += 1;
      const aAttrs = aMatch[1];
      const nome = getXmlAttr(aAttrs, 'NOME-COMPLETO-DO-AUTOR');
      const citacaoRaw = getXmlAttr(aAttrs, 'NOME-PARA-CITACAO');
      const citacao = citacaoRaw ? citacaoRaw.split(';')[0].trim() : '';
      const idLattes = getXmlAttr(aAttrs, 'NRO-ID-CNPQ');
      const ordemAttr = getXmlAttr(aAttrs, 'ORDEM-DE-AUTORIA');
      const ordem = parseInt(ordemAttr, 10) || autorIdx;

      if (nome) autores.push(nome);
      autoresDetalhados.push({
        nome_autor: nome || citacao || `Autor ${ordem}`,
        nome_citacao: citacao || nome || '',
        id_lattes: idLattes || '',
        email: '',
        instituicao: '',
        ordem,
      });
    }

    existingItems.push({
      id: `xml-${sequencia}-${existingItems.length}`,
      origem: 'xml',
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
      periodico: veiculo,
      volume,
      fasciculo,
      issn,
      resumo,
      autores,
      autoresDetalhados,
    });
  }

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
 * Obtém o veículo/evento/periódico/finalidade de um item do JSON.
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

