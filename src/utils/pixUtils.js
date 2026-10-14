/**
 * Utilitário para gerar código PIX Copia e Cola no padrão EMVCo do Banco Central do Brasil.
 */

function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatEmvField(id, value) {
  const len = String(value.length).padStart(2, '0');
  return id + len + value;
}

/**
 * Constrói a string do código PIX Copia e Cola.
 */
export function buildPixPayload({
  chave,
  nome = 'Marcio',
  cidade = 'BRASIL',
  valor = null,
  txid = '***',
}) {
  const cleanKey = String(chave || '').trim();
  const cleanNome = String(nome || 'Marcio').slice(0, 25).toUpperCase();
  const cleanCidade = String(cidade || 'BRASIL').slice(0, 15).toUpperCase();

  const merchantAccount =
    formatEmvField('00', 'br.gov.bcb.pix') +
    formatEmvField('01', cleanKey);

  let payload =
    formatEmvField('00', '01') +
    formatEmvField('26', merchantAccount) +
    formatEmvField('52', '0000') +
    formatEmvField('53', '986') +
    (valor ? formatEmvField('54', Number(valor).toFixed(2)) : '') +
    formatEmvField('58', 'BR') +
    formatEmvField('59', cleanNome) +
    formatEmvField('60', cleanCidade) +
    formatEmvField('62', formatEmvField('05', txid)) +
    '6304';

  const crc = crc16(payload);
  return payload + crc;
}

