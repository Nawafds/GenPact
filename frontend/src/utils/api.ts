import type { ContractInputs } from '../types/contract';

export interface GenerateContractRequest extends ContractInputs {
  index_name: string[];
}

export interface GenerateContractResponse {
  llm_response?: string;
  contract?: string;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export async function generateContractAPI(
  inputs: ContractInputs,
  indexName: string[] = ['1762885457669_uat_contracts']
): Promise<string> {
  const url = `${API_BASE_URL}/generate-contract`;
  
  const requestBody: GenerateContractRequest = {
    ...inputs,
    index_name: indexName,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle error responses
    if (data.error) {
      throw new Error(data.error);
    }

    // Try different possible response field names (check llm_response first as it's the actual API response)
    if (data.llm_response) {
      return data.llm_response;
    }
    
    if (data.contract) {
      return data.contract;
    }
    
    if (data.text) {
      return data.text;
    }
    
    if (data.content) {
      return data.content;
    }
    
    if (data.result) {
      return data.result;
    }

    // If the response is directly a string
    if (typeof data === 'string') {
      return data;
    }

    // If response has a message field that might contain the contract
    if (data.message && typeof data.message === 'string') {
      return data.message;
    }

    throw new Error('Invalid response format from API. Expected contract text in response.');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate contract');
  }
}

