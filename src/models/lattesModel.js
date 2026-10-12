/**
 * Escapa caracteres especiais para manter a sintaxe XML válida.
 */
export function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Normaliza caracteres para a faixa Latin-1 (ISO-8859-1),
 * substituindo aspas tipográficas e travessões comuns no meio acadêmico.
 */
export function sanitizeForLatin1(str) {
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2026]/g, '...')
    .replace(/[^\u0000-\u00FF]/g, '');
}

/**
 * Localiza o maior identificador SEQUENCIA-PRODUCAO no documento.
 */
export function getMaxSequenciaProducao(xmlString) {
  let maxSeq = 0;
  const matches = xmlString.matchAll(/SEQUENCIA-PRODUCAO="(\d+)"/g);
  for (const match of matches) {
    maxSeq = Math.max(maxSeq, parseInt(match[1], 10));
  }
  return maxSeq;
}

const VALID_NATUREZA_EVENTO = new Set(['COMPLETO', 'RESUMO', 'RESUMO_EXPANDIDO']);
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
 * Garante que o cabeçalho XML e a declaração DOCTYPE oficial do Lattes estejam presentes.
 */
export function ensureXmlHeaderAndDoctype(xmlString) {
  let result = xmlString.trimStart();

  // Garante a declaração <?xml ... encoding="ISO-8859-1"?>
  if (!result.startsWith('<?xml')) {
    result = '<?xml version="1.0" encoding="ISO-8859-1" standalone="no"?>\n' + result;
  } else {
    result = result.replace(
      /^<\?xml[^?]*\?>/i,
      '<?xml version="1.0" encoding="ISO-8859-1" standalone="no"?>'
    );
  }

  // Garante o <!DOCTYPE CURRICULO-VITAE SYSTEM "LMPLCurriculo.DTD"> antes de <CURRICULO-VITAE
  if (!/<!DOCTYPE\s+CURRICULO-VITAE/i.test(result)) {
    result = result.replace(
      /(<CURRICULO-VITAE\b)/i,
      '<!DOCTYPE CURRICULO-VITAE SYSTEM "LMPLCurriculo.DTD">\n$1'
    );
  }

  return result;
}

/**
 * Monta as tags XML em estrita conformidade com o LMPLCurriculo.DTD
 * e faz a injeção preservando DOCTYPE e codificação originais.
 */
