/**
 * Dispara o download de um objeto Blob no navegador.
 */
export function downloadBlob(blob, filename) {
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Serializa dados em JSON formatado e inicia o download do arquivo .json.
 */
export function downloadJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  downloadBlob(blob, filename);
}

/**
 * Copia um objeto/array serializado em JSON para a área de transferência.
 */
export async function copyJsonToClipboard(data) {
  await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
}

