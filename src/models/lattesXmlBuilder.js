import { escapeXml, encodeIso88591Blob } from '../utils/xmlUtils';
import { normalizeEnum } from '../utils/textSimilarity';
import {
  VALID_NATUREZA_EVENTO,
  VALID_NATUREZA_ARTIGO,
  VALID_MEIO_DIVULGACAO,
  VALID_CLASSIFICACAO_EVENTO,
  VALID_SIM_NAO,
} from './lattesConstants';
import { preprocessLattesXml } from './lattesParser';
import { analyzeProducoesConflicts } from './lattesConflictAnalyzer';

export function buildAutoresXml(autores = []) {
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
 * Etapa 4: Gera a string XML e o Blob ISO-8859-1 a partir do envelope do currículo
 * e da lista de produções (rawItems) efetivamente selecionadas pelo usuário na Etapa 3.
 */
export function buildLattesExportFromSelected(envelope, selectedRawItems) {
  const { cvOpenTag, dadosGeraisBlock } = envelope;

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

  selectedRawItems.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const rawTipo = String(item.tipo || '')
      .trim()
      .toUpperCase();
    if (!rawTipo) return;

    const db = item.dados_basicos || {};
    const dt = item.detalhamento || {};
    const autores = item.autores || [];
    const autoresXml = buildAutoresXml(autores);

    if (rawTipo === 'TRABALHO-EM-EVENTOS' || rawTipo === 'TRABALHOS-EM-EVENTOS') {
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
    } else if (
      rawTipo === 'ARTIGO-ACEITO-PARA-PUBLICACAO' ||
      rawTipo === 'ARTIGOS-ACEITOS-PARA-PUBLICACAO'
    ) {
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
    } else if (
      rawTipo === 'LIVRO-PUBLICADO-OU-ORGANIZADO' ||
      rawTipo === 'LIVROS-PUBLICADOS-OU-ORGANIZADOS'
    ) {
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
    } else if (
      rawTipo === 'CAPITULO-DE-LIVRO-PUBLICADO' ||
      rawTipo === 'CAPITULOS-DE-LIVROS-PUBLICADOS'
    ) {
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
    } else if (
      rawTipo === 'TEXTO-EM-JORNAL-OU-REVISTA' ||
      rawTipo === 'TEXTOS-EM-JORNAIS-OU-REVISTAS'
    ) {
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
    }
  });

  if (seqAtual === 0) {
    throw new Error('Nenhuma produção válida selecionada para exportação.');
  }

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

  let outraProducaoXml = '';
  if (outraDemaisTrabalhos.length > 0) {
    outraProducaoXml = `<OUTRA-PRODUCAO>${outraDemaisTrabalhos.join('')}</OUTRA-PRODUCAO>`;
  }

  const xmlResultadoString =
    `<?xml version="1.0" encoding="ISO-8859-1" standalone="no"?>\n` +
    `${cvOpenTag}${dadosGeraisBlock}${producaoBibliograficaXml}${producaoTecnicaXml}${outraProducaoXml}</CURRICULO-VITAE>`;

  const { blob, xmlString } = encodeIso88591Blob(xmlResultadoString);

  return {
    blob,
    xmlString,
    totalInseridos: seqAtual,
  };
}

/**
 * Gera um arquivo XML enxuto (seguindo LMPLCurriculo.DTD)
 * contendo apenas o cabeçalho DADOS-GERAIS/RESUMO-CV e as produções inéditas do JSON.
 */
export function mergeProducoesIntoLattes(originalXmlString, producoesList) {
  const preprocessed = preprocessLattesXml(originalXmlString);
  const analyzed = analyzeProducoesConflicts(preprocessed, producoesList);
  const selectedRaw = analyzed.filter((it) => it.selectedForExport).map((it) => it.rawItem);
  const totalIgnorados = analyzed.length - selectedRaw.length;

  if (selectedRaw.length === 0) {
    throw new Error(
      `Todas as ${totalIgnorados} produções do JSON já estão registradas (ou possuem conflito) no XML do Lattes.`
    );
  }

  const { blob, xmlString, totalInseridos } = buildLattesExportFromSelected(
    preprocessed,
    selectedRaw
  );

  return {
    blob,
    xmlString,
    totalInseridos,
    totalIgnorados,
  };
}

