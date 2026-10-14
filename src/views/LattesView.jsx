import { useState, useEffect } from 'react';
import { AppHeader } from '../components/layout/AppHeader';
import { StepperNav } from '../components/layout/StepperNav';
import { StatusBanner } from '../components/layout/StatusBanner';
import { Step1PreprocessXml } from '../components/steps/Step1PreprocessXml';
import { Step2JsonInput } from '../components/steps/Step2JsonInput';
import { Step3ConflictReview } from '../components/steps/Step3ConflictReview';
import { Step4ExportXml } from '../components/steps/Step4ExportXml';
import { Step5RemoteBatches } from '../components/steps/Step5RemoteBatches';
import { CoffeePage } from '../components/coffee/CoffeePage';
import { LattesTutorialModal } from '../components/tutorial/LattesTutorialModal';

export function LattesView({
  currentStep,
  goToStep,
  xmlFile,
  preprocessedLattes,
  handleSelectXmlFile,
  jsonText,
  setJsonText,
  handleAnalyzeJson,
  handleAnalyzeProducoes,
  analyzedItems,
  toggleItemSelection,
  handlePrepareExport,
  exportResult,
  handleDownloadXml,
  handleOpenBatchesStep,
  enviarRevisaoOnline = false,
  setEnviarRevisaoOnline,
  remoteConfig,
  updateRemoteConfig,
  batchItems,
  toggleBatchItemSelection,
  toggleYearBatchSelection,
  updateBatchItemCustomPayload,
  getEffectivePayloadForItem,
  isSendingBatch,
  activeSendingYear,
  handleSendSingleItem,
  handleSendBatchList,
  handleCopyYearBatchJson,
  handleDownloadYearBatchJson,
  statusMessage,
  statusType,
  isLoading,
}) {
  const [isCoffeeOpen, setIsCoffeeOpen] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.location.hash === '#cafe' || window.location.hash === '#coffee')
  );

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialTab, setTutorialTab] = useState('export'); // 'export' | 'import'

  useEffect(() => {
    const onHashChange = () => {
      setIsCoffeeOpen(
        window.location.hash === '#cafe' || window.location.hash === '#coffee'
      );
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleOpenCoffee = () => {
    setIsCoffeeOpen(true);
    if (typeof window !== 'undefined') {
      window.location.hash = 'cafe';
    }
  };

  const handleCloseCoffee = () => {
    setIsCoffeeOpen(false);
    if (
      typeof window !== 'undefined' &&
      (window.location.hash === '#cafe' || window.location.hash === '#coffee')
    ) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleOpenTutorial = (tab = 'export') => {
    setTutorialTab(tab);
    setIsTutorialOpen(true);
  };

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <AppHeader
          onOpenCoffee={handleOpenCoffee}
          isCoffeeOpen={isCoffeeOpen}
          onOpenTutorial={handleOpenTutorial}
        />

        {isCoffeeOpen ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <CoffeePage onBack={handleCloseCoffee} />
          </div>
        ) : (
          <>
            <StepperNav
              currentStep={currentStep}
              goToStep={goToStep}
              hasPreprocessedLattes={!!preprocessedLattes}
              hasAnalyzedItems={analyzedItems.length > 0}
              hasExportResult={!!exportResult}
              enviarRevisaoOnline={enviarRevisaoOnline}
            />

            <StatusBanner statusType={statusType} statusMessage={statusMessage} />

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              {currentStep === 1 && (
                <Step1PreprocessXml
                  xmlFile={xmlFile}
                  preprocessedLattes={preprocessedLattes}
                  handleSelectXmlFile={handleSelectXmlFile}
                  handleOpenBatchesStep={handleOpenBatchesStep}
                  goToStep={goToStep}
                  onOpenTutorial={handleOpenTutorial}
                  enviarRevisaoOnline={enviarRevisaoOnline}
                  setEnviarRevisaoOnline={setEnviarRevisaoOnline}
                />
              )}

              {currentStep === 2 && (
                <Step2JsonInput
                  jsonText={jsonText}
                  setJsonText={setJsonText}
                  handleAnalyzeJson={handleAnalyzeJson}
                  handleAnalyzeProducoes={handleAnalyzeProducoes}
                  handleOpenBatchesStep={handleOpenBatchesStep}
                  goToStep={goToStep}
                  isLoading={isLoading}
                  enviarRevisaoOnline={enviarRevisaoOnline}
                />
              )}

              {currentStep === 3 && (
                <Step3ConflictReview
                  analyzedItems={analyzedItems}
                  toggleItemSelection={toggleItemSelection}
                  handlePrepareExport={handlePrepareExport}
                  handleOpenBatchesStep={handleOpenBatchesStep}
                  goToStep={goToStep}
                  enviarRevisaoOnline={enviarRevisaoOnline}
                />
              )}

              {currentStep === 4 && (
                <Step4ExportXml
                  exportResult={exportResult}
                  analyzedItems={analyzedItems}
                  handleDownloadXml={handleDownloadXml}
                  handleOpenBatchesStep={handleOpenBatchesStep}
                  goToStep={goToStep}
                  onOpenCoffee={handleOpenCoffee}
                  onOpenTutorial={handleOpenTutorial}
                  enviarRevisaoOnline={enviarRevisaoOnline}
                  setEnviarRevisaoOnline={setEnviarRevisaoOnline}
                />
              )}

              {currentStep === 5 && (
                <Step5RemoteBatches
                  preprocessedLattes={preprocessedLattes}
                  analyzedItems={analyzedItems}
                  exportResult={exportResult}
                  remoteConfig={remoteConfig}
                  updateRemoteConfig={updateRemoteConfig}
                  batchItems={batchItems}
                  toggleBatchItemSelection={toggleBatchItemSelection}
                  toggleYearBatchSelection={toggleYearBatchSelection}
                  updateBatchItemCustomPayload={updateBatchItemCustomPayload}
                  getEffectivePayloadForItem={getEffectivePayloadForItem}
                  isSendingBatch={isSendingBatch}
                  activeSendingYear={activeSendingYear}
                  handleSendSingleItem={handleSendSingleItem}
                  handleSendBatchList={handleSendBatchList}
                  handleCopyYearBatchJson={handleCopyYearBatchJson}
                  handleDownloadYearBatchJson={handleDownloadYearBatchJson}
                  goToStep={goToStep}
                />
              )}
            </div>
          </>
        )}

        {/* Modal de Tutorial */}
        <LattesTutorialModal
          isOpen={isTutorialOpen}
          onClose={handleCloseTutorial}
          initialTab={tutorialTab}
        />

        <footer className="mt-8 text-center text-xs text-slate-400 space-y-1.5">
          <p>
            Processamento executado 100% no cliente.
            {enviarRevisaoOnline
              ? ' Envios de lote na Etapa 5 conectam-se diretamente ao endpoint configurado.'
              : ''}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => handleOpenTutorial('export')}
              className="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
            >
              📖 Tutorial: Exportar e Importar no Lattes
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleOpenCoffee}
              className="text-amber-700 hover:text-amber-800 underline font-semibold cursor-pointer"
            >
              ☕ Me pague um café com PIX
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}