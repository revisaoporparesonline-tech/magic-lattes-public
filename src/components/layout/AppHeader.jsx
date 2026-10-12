export function AppHeader() {
  return (
    <header className="text-center mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-3">
        Compatível com LMPLCurriculo.DTD • ISO-8859-1 • Integração API Remota
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        Lattes Sync &amp; Merger
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Pré-processe seu currículo Lattes, compare possíveis duplicatas, exporte produções inéditas e envie lotes por ano para a API.
      </p>
    </header>
  );
}

