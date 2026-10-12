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
 * Extrai um atributo de uma string de atributos XML.
 */
export function getXmlAttr(tagOrAttrs, attrName) {
  const regex = new RegExp(`\\b${attrName}="([^"]*)"`, 'i');
  const m = tagOrAttrs.match(regex);
  return m ? unescapeXml(m[1]) : '';
}

/**
 * Decodifica um ArrayBuffer em string usando ISO-8859-1 (Latin-1).
 */
export function decodeIso88591Buffer(buffer) {
  const decoder = new TextDecoder('iso-8859-1');
  return decoder.decode(buffer);
}

/**
 * Codifica uma string XML em Blob binário estrito ISO-8859-1.
 */
export function encodeIso88591Blob(xmlString) {
  const sanitizado = sanitizeForLatin1(xmlString);
  const bytesIso = new Uint8Array(sanitizado.length);
  for (let i = 0; i < sanitizado.length; i++) {
    bytesIso[i] = sanitizado.charCodeAt(i) & 0xff;
  }
  const blob = new Blob([bytesIso], { type: 'text/xml;charset=ISO-8859-1' });
  return { blob, xmlString: sanitizado };
}

