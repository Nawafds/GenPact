import { useState } from 'react';
import ContractInputForm from './components/ContractInputForm';
import ContractEditor from './components/ContractEditor';
import { generateContractStreamAPI } from './utils/api';
import type { ContractInputs } from './types/contract';
import GenPactLogo from './assets/GenPact.svg';
import './App.css';

type ViewMode = 'input' | 'editor';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [contract, setContract] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (inputs: ContractInputs) => {
    setIsLoading(true);
    setError(null);
    setContract(''); // Clear previous contract
    setViewMode('editor'); // Switch to editor view immediately to show streaming
    
    try {
      // Stream the contract generation
      await generateContractStreamAPI(
        inputs,
        (delta: string) => {
          // Append each delta to the contract
          setContract(prev => prev + delta);
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate contract. Please try again.';
      setError(errorMessage);
      console.error('Error generating contract:', err);
      // Optionally switch back to input view on error
      // setViewMode('input');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToInput = () => {
    setViewMode('input');
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-content">
          <img src={GenPactLogo} alt="GenPact" className="app-header-logo" />
          <h1>GenPact</h1>
        </div>
        {viewMode === 'editor' && (
          <button onClick={handleBackToInput} className="back-button">
            ← Create New Contract
          </button>
        )}
      </header>

      <main className="app-main">
        {viewMode === 'input' ? (
          <>
            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}
            <div className="form-container">
              {isLoading && (
                <div className="loading-overlay">
                  <div className="spinner"></div>
                  <p className="loading-text">Generating Contract...</p>
                </div>
              )}
              <ContractInputForm onSubmit={handleFormSubmit} isLoading={isLoading} />
            </div>
          </>
        ) : (
          <div className="editor-container">
            {isLoading && (
              <div className="streaming-indicator">
                <div className="spinner"></div>
                <p className="loading-text">Generating contract...</p>
              </div>
            )}
            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}
            <div className="editor-panel">
              <ContractEditor contract={contract} onContractChange={setContract} />
            </div>
            {/* <div className="helper-panel">
              <LLMHelper contract={contract} />
            </div> */}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
