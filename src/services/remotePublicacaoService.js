/**
 * Envia uma única publicação para o endpoint remoto (ex: POST http://localhost/api/remote/publicacao)
 * com autenticação Bearer.
 */
export async function postRemotePublicacao({ apiUrl, bearerToken, payload }) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (bearerToken && bearerToken.trim()) {
    headers.Authorization = `Bearer ${bearerToken.trim()}`;
  }

  const response = await fetch(apiUrl.trim(), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  let responseDetail = '';
  try {
    const text = await response.text();
    if (text) {
      try {
        const data = JSON.parse(text);
        responseDetail = data.message || data.mensagem || data.error || data.id || '';
      } catch {
        responseDetail = text.slice(0, 120);
      }
    }
  } catch {
    // Ignora falha de leitura de corpo vazio
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}${responseDetail ? `: ${responseDetail}` : ''}`);
  }

  return {
    status: response.status,
    detail: responseDetail,
  };
}

