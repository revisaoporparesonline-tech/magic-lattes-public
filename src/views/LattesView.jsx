import { AppHeader } from '../components/layout/AppHeader';
import { StepperNav } from '../components/layout/StepperNav';
import { StatusBanner } from '../components/layout/StatusBanner';
import { Step1PreprocessXml } from '../components/steps/Step1PreprocessXml';
import { Step2JsonInput } from '../components/steps/Step2JsonInput';
import { Step3ConflictReview } from '../components/steps/Step3ConflictReview';
import { Step4ExportXml } from '../components/steps/Step4ExportXml';
import { Step5RemoteBatches } from '../components/steps/Step5RemoteBatches';

export function LattesView({
  currentStep,
  goToStep,
  xmlFile,
  preprocessedLattes,
  handleSelectXmlFile,
  jsonText,
  setJsonText,
  handleAnalyzeJson,
  analyzedItems,
  toggleItemSelection,
  handlePrepareExport,
  exportResult,
  handleDownloadXml,
  handleOpenBatchesStep,
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
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <AppHeader />

        <StepperNav
          currentStep={currentStep}
          goToStep={goToStep}
          hasPreprocessedLattes={!!preprocessedLattes}
          hasAnalyzedItems={analyzedItems.length > 0}
          hasExportResult={!!exportResult}
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
            />
          )}

          {currentStep === 2 && (
            <Step2JsonInput
              jsonText={jsonText}
              setJsonText={setJsonText}
              handleAnalyzeJson={handleAnalyzeJson}
              handleOpenBatchesStep={handleOpenBatchesStep}
              goToStep={goToStep}
              isLoading={isLoading}
            />
          )}

          {currentStep === 3 && (
            <Step3ConflictReview
              analyzedItems={analyzedItems}
              toggleItemSelection={toggleItemSelection}
              handlePrepareExport={handlePrepareExport}
              handleOpenBatchesStep={handleOpenBatchesStep}
              goToStep={goToStep}
            />
          )}

          {currentStep === 4 && (
            <Step4ExportXml
              exportResult={exportResult}
              analyzedItems={analyzedItems}
              handleDownloadXml={handleDownloadXml}
              handleOpenBatchesStep={handleOpenBatchesStep}
              goToStep={goToStep}
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

        <footer className="mt-8 text-center text-xs text-slate-400">
          Processamento executado 100% no cliente. Envios de lote na Etapa 5 conectam-se diretamente ao endpoint configurado.
        </footer>
      </div>
    </main>
  );
}