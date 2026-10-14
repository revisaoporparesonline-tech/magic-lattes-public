import { useState } from 'react';
import { PIX_CONFIG } from '../../config/pixConfig';
import { buildPixPayload } from '../../utils/pixUtils';

export function CoffeePage({ onBack }) {
  const [selectedValor, setSelectedValor] = useState(null); // null = valor livre
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const pixPayload = buildPixPayload({
    chave: PIX_CONFIG.chave,
    nome: PIX_CONFIG.beneficiario,
    cidade: PIX_CONFIG.cidade,
    valor: selectedValor,
  });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
    pixPayload
  )}`;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(PIX_CONFIG.chave);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Botões Superiores de Navegação */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-all cursor-pointer shadow-2xs"
        >
          <span>←</span>
          <span>Voltar ao Magic Lattes</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={PIX_CONFIG.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-2xs"
            title="Acessar repositório no GitHub"
          >
            <svg className="w-4 h-4 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>GitHub</span>
            <span className="text-slate-400">↗</span>
          </a>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <span>☕</span> Apoio ao Desenvolvedor
          </span>
        </div>
      </div>

      {/* Cabeçalho de Agradecimento */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 text-3xl shadow-xs border border-amber-200 mb-1">
          ☕
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Me pague um café se lhe foi útil!
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          O <strong>Magic Lattes</strong> é uma ferramenta gratuita e de código aberto criada para
          poupar horas de trabalho manual e frustrações com o preenchimento de produções no CNPq.
          Se ela economizou seu tempo, considere contribuir com um cafezinho!
        </p>
      </div>

      {/* Seleção de Valor Sugerido */}
      <div className="max-w-xl mx-auto space-y-2">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
          Escolha uma sugestão de café (ou defina no app do seu banco):
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PIX_CONFIG.sugestoes.map((sug) => {
            const isSelected = selectedValor === sug.valor;
            return (
              <button
                key={sug.valor}
                type="button"
                onClick={() => setSelectedValor(isSelected ? null : sug.valor)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400 font-bold text-amber-950 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-sm font-bold">{sug.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{sug.descricao}</div>
              </button>
            );
          })}
        </div>
        {selectedValor && (
          <p className="text-center text-xs text-amber-700 font-medium">
            Valor pré-configurado no QR Code: <strong>R$ {selectedValor},00</strong> (
            <button
              type="button"
              onClick={() => setSelectedValor(null)}
              className="underline text-amber-800 hover:text-amber-950 cursor-pointer"
            >
              mudar para valor livre
            </button>
            )
          </p>
        )}
      </div>

      {/* Card Principal do PIX */}
      <div className="max-w-xl mx-auto rounded-2xl border border-amber-200 bg-linear-to-b from-amber-50/50 to-white p-6 sm:p-8 shadow-xs space-y-6">
        {/* QR Code */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-white rounded-2xl border border-amber-200 shadow-xs">
            <img
              src={qrCodeUrl}
              alt="QR Code PIX para pagamento"
              className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
              loading="lazy"
            />
          </div>
          <p className="text-xs text-slate-500 text-center">
            Abra o app do seu banco, escolha <strong>Pagar com Pix</strong> e aponte a câmera para
            o QR Code.
          </p>
        </div>

        {/* Chave Pix Direta */}
        <div className="space-y-2 pt-2 border-t border-amber-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Chave PIX ({PIX_CONFIG.tipoChave}):</span>
            <span className="text-slate-500 font-medium">Beneficiário: {PIX_CONFIG.beneficiario}</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={PIX_CONFIG.chave}
              className="grow px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs text-slate-800 select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyKey}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              {copiedKey ? '✓ Chave Copiada!' : 'Copiar Chave'}
            </button>
          </div>
        </div>

        {/* Pix Copia e Cola */}
        <div className="space-y-2 pt-2 border-t border-amber-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Código Pix Copia e Cola:</span>
            <span className="text-[11px] text-slate-400 font-mono">Padrão Banco Central</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={pixPayload}
              className="grow px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-mono text-[11px] text-slate-600 truncate select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyPayload}
              className="shrink-0 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              {copiedPayload ? '✓ Copiado!' : 'Copiar Código'}
            </button>
          </div>
        </div>
      </div>

      {/* Card com Link para o GitHub */}
      <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Código Aberto no GitHub
            </h4>
            <p className="text-[11px] text-slate-500">
              magic-lattes-public • Deixe uma estrela ⭐ ou contribua com melhorias
            </p>
          </div>
        </div>

        <a
          href={PIX_CONFIG.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs shrink-0"
        >
          <span>Abrir Repositório</span>
          <span>↗</span>
        </a>
      </div>

      {/* Por que apoiar */}
      <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs text-slate-600">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-base mb-1">⚡</div>
          <strong className="text-slate-800 block mb-0.5">100% Gratuito</strong>
          <span>Código livre para a comunidade acadêmica.</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-base mb-1">🔒</div>
          <strong className="text-slate-800 block mb-0.5">Privacidade Total</strong>
          <span>Processado no seu browser, sem rastreamento.</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-base mb-1">❤️</div>
          <strong className="text-slate-800 block mb-0.5">Feito com Cuidado</strong>
          <span>Desenvolvido para economizar o tempo de quem pesquisa.</span>
        </div>
      </div>

      {/* Botão de Rodapé para Retornar */}
      <div className="pt-4 text-center">
        <button
          type="button"
          onClick={onBack}
          className="py-3 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
        >
          ← Continuar usando o Magic Lattes
        </button>
      </div>
    </div>
  );
}
