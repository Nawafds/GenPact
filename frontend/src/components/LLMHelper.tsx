import { useState, useRef, useEffect } from 'react';
import { llmHelperStreamAPI } from '../utils/api';
import './LLMHelper.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LLMHelperProps {
  contract: string;
  selectedSection?: { title: string; body: string } | null;
}

// Default welcome message
const DEFAULT_WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: 'Hello! I\'m your contract assistant. Select a section of your contract, then ask me to help rephrase, improve, or explain it.',
};

export default function LLMHelper({ contract, selectedSection }: LLMHelperProps) {
  // Store chat history per section using a Map
  const [chatHistory, setChatHistory] = useState<Map<string, Message[]>>(new Map());
  const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get the current section key (used as identifier for chat history)
  const getSectionKey = (): string => {
    return selectedSection?.title || 'general';
  };

  // Load messages for the current section when selectedSection changes
  useEffect(() => {
    const sectionKey = getSectionKey();
    const sectionMessages = chatHistory.get(sectionKey);
    
    if (sectionMessages && sectionMessages.length > 0) {
      // Load existing chat history for this section
      setMessages(sectionMessages);
    } else {
      // Initialize with empty messages for new section, or default welcome for general
      if (selectedSection) {
        setMessages([]);
      } else {
        setMessages([DEFAULT_WELCOME_MESSAGE]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection?.title]); // Only reload when section changes, not when chatHistory updates

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentAssistantMessage]);

  // Helper function to save messages to chat history
  const saveMessagesToHistory = (sectionKey: string, newMessages: Message[]) => {
    setChatHistory(prev => {
      const newHistory = new Map(prev);
      newHistory.set(sectionKey, newMessages);
      return newHistory;
    });
  };

  const handleAnalyzeSection = async (title: string, body: string) => {
    setIsLoading(true);
    setCurrentAssistantMessage('');
    
    const sectionKey = title;
    const userPrompt = `Please analyze this section: ${title}`;
    const userMessage: Message = { 
      role: 'user', 
      content: userPrompt
    };
    
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      saveMessagesToHistory(sectionKey, newMessages);
      return newMessages;
    });

    try {
      let fullResponse = '';
      await llmHelperStreamAPI(
        { title, body, user_prompt: userPrompt },
        (delta: string) => {
          fullResponse += delta;
          setCurrentAssistantMessage(fullResponse);
        }
      );
      
      // Move current message to messages array when complete
      setMessages(prev => {
        const newMessages = [...prev, { role: 'assistant', content: fullResponse }];
        saveMessagesToHistory(sectionKey, newMessages);
        return newMessages;
      });
      setCurrentAssistantMessage('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get assistance. Please try again.';
      setMessages(prev => {
        const newMessages = [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }];
        saveMessagesToHistory(sectionKey, newMessages);
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      setCurrentAssistantMessage('');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const sectionKey = getSectionKey();
    const userMessage: Message = { role: 'user', content: input };
    const userInput = input;
    setInput('');
    setIsLoading(true);
    setCurrentAssistantMessage('');

    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      saveMessagesToHistory(sectionKey, newMessages);
      return newMessages;
    });

    try {
      // If there's a selected section, use it; otherwise use the full contract
      const sectionTitle = selectedSection?.title || 'Contract';
      const sectionBody = selectedSection?.body || contract;

      let fullResponse = '';
      await llmHelperStreamAPI(
        { title: sectionTitle, body: sectionBody, user_prompt: userInput },
        (delta: string) => {
          fullResponse += delta;
          setCurrentAssistantMessage(fullResponse);
        }
      );
      
      // Move current message to messages array when complete
      setMessages(prev => {
        const newMessages = [...prev, { role: 'assistant', content: fullResponse }];
        saveMessagesToHistory(sectionKey, newMessages);
        return newMessages;
      });
      setCurrentAssistantMessage('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get assistance. Please try again.';
      setMessages(prev => {
        const newMessages = [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }];
        saveMessagesToHistory(sectionKey, newMessages);
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      setCurrentAssistantMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    let prompt = '';
    switch (action) {
      case 'review':
        prompt = 'Please review this contract and identify any potential issues or areas for improvement.';
        break;
      case 'simplify':
        prompt = 'Can you simplify the language in this contract to make it more readable?';
        break;
      case 'legal':
        prompt = 'What are the key legal implications and obligations in this contract?';
        break;
      case 'suggestions':
        prompt = 'What suggestions do you have to strengthen this contract?';
        break;
      default:
        return;
    }
    setInput(prompt);
  };


  return (
    <div className="llm-helper">
      <div className="helper-header">
        <h3>AI Contract Assistant</h3>
        {selectedSection && (
          <div className="selected-section-info">
            <span className="section-badge">📄 {selectedSection.title}</span>
          </div>
        )}
        <div className="quick-actions">
          {selectedSection && (
            <button 
              onClick={() => handleAnalyzeSection(selectedSection.title, selectedSection.body)} 
              className="quick-action-btn"
            >
              Analyze Section
            </button>
          )}
          <button onClick={() => handleQuickAction('review')} className="quick-action-btn">
            Review
          </button>
          <button onClick={() => handleQuickAction('simplify')} className="quick-action-btn">
            Simplify
          </button>
          <button onClick={() => handleQuickAction('legal')} className="quick-action-btn">
            Legal Check
          </button>
          <button onClick={() => handleQuickAction('suggestions')} className="quick-action-btn">
            Suggestions
          </button>
        </div>
      </div>
      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
        {isLoading && currentAssistantMessage && (
          <div className="message assistant">
            <div className="message-content">{currentAssistantMessage}</div>
          </div>
        )}
        {isLoading && !currentAssistantMessage && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <textarea
          className="message-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={selectedSection ? `Ask about "${selectedSection.title}"...` : "Select a section or ask me anything about your contract..."}
          rows={2}
        />
        <button onClick={handleSend} disabled={!input.trim() || isLoading} className="send-button">
          Send
        </button>
      </div>
    </div>
  );
}


