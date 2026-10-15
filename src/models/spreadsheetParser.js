import * as XLSX from 'xlsx';
import { SUPPORTED_TIPOS } from './lattesConstants.js';

/**
 * Definições dos campos padrão suportados para mapeamento da planilha.
 */
export const SPREADSHEET_FIELD_DEFINITIONS = [
  {
    key: 'titulo',
    label: 'Título',
    required: true,
    description: 'Título do artigo, trabalho, livro ou software.',
    aliases: [
      'titulo',
      'title',
      'titulo do artigo',
      'titulo do trabalho',
      'titulo do livro',
      'nome do trabalho',
      'nome da publicacao',
      'publicacao',
      'artigo',
      'document title',
      'item title',
      'trabalho',
      'obra',
      'titulo original',
    ],
  },
  {
    key: 'ano',
    label: 'Ano',
    required: false,
    description: 'Ano de publicação ou realização (ex: 2024).',
    aliases: [
      'ano',
      'year',
      'ano publicacao',
      'ano de publicacao',
      'ano publicacao revista',
      'publication year',
      'ano de realizacao',
      'ano do trabalho',
      'ano do artigo',
      'data',
      'data de publicacao',
      'date',
      'exercicio',
    ],
  },
  {
    key: 'tipo',
    label: 'Tipo / Categoria',
    required: false,
    description: 'Tipo da produção (ex: Artigo, Evento, Livro, Capítulo).',
    aliases: [
      'tipo',
      'type',
      'tipo de producao',
      'tipo producao',
      'categoria',
      'natureza',
      'modalidade',
      'document type',
      'publication type',
      'tipo de publicacao',
      'tipo item',
    ],
  },
  {
    key: 'veiculo',
    label: 'Periódico / Evento / Veículo',
    required: false,
    description: 'Nome da revista científica, conferência, anais ou livro.',
    aliases: [
      'periodico',
      'revista',
      'journal',
      'source title',
      'source',
      'nome do evento',
      'evento',
      'conferencia',
      'conference',
      'veiculo',
      'veiculo de publicacao',
      'proceedings',
      'livro',
      'nome da revista',
      'publicado em',
      'nome do periodico',
      'instituicao',
      'curso',
      'universidade',
      'faculdade',
    ],
  },
  {
    key: 'autores',
    label: 'Autores',
    required: false,
    description: 'Nomes dos autores (separados por ponto e vírgula ou vírgula).',
    aliases: [
      'autores',
      'authors',
      'autor',
      'author',
      'nome dos autores',
      'colaboradores',
      'autoria',
      'author names',
      'creator',
      'autores do trabalho',
      'orientando',
      'orientado',
      'aluno',
      'estudante',
      'orientador',
    ],
  },
  {
    key: 'doi',
    label: 'DOI',
    required: false,
    description: 'Identificador Digital de Objeto (DOI).',
    aliases: [
      'doi',
      'link doi',
      'digital object identifier',
      'url doi',
      'identificador doi',
      'codigo doi',
    ],
  },
  {
    key: 'volume',
    label: 'Volume',
    required: false,
    description: 'Volume do periódico ou livro.',
    aliases: ['volume', 'vol', 'numero do volume', 'journal volume'],
  },
  {
    key: 'fasciculo',
    label: 'Fascículo / Número',
    required: false,
    description: 'Fascículo, número ou edição (ex: 2, n. 4).',
    aliases: [
      'fasciculo',
      'numero',
      'issue',
      'num',
      'edicao',
      'numero da edicao',
      'serie',
      'number',
    ],
  },
  {
    key: 'issn',
    label: 'ISSN',
    required: false,
    description: 'ISSN da revista ou periódico (ex: 1234-5678).',
    aliases: ['issn', 'eissn', 'issn/isbn', 'issn impresso', 'issn eletronico'],
  },
  {
    key: 'isbn',
    label: 'ISBN',
    required: false,
    description: 'ISBN do livro ou anais.',
    aliases: ['isbn', 'isbn 10', 'isbn 13'],
  },
  {
    key: 'paginas',
    label: 'Páginas',
    required: false,
    description: 'Páginas (ex: 15-28 ou página inicial/final).',
    aliases: [
      'paginas',
      'pages',
      'pagina inicial',
      'pagina final',
      'page',
      'pp',
      'intervalo de paginas',
    ],
  },
  {
    key: 'resumo',
    label: 'Resumo / Abstract',
    required: false,
    description: 'Resumo ou informações adicionais.',
    aliases: ['resumo', 'abstract', 'descricao', 'description', 'observacoes', 'detalhes'],
  },
];

