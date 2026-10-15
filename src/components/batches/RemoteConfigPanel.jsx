export function RemoteConfigPanel({
  remoteConfig,
  updateRemoteConfig,
  pesquisador,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Configuração do Serviço Remoto (Cadastrar Artigo Lattes)
        </h3>
        {pesquisador && (
          <span className="text-xs text-slate-500">
            Titular detectado: <strong>{pesquisador.nomeCompleto}</strong>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Endpoint URL (POST)
          </label>
          <input
            type="text"
            value={remoteConfig.apiUrl}
            onChange={(e) => updateRemoteConfig('apiUrl', e.target.value)}
            placeholder="http://localhost/api/remote/publicacao"
            className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Bearer Token (auth:bearer)
          </label>
          <input
            type="text"
            value={remoteConfig.bearerToken}
            onChange={(e) => updateRemoteConfig('bearerToken', e.target.value)}
            placeholder="Sua chave aqui"
            className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            ID do Usuário Titular (<code>usuario_id</code>)
          </label>
          <input
            type="number"
            min="1"
            value={remoteConfig.usuarioId}
            onChange={(e) => updateRemoteConfig('usuarioId', e.target.value)}
            className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Função do Titular (<code>funcao</code>)
          </label>
          <input
            type="text"
            value={remoteConfig.funcaoTitular}
            onChange={(e) => updateRemoteConfig('funcaoTitular', e.target.value)}
            placeholder="Autor Principal"
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Projetos IDs (<code>projetos_ids</code>)
          </label>
          <input
            type="text"
            value={remoteConfig.projetosIdsText}
            onChange={(e) => updateRemoteConfig('projetosIdsText', e.target.value)}
            placeholder="1, 2"
            className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Campo <code>tipo</code> no Payload
          </label>
          <select
            value={remoteConfig.forceTipo}
            onChange={(e) => updateRemoteConfig('forceTipo', e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Automático conforme Lattes</option>
            <option value="periodico">Forçar &quot;periodico&quot;</option>
            <option value="evento">Forçar &quot;evento&quot;</option>
            <option value="livro">Forçar &quot;livro&quot;</option>
            <option value="capitulo">Forçar &quot;capitulo&quot;</option>
            <option value="orientacao">Forçar &quot;orientacao&quot;</option>
            <option value="tecnico">Forçar &quot;tecnico&quot;</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
        <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={remoteConfig.vincularTitular}
            onChange={(e) => updateRemoteConfig('vincularTitular', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            Converter autor titular (<strong>{pesquisador?.nomeCompleto}</strong>) para{' '}
            <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">
              {`{ "usuario_id": ${Number(remoteConfig.usuarioId) || 1}, "funcao": "${remoteConfig.funcaoTitular}", "ordem": N }`}
            </code>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={remoteConfig.filterOrigem}
            onChange={(e) => updateRemoteConfig('filterOrigem', e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">Origem: Todas (XML + Novos JSON)</option>
            <option value="novo_json">Origem: Apenas Novos do JSON</option>
            <option value="xml">Origem: Apenas Já no XML</option>
          </select>

          <select
            value={remoteConfig.filterTipo}
            onChange={(e) => updateRemoteConfig('filterTipo', e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">Tipo: Todos</option>
            <option value="periodico">Tipo: periodico</option>
            <option value="evento">Tipo: evento</option>
            <option value="livro">Tipo: livro</option>
            <option value="capitulo">Tipo: capitulo</option>
            <option value="orientacao">Tipo: orientacao</option>
            <option value="revista">Tipo: revista</option>
            <option value="software">Tipo: software</option>
            <option value="tecnico">Tipo: tecnico</option>
          </select>
        </div>
      </div>
    </div>
  );
}

