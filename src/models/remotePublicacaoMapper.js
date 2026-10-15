import { normalizeTitle } from '../utils/textSimilarity';
import { isOrientacaoTipo } from './lattesConstants';

/**
 * Converte a tag de produção do Lattes para o valor de `tipo` esperado pela API remota.
 */
export function mapLattesTipoToRemote(lattesTipo) {
  const t = String(lattesTipo || '')
    .trim()
    .toUpperCase();
  if (isOrientacaoTipo(t)) {
    return 'orientacao';
  }
  if (
    t === 'ARTIGO-PUBLICADO' ||
    t === 'ARTIGOS-PUBLICADOS' ||
    t === 'ARTIGO-ACEITO-PARA-PUBLICACAO' ||
    t === 'ARTIGOS-ACEITOS-PARA-PUBLICACAO'
  ) {
    return 'periodico';
  }
  if (t === 'TRABALHO-EM-EVENTOS' || t === 'TRABALHOS-EM-EVENTOS') {
    return 'evento';
  }
  if (t === 'LIVRO-PUBLICADO-OU-ORGANIZADO' || t === 'LIVROS-PUBLICADOS-OU-ORGANIZADOS') {
    return 'livro';
  }
  if (t === 'CAPITULO-DE-LIVRO-PUBLICADO' || t === 'CAPITULOS-DE-LIVROS-PUBLICADOS') {
    return 'capitulo';
  }
  if (t === 'TEXTO-EM-JORNAL-OU-REVISTA' || t === 'TEXTOS-EM-JORNAIS-OU-REVISTAS') {
    return 'revista';
  }
  if (t === 'SOFTWARE') {
    return 'software';
  }
  if (
    t === 'PRODUTO-TECNOLOGICO' ||
    t === 'PROCESSOS-OU-TECNICAS' ||
    t === 'TRABALHO-TECNICO' ||
    t === 'RELATORIO-DE-PESQUISA' ||
    t === 'OUTRA-PRODUCAO-TECNICA'
  ) {
    return 'tecnico';
  }
  return 'periodico';
}

/**
 * Formata volume e fascículo no padrão "v. 34, n. 1".
 */
export function formatVolumeString(volume, fasciculo) {
  const v = String(volume || '').trim();
  const f = String(fasciculo || '').trim();
  if (!v && !f) return '';
  if (v && f) {
    const vPart = /^v(\.|ol)/i.test(v) ? v : `v. ${v}`;
    const fPart = /^n(\.|º|o)/i.test(f) ? f : `n. ${f}`;
    return `${vPart}, ${fPart}`;
  }
  if (v) {
    return /^v(\.|ol)/i.test(v) ? v : `v. ${v}`;
  }
  return /^n(\.|º|o)/i.test(f) ? f : `n. ${f}`;
}

/**
 * Formata ISSN com hífen (ex: "14145678" -> "1414-5678") quando aplicável.
 */
export function formatIssnString(issn) {
  const clean = String(issn || '').trim();
  if (!clean) return '';
  if (/^[0-9]{7}[0-9Xx]$/.test(clean)) {
    return `${clean.slice(0, 4)}-${clean.slice(4).toUpperCase()}`;
  }
  return clean;
}

/**
 * Verifica se um autor da publicação corresponde ao titular do currículo Lattes.
 */
