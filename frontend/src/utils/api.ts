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

/**
 * Streams contract generation from the API and calls onChunk for each delta received.
 * Returns a promise that resolves when the stream completes.
 */
export async function generateContractStreamAPI(
  inputs: ContractInputs,
  onChunk: (delta: string) => void,
  indexName: string[] = ['1762885457669_uat_contracts']
): Promise<void> {
  const url = `${API_BASE_URL}/generate-contract-stream`;
  
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

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages from buffer
        // SSE format: lines starting with "data: " contain the actual data
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6); // Remove 'data: ' prefix
            
            if (dataStr.trim()) {
              try {
                const data = JSON.parse(dataStr);
                
                // Extract delta from the data object
                if (data.delta && typeof data.delta === 'string') {
                  onChunk(data.delta);
                }
                // Skip metadata messages (they don't have delta)
              } catch (e) {
                // If JSON parsing fails, it might be a non-JSON data line, skip it
                // This is normal for some SSE messages
              }
            }
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);
          if (dataStr.trim()) {
            try {
              const data = JSON.parse(dataStr);
              if (data.delta && typeof data.delta === 'string') {
                onChunk(data.delta);
              }
            } catch (e) {
              // Ignore parse errors for remaining data
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to stream contract');
  }
}

export interface LLMHelperRequest {
  title: string;
  body: string;
  user_prompt: string;
  index_name?: string[];
}

/**
 * Streams LLM helper response for a contract section and calls onChunk for each delta received.
 * Returns a promise that resolves when the stream completes.
 */
export async function llmHelperStreamAPI(
  request: LLMHelperRequest,
  onChunk: (delta: string) => void
): Promise<void> {
  const url = `${API_BASE_URL}/llm-helper-stream`;
  
  const requestBody: LLMHelperRequest = {
    title: request.title,
    body: request.body,
    user_prompt: request.user_prompt,
    index_name: request.index_name || ['1763159365603_uat_llama'],
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
      throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages from buffer
        // SSE format: lines starting with "data: " contain the actual data
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6); // Remove 'data: ' prefix
            
            if (dataStr.trim()) {
              try {
                const data = JSON.parse(dataStr);
                
                // Extract delta from the data object
                if (data.delta && typeof data.delta === 'string') {
                  onChunk(data.delta);
                }
                // Skip metadata messages (they don't have delta)
              } catch (e) {
                // If JSON parsing fails, it might be a non-JSON data line, skip it
                // This is normal for some SSE messages
              }
            }
          } else if (trimmed && !trimmed.startsWith('event:') && !trimmed.startsWith('id:')) {
            // Handle plain text chunks (if the API sends raw text)
            onChunk(trimmed);
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);
          if (dataStr.trim()) {
            try {
              const data = JSON.parse(dataStr);
              if (data.delta && typeof data.delta === 'string') {
                onChunk(data.delta);
              }
            } catch (e) {
              // Ignore parse errors for remaining data
            }
          }
        } else if (trimmed && !trimmed.startsWith('event:') && !trimmed.startsWith('id:')) {
          onChunk(trimmed);
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to stream LLM helper response');
  }
}

