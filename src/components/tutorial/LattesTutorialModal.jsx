import { useState } from 'react';
import botaoImportarImg from '../../assets/botao-importar.jpeg';

export function LattesTutorialModal({ isOpen, onClose, initialTab = 'export' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'export' | 'import'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
              📖
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tutorial do Lattes: Como Exportar e Importar
              </h2>
              <p className="text-xs text-slate-500">
                Passo a passo detalhado para professores e pesquisadores no CNPq
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Abas do Tutorial */}
        <div className="flex border-b border-slate-200 bg-slate-100/75 px-6 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg border-t border-x border-slate-200'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📤</span>
            <span>1. Como Exportar o XML do Lattes</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">
              Para a Etapa 1
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg border-t border-x border-slate-200'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📥</span>
            <span>2. Como Importar o XML no Lattes</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono">
              Após a Etapa 4
            </span>
          </button>
        </div>

        {/* Conteúdo Rolável */}
        <div className="overflow-y-auto p-6 space-y-5 text-sm text-slate-700 leading-relaxed">
          {activeTab === 'export' ? (
            /* ABA 1: COMO EXPORTAR DO LATTES */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900">
                <strong>Objetivo:</strong> Obter o arquivo XML do seu currículo atual da Plataforma Lattes para carregar na <strong>Etapa 1</strong> deste sistema. Assim, o Magic Lattes sabe tudo o que você já tem cadastrado e evita duplicatas.
              </div>

              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900">Acesse a Plataforma Lattes</strong>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Entre em{' '}
                      <a
                        href="https://lattes.cnpq.br"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline font-semibold"
                      >
                        lattes.cnpq.br
                      </a>{' '}
                      e, no menu lateral direito, clique no botão azul <strong>&quot;Atualizar currículo&quot;</strong>. Faça o login com sua conta <strong>gov.br</strong> ou CPF/Senha.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900">Abra o menu &quot;Ferramentas&quot; &gt; &quot;Exportar&quot;</strong>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Na barra de menu horizontal superior do formulário do Lattes, clique em{' '}
                      <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                        Ferramentas
                      </span>{' '}
                      e depois escolha a opção{' '}
                      <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                        Exportar
                      </span>.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900">Selecione &quot;Formato XML&quot; e baixe</strong>
                    <p className="text-xs text-slate-600 mt-0.5">
                      O Lattes perguntará o formato. Escolha <strong>XML</strong>. O download começará automaticamente.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <strong className="text-slate-900">Se o arquivo veio em .ZIP (Muito Importante!)</strong>
                    <p className="text-xs text-slate-600 mt-0.5">
                      O CNPq costuma baixar o arquivo comprimido como um arquivo <code className="font-mono bg-amber-50 text-amber-900 px-1 rounded border border-amber-200">.zip</code> (por exemplo, <em>1234567890123456.zip</em>).
                    </p>
                    <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <p>
                        👉 <strong>O que fazer:</strong> Clique com o botão direito no arquivo baixado e selecione <strong>&quot;Extrair aqui&quot;</strong> (ou abra o zip e copie o arquivo <code className="font-mono">.xml</code> de dentro dele para sua pasta).
                      </p>
                      <p className="text-[11px] text-amber-800">
                        O Magic Lattes precisa do arquivo descompactado terminando em <strong>.xml</strong>.
                      </p>
                    </div>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    5
                  </span>
                  <div>
                    <strong className="text-slate-900">Carregue na Etapa 1 do Magic Lattes</strong>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Volte ao Magic Lattes e selecione ou arraste o seu arquivo <code className="font-mono text-xs bg-slate-100 px-1 rounded">.xml</code> na Etapa 1. Pronto! Suas produções serão indexadas em segundos.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          ) : (
            /* ABA 2: COMO IMPORTAR NO LATTES */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900">
                <strong>Objetivo:</strong> Colocar as novas produções que você selecionou no Magic Lattes diretamente dentro do seu currículo Lattes oficial, sem precisar digitar artigo por artigo manualmente.
              </div>

              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900">Baixe o arquivo gerado pelo Magic Lattes</strong>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Na <strong>Etapa 4</strong>, clique no botão verde <strong>&quot;⬇ Baixar lattes_novos_itens.xml&quot;</strong>. O arquivo será salvo na sua pasta de Downloads.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900">Abra a Plataforma Lattes para edição</strong>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Acesse{' '}
                      <a
                        href="https://lattes.cnpq.br"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline font-semibold"
                      >
                        lattes.cnpq.br
                      </a>{' '}
                      e entre em <strong>&quot;Atualizar currículo&quot;</strong>.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <div className="space-y-2">
                    <strong className="text-slate-900">Acesse o menu &quot;Ferramentas&quot; &gt; &quot;Importar&quot;</strong>
                    <p className="text-xs text-slate-600 mt-0.5">
                      No formulário de edição do Lattes, você pode ir em{' '}
                      <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                        Ferramentas
                      </span>{' '}
                      &gt;{' '}
                      <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                        Importar
                      </span>{' '}
                      ou clicar diretamente no ícone de <strong>Importar</strong> na barra lateral esquerda (destacado em vermelho abaixo):
                    </p>

                    <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-xs max-w-sm">
                      <img
                        src={botaoImportarImg}
                        alt="Botão Importar na barra lateral esquerda do Lattes"
                        className="w-full h-auto block"
                        loading="lazy"
                      />
                      <div className="px-3 py-1.5 bg-slate-100/90 border-t border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5">
                        <span>💡</span>
                        <span>Ícone de importação no menu lateral esquerdo do Lattes</span>
                      </div>
                    </div>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <strong className="text-slate-900">Selecione o arquivo e confirme</strong>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Escolha o arquivo <code className="font-mono text-xs bg-slate-100 px-1 rounded">lattes_novos_itens.xml</code> que você acabou de baixar e clique em <strong>Confirmar / Importar</strong>.
                    </p>
                    <p className="text-xs text-emerald-800 mt-1 font-medium">
                      ✓ <em>Fique tranquilo:</em> O Lattes apenas adicionará as novas publicações nas abas correspondentes (artigos, livros, congressos), <strong>sem apagar</strong> nada do que você já tinha cadastrado anteriormente!
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    5
                  </span>
                  <div>
                    <strong className="text-slate-900 text-red-700">
                      O Passo Mais Importante: Enviar o Currículo! ⚠️
                    </strong>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Ao importar o arquivo, os dados ficam salvos <strong>apenas em rascunho</strong> na sua sessão. Para que as publicações fiquem públicas e visíveis para a comunidade:
                    </p>
                    <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                      <p>
                        1. Localize o aviso em vermelho ou o botão <strong>&quot;Enviar Currículo&quot;</strong> no topo da página do Lattes.
                      </p>
                      <p>
                        2. Marque a caixa de aceite do termo de responsabilidade e clique em <strong>&quot;Enviar ao CNPq&quot;</strong>.
                      </p>
                    </div>
                  </div>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0">
          <a
            href="https://lattes.cnpq.br"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 font-semibold"
          >
            <span>Ir para Plataforma Lattes (lattes.cnpq.br)</span>
            <span>↗</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Entendi, fechar tutorial
          </button>
        </div>
      </div>
    </div>
  );
}