/**
 * Normaliza o nome do cabeçalho da coluna para comparação heurística.
 */
export function normalizeHeader(name) {
  if (!name) return '';
  return String(name)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]/g, ' ') // substitui pontuação por espaço
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detecta automaticamente o mapeamento de colunas da planilha para os campos do Lattes.
 * Ordem física das colunas na planilha não faz diferença!
 */
export function detectColumnMapping(columnHeaders) {
  const mapping = {};
  const usedHeaders = new Set();

  // 1. Primeira passada: busca correspondência exata
  for (const def of SPREADSHEET_FIELD_DEFINITIONS) {
    mapping[def.key] = '';

    for (const rawHeader of columnHeaders) {
      if (usedHeaders.has(rawHeader)) continue;
      const norm = normalizeHeader(rawHeader);

      if (def.aliases.includes(norm)) {
        mapping[def.key] = rawHeader;
        usedHeaders.add(rawHeader);
        break;
      }
    }
  }

  // 2. Segunda passada: busca correspondência parcial (includes/startsWith) para os não mapeados
  for (const def of SPREADSHEET_FIELD_DEFINITIONS) {
    if (mapping[def.key]) continue;

    for (const rawHeader of columnHeaders) {
      if (usedHeaders.has(rawHeader)) continue;
      const norm = normalizeHeader(rawHeader);

      const hasPartialMatch = def.aliases.some(
        (alias) =>
          norm.startsWith(alias + ' ') ||
          norm.endsWith(' ' + alias) ||
          norm.includes(' ' + alias + ' ') ||
          alias.startsWith(norm + ' ')
      );

      if (hasPartialMatch) {
        mapping[def.key] = rawHeader;
        usedHeaders.add(rawHeader);
        break;
      }
    }
  }

  return mapping;
}

/**
 * Normaliza strings com valores de ano (ex: "2024.0", "12/05/2023", 2021) para ano de 4 dígitos.
 */
export function extractYearString(val) {
  if (val == null) return '';
  const str = String(val).trim();
  const match = str.match(/\b(19\d\d|20\d\d)\b/);
  if (match) return match[1];
  return str.replace(/\.0$/, '').trim();
}

/**
 * Normaliza links ou textos de DOI para o formato padronizado (10.xxxx/yyyy).
 */
export function extractDoiString(val) {
  if (!val) return '';
  const str = String(val).trim();
  const match = str.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
  return match ? match[0] : str;
}

/**
 * Divide strings de intervalo de páginas (ex: "10-25", "10 a 25", "10 - 25", "10").
 */
export function extractPageInterval(val) {
  if (!val) return { paginaInicial: '', paginaFinal: '' };
  const str = String(val).trim();
  const match = str.match(/(\d+)\s*(?:-|–|—|a|to)\s*(\d+)/i);
  if (match) {
    return { paginaInicial: match[1], paginaFinal: match[2] };
  }
  const single = str.match(/\b(\d+)\b/);
  return {
    paginaInicial: single ? single[1] : str,
    paginaFinal: '',
  };
}

/**
 * Normaliza o tipo de produção especificado na planilha para as constantes do Lattes.
 */
