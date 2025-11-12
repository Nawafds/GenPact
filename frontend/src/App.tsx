import { useState } from 'react';
import ContractInputForm from './components/ContractInputForm';
import ContractEditor from './components/ContractEditor';
import LLMHelper from './components/LLMHelper';
import { generateContractAPI } from './utils/api';
import type { ContractInputs } from './types/contract';
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
    
    try {
      const generatedContract = await generateContractAPI(inputs);
      setContract(generatedContract);
      setViewMode('editor');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate contract. Please try again.';
      setError(errorMessage);
      console.error('Error generating contract:', err);
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
        <h1>Contract Generator Platform</h1>
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
              <div className="error-message" style={{
                maxWidth: '900px',
                margin: '0 auto 1rem',
                padding: '1rem',
                backgroundColor: '#fee',
                border: '2px solid #fcc',
                borderRadius: '8px',
                color: '#c33',
              }}>
                <strong>Error:</strong> {error}
              </div>
            )}
            <ContractInputForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </>
        ) : (
          <div className="editor-container">
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