export function mergeProducoesIntoLattes(originalXmlString, producoesList) {
  if (!Array.isArray(producoesList)) {
    throw new Error('O JSON deve conter um array (lista) de produções.');
  }

  let seqAtual = getMaxSequenciaProducao(originalXmlString);
  let xmlNovosNos = '';
  let totalProcessados = 0;

  producoesList.forEach((item) => {
    if (item.tipo !== 'TRABALHO-EM-EVENTOS') return;

    seqAtual += 1;
    const db = item.dados_basicos || {};
    const dt = item.detalhamento || {};
    const autores = item.autores || [];

    // Validação estrita dos atributos enumerados no LMPLCurriculo.DTD
    const natureza = normalizeEnum(db.NATUREZA, VALID_NATUREZA_EVENTO, 'COMPLETO');
    const meioDivulgacao = normalizeEnum(
      db['MEIO-DE-DIVULGACAO'],
      VALID_MEIO_DIVULGACAO,
      'MEIO_DIGITAL'
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

    let autoresXml = '';
    autores.forEach((autor, idx) => {
      const nomeCompleto = escapeXml(autor.nome || autor['NOME-COMPLETO-DO-AUTOR'] || '');
      const nomeCitacao = escapeXml(autor.citacao || autor['NOME-PARA-CITACAO'] || '');
      const ordem = autor['ORDEM-DE-AUTORIA'] || idx + 1;
      const cpf = escapeXml(autor.cpf || autor.CPF || '');
      const idCnpq = escapeXml(autor.id_cnpq || autor['NRO-ID-CNPQ'] || '');
      const cpfAttr = cpf ? ` CPF="${cpf}"` : '';

      autoresXml += `\n        <AUTORES NOME-COMPLETO-DO-AUTOR="${nomeCompleto}" NOME-PARA-CITACAO="${nomeCitacao}" ORDEM-DE-AUTORIA="${ordem}"${cpfAttr} NRO-ID-CNPQ="${idCnpq}"/>`;
    });

    xmlNovosNos += `
      <TRABALHO-EM-EVENTOS SEQUENCIA-PRODUCAO="${seqAtual}">
        <DADOS-BASICOS-DO-TRABALHO NATUREZA="${natureza}" TITULO-DO-TRABALHO="${escapeXml(db['TITULO-DO-TRABALHO'] || '')}" ANO-DO-TRABALHO="${escapeXml(db['ANO-DO-TRABALHO'] || '')}" PAIS-DO-EVENTO="${escapeXml(db['PAIS-DO-EVENTO'] || 'Brasil')}" IDIOMA="${escapeXml(db.IDIOMA || 'Português')}" MEIO-DE-DIVULGACAO="${meioDivulgacao}" HOME-PAGE-DO-TRABALHO="${escapeXml(db['HOME-PAGE-DO-TRABALHO'] || '')}" FLAG-RELEVANCIA="${flagRelevancia}" DOI="${escapeXml(db.DOI || '')}" TITULO-DO-TRABALHO-INGLES="${escapeXml(db['TITULO-DO-TRABALHO-INGLES'] || '')}" FLAG-DIVULGACAO-CIENTIFICA="${flagDivulgacao}"/>
        <DETALHAMENTO-DO-TRABALHO CLASSIFICACAO-DO-EVENTO="${classificacaoEvento}" NOME-DO-EVENTO="${escapeXml(dt['NOME-DO-EVENTO'] || '')}" CIDADE-DO-EVENTO="${escapeXml(dt['CIDADE-DO-EVENTO'] || '')}" ANO-DE-REALIZACAO="${escapeXml(dt['ANO-DE-REALIZACAO'] || db['ANO-DO-TRABALHO'] || '')}" TITULO-DOS-ANAIS-OU-PROCEEDINGS="${escapeXml(dt['TITULO-DOS-ANAIS-OU-PROCEEDINGS'] || '')}" VOLUME="${escapeXml(dt.VOLUME || '')}" FASCICULO="${escapeXml(dt.FASCICULO || '')}" SERIE="${escapeXml(dt.SERIE || '')}" PAGINA-INICIAL="${escapeXml(dt['PAGINA-INICIAL'] || '')}" PAGINA-FINAL="${escapeXml(dt['PAGINA-FINAL'] || '')}" ISBN="${escapeXml(dt.ISBN || '')}" NOME-DA-EDITORA="${escapeXml(dt['NOME-DA-EDITORA'] || '')}" CIDADE-DA-EDITORA="${escapeXml(dt['CIDADE-DA-EDITORA'] || '')}" NOME-DO-EVENTO-INGLES="${escapeXml(dt['NOME-DO-EVENTO-INGLES'] || '')}"/>${autoresXml}
      </TRABALHO-EM-EVENTOS>`;

    totalProcessados++;
  });

  if (totalProcessados === 0) {
    throw new Error('Nenhum item com "tipo": "TRABALHO-EM-EVENTOS" foi encontrado no JSON.');
  }

  let xmlResultadoString = ensureXmlHeaderAndDoctype(originalXmlString);

  // Injeção respeitando a hierarquia e a ordem exigida pelo DTD:
  // <!ELEMENT PRODUCAO-BIBLIOGRAFICA (TRABALHOS-EM-EVENTOS?, ARTIGOS-PUBLICADOS?, ...)>
  const fechoTag = '</TRABALHOS-EM-EVENTOS>';
  const selfClosingRegex = /<TRABALHOS-EM-EVENTOS\s*\/>/;

  if (xmlResultadoString.includes(fechoTag)) {
    xmlResultadoString = xmlResultadoString.replace(
      fechoTag,
      `${xmlNovosNos}\n    ${fechoTag}`
    );
  } else if (selfClosingRegex.test(xmlResultadoString)) {
    xmlResultadoString = xmlResultadoString.replace(
      selfClosingRegex,
      `<TRABALHOS-EM-EVENTOS>${xmlNovosNos}\n    </TRABALHOS-EM-EVENTOS>`
    );
  } else if (/<PRODUCAO-BIBLIOGRAFICA\s*\/>/.test(xmlResultadoString)) {
    xmlResultadoString = xmlResultadoString.replace(
      /<PRODUCAO-BIBLIOGRAFICA\s*\/>/,
      `<PRODUCAO-BIBLIOGRAFICA>\n    <TRABALHOS-EM-EVENTOS>${xmlNovosNos}\n    </TRABALHOS-EM-EVENTOS>\n  </PRODUCAO-BIBLIOGRAFICA>`
    );
  } else if (xmlResultadoString.includes('<PRODUCAO-BIBLIOGRAFICA>')) {
    // TRABALHOS-EM-EVENTOS deve ser o primeiro filho de PRODUCAO-BIBLIOGRAFICA segundo o DTD
    xmlResultadoString = xmlResultadoString.replace(
      '<PRODUCAO-BIBLIOGRAFICA>',
      `<PRODUCAO-BIBLIOGRAFICA>\n    <TRABALHOS-EM-EVENTOS>${xmlNovosNos}\n    </TRABALHOS-EM-EVENTOS>`
    );
  } else if (xmlResultadoString.includes('</DADOS-GERAIS>')) {
    // PRODUCAO-BIBLIOGRAFICA deve vir logo após DADOS-GERAIS segundo o DTD
    xmlResultadoString = xmlResultadoString.replace(
      '</DADOS-GERAIS>',
      `</DADOS-GERAIS>\n  <PRODUCAO-BIBLIOGRAFICA>\n    <TRABALHOS-EM-EVENTOS>${xmlNovosNos}\n    </TRABALHOS-EM-EVENTOS>\n  </PRODUCAO-BIBLIOGRAFICA>`
    );
  } else {
    throw new Error(
      'Estrutura XML inválida: não foi possível localizar <TRABALHOS-EM-EVENTOS>, <PRODUCAO-BIBLIOGRAFICA> ou </DADOS-GERAIS>.'
    );
  }

  // Serialização estrita em bytes ISO-8859-1 (Latin-1)
  const sanitizado = sanitizeForLatin1(xmlResultadoString);
  const bytesIso = new Uint8Array(sanitizado.length);
  for (let i = 0; i < sanitizado.length; i++) {
    bytesIso[i] = sanitizado.charCodeAt(i) & 0xff;
  }

  const xmlBlob = new Blob([bytesIso], { type: 'text/xml;charset=ISO-8859-1' });

  return {
    blob: xmlBlob,
    totalInseridos: totalProcessados,
  };
}