export function mapSpreadsheetTypeToLattes(rawTipo, defaultTipo = 'ARTIGO-PUBLICADO') {
  if (!rawTipo) return defaultTipo;

  const upper = String(rawTipo).trim().toUpperCase();
  if (SUPPORTED_TIPOS.has(upper)) {
    return upper;
  }

  const norm = normalizeHeader(rawTipo);

  if (norm.includes('capitulo') || norm.includes('chapter')) {
    return 'CAPITULO-DE-LIVRO-PUBLICADO';
  }
  if (
    norm.includes('livro') ||
    norm.includes('book') ||
    norm.includes('e book') ||
    norm.includes('ebook')
  ) {
    return 'LIVRO-PUBLICADO-OU-ORGANIZADO';
  }
  if (
    norm.includes('artigo') ||
    norm.includes('journal') ||
    norm.includes('periodico') ||
    norm.includes('article') ||
    norm.includes('revista cientifica')
  ) {
    return 'ARTIGO-PUBLICADO';
  }
  if (
    norm.includes('evento') ||
    norm.includes('congresso') ||
    norm.includes('conferencia') ||
    norm.includes('proceedings') ||
    norm.includes('simposio') ||
    norm.includes('encontro') ||
    norm.includes('conference') ||
    norm.includes('seminario')
  ) {
    return 'TRABALHO-EM-EVENTOS';
  }
  if (
    norm.includes('jornal') ||
    norm.includes('noticia') ||
    norm.includes('magazine') ||
    norm.includes('reportagem')
  ) {
    return 'TEXTO-EM-JORNAL-OU-REVISTA';
  }
  if (
    norm.includes('software') ||
    norm.includes('aplicativo') ||
    norm.includes('programa de computador')
  ) {
    return 'SOFTWARE';
  }
  if (norm.includes('relatorio') || norm.includes('report')) {
    return 'RELATORIO-DE-PESQUISA';
  }
  if (
    norm.includes('produto') ||
    norm.includes('processo') ||
    norm.includes('tecnico') ||
    norm.includes('technical')
  ) {
    return 'TRABALHO-TECNICO';
  }
  if (norm.includes('apresentacao') || norm.includes('palestra')) {
    return 'APRESENTACAO-DE-TRABALHO';
  }
  if (norm.includes('curso') || norm.includes('minicurso')) {
    return 'CURSO-DE-CURTA-DURACAO-MINISTRADO';
  }
  if (
    norm.includes('orientacao') ||
    norm.includes('orientacoes') ||
    norm.includes('tcc') ||
    norm.includes('monografia') ||
    norm.includes('dissertacao') ||
    norm.includes('tese') ||
    norm.includes('iniciacao cientifica') ||
    norm.includes('pos doutorado') ||
    norm.includes('mestrado') ||
    norm.includes('doutorado')
  ) {
    if (norm.includes('pos doutorado') || norm.includes('pos-doutorado')) {
      return 'ORIENTACOES-CONCLUIDAS-PARA-POS-DOUTORADO';
    }
    if (norm.includes('doutorado') || norm.includes('tese')) {
      return 'ORIENTACOES-CONCLUIDAS-PARA-DOUTORADO';
    }
    if (norm.includes('mestrado') || norm.includes('dissertacao')) {
      return 'ORIENTACOES-CONCLUIDAS-PARA-MESTRADO';
    }
    return 'OUTRAS-ORIENTACOES-CONCLUIDAS';
  }

  return defaultTipo;
}

/**
 * Gera uma citação bibliográfica simplificada a partir do nome do autor (ex: "Silva, João" -> "SILVA, J.").
 */
export function formatAuthorCitation(name) {
  if (!name) return '';
  const clean = name.trim();
  if (clean.includes(',')) {
    const [last, ...firstParts] = clean.split(',');
    const initials = firstParts
      .join(' ')
      .trim()
      .split(/\s+/)
      .map((p) => (p ? p[0].toUpperCase() + '.' : ''))
      .join(' ');
    return `${last.trim().toUpperCase()}, ${initials || firstParts.join(' ').trim()}`;
  }
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].toUpperCase();
  const last = parts[parts.length - 1];
  const firstInitials = parts
    .slice(0, parts.length - 1)
    .map((p) => p[0].toUpperCase() + '.')
    .join(' ');
  return `${last.toUpperCase()}, ${firstInitials}`;
}

