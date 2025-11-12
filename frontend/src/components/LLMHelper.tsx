import { useState, useRef, useEffect } from 'react';
import './LLMHelper.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LLMHelperProps {
  contract: string;
}

export default function LLMHelper({ contract }: LLMHelperProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your contract assistant. I can help you review, improve, or answer questions about your contract. How can I assist you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate LLM response (replace with actual API call)
    setTimeout(() => {
      const response = generateMockResponse(input, contract);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsLoading(false);
    }, 1000);
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
        <div className="quick-actions">
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
        {isLoading && (
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
          placeholder="Ask me anything about your contract..."
          rows={2}
        />
        <button onClick={handleSend} disabled={!input.trim() || isLoading} className="send-button">
          Send
        </button>
      </div>
    </div>
  );
}

// Mock response generator (replace with actual LLM API call)
function generateMockResponse(userInput: string, contract: string): string {
  const lowerInput = userInput.toLowerCase();
  
  if (lowerInput.includes('review') || lowerInput.includes('issue') || lowerInput.includes('problem')) {
    return `Based on my review of your contract, here are some observations:

1. **Structure**: The contract follows a standard format with clear sections.

2. **Recommendations**:
   - Consider adding specific performance metrics or deliverables
   - Include a force majeure clause for unforeseen circumstances
   - Specify the jurisdiction and venue for legal disputes more clearly

3. **Missing Elements**: 
   - Intellectual property rights (if applicable)
   - Confidentiality provisions (if needed)
   - Dispute resolution timeline

Would you like me to help draft any of these additions?`;
  }
  
  if (lowerInput.includes('simplify') || lowerInput.includes('readable') || lowerInput.includes('plain')) {
    return `I can help simplify the contract language. Here are some suggestions:

- Replace legal jargon with plain language where possible
- Break down complex sentences into shorter, clearer ones
- Add headings and bullet points for better readability
- Define technical terms when first introduced

Would you like me to provide a simplified version of a specific section?`;
  }
  
  if (lowerInput.includes('legal') || lowerInput.includes('obligation') || lowerInput.includes('liability')) {
    return `Key legal aspects of your contract:

**Obligations**: Both parties have mutual obligations to act in good faith and fulfill the terms.

**Termination**: Either party can terminate with written notice, which provides flexibility.

**Dispute Resolution**: The contract includes an arbitration clause, which can be faster and less expensive than litigation.

**Recommendation**: Consider adding specific consequences for breach of contract and limitation of liability clauses.

Should I help draft these provisions?`;
  }
  
  if (lowerInput.includes('suggest') || lowerInput.includes('improve') || lowerInput.includes('strengthen')) {
    return `Here are suggestions to strengthen your contract:

1. **Add Specific Metrics**: Define clear, measurable deliverables
2. **Payment Terms**: Include late payment penalties and payment method details
3. **Confidentiality**: Add an NDA clause if sensitive information is involved
4. **Termination Notice**: Specify the exact notice period required
5. **Amendment Process**: Clarify how changes must be documented
6. **Severability Clause**: Add a clause stating that if one part is invalid, the rest remains

Which of these would you like to implement?`;
  }
  
  // Default response
  return `I understand you're asking about: "${userInput}"

To provide the most accurate assistance, I can:
- Review your contract for potential issues
- Suggest improvements or additions
- Explain legal terms and implications
- Help simplify complex language
- Answer specific questions about contract sections

You can use the quick action buttons above or ask me directly. What would you like help with?`;
}