export function isCurriculumOwnerAuthor(autor, pesquisador) {
  if (!autor || !pesquisador) return false;

  if (typeof autor.usuario_id === 'number' && autor.usuario_id > 0) {
    return true;
  }

  const ownerId = String(pesquisador.numeroIdentificador || '').trim();
  const autorId = String(autor.id_lattes || '').trim();
  if (ownerId && autorId && ownerId === autorId) {
    return true;
  }

  const normOwnerName = normalizeTitle(pesquisador.nomeCompleto || '');
  const normAutorName = normalizeTitle(autor.nome_autor || '');
  if (normOwnerName && normAutorName && normOwnerName === normAutorName) {
    return true;
  }

  const normAutorCit = normalizeTitle(autor.nome_citacao || '');
  if (pesquisador.nomeCitacao && normAutorCit) {
    const ownerCits = String(pesquisador.nomeCitacao)
      .split(';')
      .map((c) => normalizeTitle(c))
      .filter(Boolean);
    if (ownerCits.includes(normAutorCit)) {
      return true;
    }
  }

  if (normOwnerName) {
    const parts = normOwnerName.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0];
      const last = parts[parts.length - 1];
      const shortCit = `${last} ${first[0]}`;
      const fullCit = `${last} ${first}`;
      if (normAutorCit === shortCit || normAutorCit === fullCit) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Constrói o JSON exato esperado pelo endpoint POST /api/remote/publicacao
 * para uma única publicação.
 */
export function buildRemotePublicacaoPayload(item, pesquisador, config = {}) {
  const usuarioId = Number(config.usuarioId) || 1;
  const isOrientacao = isOrientacaoTipo(item.tipo);
  const funcaoPadrao =
    String(
      config.funcaoTitular || (isOrientacao ? 'Orientador' : 'Autor Principal')
    ).trim() || (isOrientacao ? 'Orientador' : 'Autor Principal');
  const vincularTitular = config.vincularTitular !== false;
  const forceTipo = config.forceTipo ? String(config.forceTipo).trim() : '';

  const projetosIds = Array.isArray(config.projetosIds)
    ? config.projetosIds
    : String(config.projetosIdsText ?? '1')
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n) && n > 0);

  const anoNum = parseInt(item.ano, 10) || new Date().getFullYear();
  const rawAutores =
    item.autoresDetalhados && item.autoresDetalhados.length > 0
      ? item.autoresDetalhados
      : (item.autores || []).map((nome, idx) => ({
          nome_autor: nome,
          nome_citacao: nome,
          id_lattes: '',
          email: '',
          instituicao: '',
          ordem: idx + 1,
        }));

  const autoresPayload = rawAutores.map((autor, idx) => {
    const ordem = Number(autor.ordem) || idx + 1;
    if (vincularTitular && isCurriculumOwnerAuthor(autor, pesquisador)) {
      return {
        usuario_id: Number(autor.usuario_id) || usuarioId,
        funcao: autor.funcao || funcaoPadrao,
        ordem,
      };
    }
    const baseAutor = {
      nome_autor: autor.nome_autor || '',
      nome_citacao: autor.nome_citacao || '',
      id_lattes: autor.id_lattes || '',
      email: autor.email || '',
      instituicao: autor.instituicao || '',
      ordem,
    };
    if (autor.funcao) {
      baseAutor.funcao = autor.funcao;
    } else if (isOrientacao) {
      baseAutor.funcao = 'Orientando';
    }
    return baseAutor;
  });

  return {
    titulo: item.titulo || '',
    resumo: item.resumo || '',
    periodico: item.periodico || item.veiculo || '',
    volume: formatVolumeString(item.volume, item.fasciculo),
    issn: formatIssnString(item.issn),
    ano: anoNum,
    doi: item.doi || '',
    tipo: forceTipo || mapLattesTipoToRemote(item.tipo),
    projetos_ids: projetosIds,
    autores: autoresPayload,
  };
}

/**
 * Consolida todas as produções do Lattes processado (itens já existentes no XML +
 * novos itens selecionados do JSON) para organização em lotes por ano.
 */
export function buildProcessedItemsForBatches(preprocessedLattes, analyzedItems = []) {
  const xmlItems = (preprocessedLattes?.existingItems || []).map((it, idx) => ({
    ...it,
    batchItemId: `batch-xml-${it.sequencia || idx}-${idx}`,
    origem: 'xml',
  }));

  const newSelectedItems = (analyzedItems || [])
    .filter((it) => it.selectedForExport)
    .map((it, idx) => ({
      ...it,
      batchItemId: `batch-json-${it.index ?? idx}-${idx}`,
      origem: 'novo_json',
    }));

  return [...newSelectedItems, ...xmlItems];
}