/**
 * Converte string com múltiplos autores para um array estruturado.
 * Suporta separadores comuns: ponto e vírgula (;), ' e ', ' and ', '|', ou vírgulas.
 */
export function parseSpreadsheetAuthors(authorsStr) {
  if (!authorsStr) return [];
  const raw = String(authorsStr).trim();
  if (!raw) return [];

  let names = [];

  if (raw.includes(';')) {
    names = raw.split(';').map((s) => s.trim()).filter(Boolean);
  } else if (raw.includes('|')) {
    names = raw.split('|').map((s) => s.trim()).filter(Boolean);
  } else if (/\s+(?:e|and)\s+/i.test(raw)) {
    names = raw.split(/\s+(?:e|and)\s+/i).map((s) => s.trim()).filter(Boolean);
  } else if (raw.includes(',')) {
    // Se tiver vírgula, checa se são no formato "Sobrenome, Nome" repetido ou nomes separados por vírgula
    const commaParts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    // Se número de partes for par e cada par parecer "Sobrenome, Nome":
    if (commaParts.length > 2 && commaParts.length % 2 === 0) {
      for (let i = 0; i < commaParts.length; i += 2) {
        names.push(`${commaParts[i]}, ${commaParts[i + 1]}`);
      }
    } else {
      names = commaParts;
    }
  } else {
    names = [raw];
  }

  return names.map((name, idx) => ({
    nome: name,
    nome_autor: name,
    citacao: formatAuthorCitation(name),
    nome_citacao: formatAuthorCitation(name),
    ordem: idx + 1,
    id_cnpq: '',
    id_lattes: '',
  }));
}

/**
 * Lê o arquivo de planilha (Excel ou CSV) a partir de um ArrayBuffer e extrai as linhas e cabeçalhos.
 */
export function parseSpreadsheetBuffer(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames || [];

  if (sheetNames.length === 0) {
    throw new Error('A planilha está vazia ou não possui nenhuma aba.');
  }

  const firstSheetName = sheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Converte a aba para matriz de células (linhas x colunas)
  const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!matrix || matrix.length === 0) {
    throw new Error('Nenhum dado encontrado na primeira aba da planilha.');
  }

  // Encontra a linha de cabeçalho (primeira linha não vazia que tenha pelo menos 1 texto)
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(matrix.length, 10); i++) {
    const row = matrix[i];
    if (Array.isArray(row) && row.some((cell) => String(cell).trim().length > 0)) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('Não foi possível identificar o cabeçalho das colunas na planilha.');
  }

  const rawHeaders = matrix[headerRowIndex].map((col, idx) => {
    const val = String(col || '').trim();
    return val || `Coluna ${idx + 1}`;
  });

  // Linhas de dados a partir da linha seguinte ao cabeçalho
  const dataRows = [];
  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const rowData = matrix[r];
    if (!Array.isArray(rowData)) continue;

    // Se toda a linha for vazia, ignora
    const hasAnyContent = rowData.some((cell) => cell != null && String(cell).trim() !== '');
    if (!hasAnyContent) continue;

    const rowObj = {};
    rawHeaders.forEach((header, cIdx) => {
      rowObj[header] = rowData[cIdx] != null ? rowData[cIdx] : '';
    });
    dataRows.push(rowObj);
  }

  const initialMapping = detectColumnMapping(rawHeaders);

  return {
    sheetNames,
    activeSheet: firstSheetName,
    headers: rawHeaders,
    rows: dataRows,
    initialMapping,
    totalRows: dataRows.length,
  };
}

/**
 * Converte as linhas da planilha mapeadas para o array de produções compatível com o Magic Lattes.
 */
export function convertSpreadsheetRowsToProducoes(
  rows,
  columnMapping,
  defaultTipo = 'ARTIGO-PUBLICADO'
) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { producoes: [], totalIgnoredWithoutTitle: 0 };
  }

  const producoes = [];
  let totalIgnoredWithoutTitle = 0;

  rows.forEach((row, index) => {
    const getVal = (key) => {
      const colName = columnMapping[key];
      if (!colName || row[colName] == null) return '';
      return String(row[colName]).trim();
    };

    const rawTitulo = getVal('titulo');
    if (!rawTitulo) {
      totalIgnoredWithoutTitle += 1;
      return;
    }

    const rawAno = extractYearString(getVal('ano'));
    const rawTipo = mapSpreadsheetTypeToLattes(getVal('tipo'), defaultTipo);
    const rawDoi = extractDoiString(getVal('doi'));
    const rawVeiculo = getVal('veiculo');
    const rawAutoresStr = getVal('autores');
    const rawVolume = getVal('volume').replace(/\.0$/, '');
    const rawFasciculo = getVal('fasciculo').replace(/\.0$/, '');
    const rawIssn = getVal('issn');
    const rawIsbn = getVal('isbn');
    const rawResumo = getVal('resumo');
    const { paginaInicial, paginaFinal } = extractPageInterval(getVal('paginas'));

    const autores = parseSpreadsheetAuthors(rawAutoresStr);

    const producao = {
      tipo: rawTipo,
      origem_importacao: 'planilha',
      linha_planilha: index + 2,
      titulo: rawTitulo,
      ano: rawAno,
      doi: rawDoi,
      dados_basicos: {
        'TITULO-DO-ARTIGO': rawTitulo,
        'TITULO-DO-TRABALHO': rawTitulo,
        'TITULO-DO-LIVRO': rawTitulo,
        'TITULO-DO-CAPITULO-DO-LIVRO': rawTitulo,
        'TITULO-DO-TEXTO': rawTitulo,
        'TITULO-DO-SOFTWARE': rawTitulo,
        TITULO: rawTitulo,
        titulo: rawTitulo,
        'ANO-DO-ARTIGO': rawAno,
        'ANO-DO-TRABALHO': rawAno,
        'ANO-DO-TEXTO': rawAno,
        ANO: rawAno,
        ano: rawAno,
        DOI: rawDoi,
        doi: rawDoi,
        NATUREZA: 'COMPLETO',
        'PAIS-DE-PUBLICACAO': 'Brasil',
        'PAIS-DO-EVENTO': 'Brasil',
        PAIS: 'Brasil',
        IDIOMA: 'Português',
        'MEIO-DE-DIVULGACAO': 'IMPRESSO',
        'FLAG-RELEVANCIA': 'NAO',
        'FLAG-DIVULGACAO-CIENTIFICA': 'NAO',
        RESUMO: rawResumo,
        resumo: rawResumo,
      },
      detalhamento: {
        'TITULO-DO-PERIODICO-OU-REVISTA': rawVeiculo,
        'NOME-DO-EVENTO': rawVeiculo,
        'TITULO-DO-LIVRO': rawVeiculo,
        'TITULO-DOS-ANAIS-OU-PROCEEDINGS': rawVeiculo,
        'TITULO-DO-JORNAL-OU-REVISTA': rawVeiculo,
        FINALIDADE: rawVeiculo,
        VOLUME: rawVolume,
        FASCICULO: rawFasciculo,
        ISSN: rawIssn,
        ISBN: rawIsbn,
        'PAGINA-INICIAL': paginaInicial,
        'PAGINA-FINAL': paginaFinal,
        'CLASSIFICACAO-DO-EVENTO': 'NAO_INFORMADO',
        'ANO-DE-REALIZACAO': rawAno,
      },
      autores,
      autoresDetalhados: autores.map((a) => ({
        nome_autor: a.nome,
        nome_citacao: a.citacao,
        id_lattes: '',
        email: '',
        instituicao: '',
        ordem: a.ordem,
      })),
      veiculo: rawVeiculo,
      periodico: rawVeiculo,
      volume: rawVolume,
      fasciculo: rawFasciculo,
      issn: rawIssn,
      isbn: rawIsbn,
      resumo: rawResumo,
    };

    producoes.push(producao);
  });

  return {
    producoes,
    totalIgnoredWithoutTitle,
  };
}
