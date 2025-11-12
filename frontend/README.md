# Contract Generator Platform

A modern web application for generating, editing, and improving contracts with AI assistance.

## Features

- **Contract Input Form**: Fill in contract details including parties, dates, payment terms, and descriptions
- **Contract Generation**: Automatically generate professional contracts based on your inputs
- **Manual Editor**: Edit the generated contract in real-time with a full-featured text editor
- **AI Assistant**: Get help from an LLM-powered assistant that can:
  - Review contracts for potential issues
  - Simplify complex language
  - Explain legal implications
  - Provide improvement suggestions
  - Answer questions about your contract

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Usage

1. **Fill in Contract Details**: Start by entering information about both parties, contract type, dates, payment terms, and any additional details.

2. **Generate Contract**: Click "Generate Contract" to create a professional contract based on your inputs.

3. **Edit Contract**: Use the left panel to manually edit the generated contract as needed.

4. **Get AI Help**: Use the right panel to interact with the AI assistant. You can:
   - Use quick action buttons (Review, Simplify, Legal Check, Suggestions)
   - Ask specific questions about your contract
   - Get recommendations for improvements

5. **Download**: Click the "Download Contract" button to save your contract as a text file.

## Integrating a Real LLM API

Currently, the LLM helper uses mock responses. To integrate a real LLM API (OpenAI, Anthropic, etc.), update the `handleSend` function in `src/components/LLMHelper.tsx`:

```typescript
const handleSend = async () => {
  if (!input.trim() || isLoading) return;

  const userMessage: Message = { role: 'user', content: input };
  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setIsLoading(true);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input,
        contract: contract,
        history: messages,
      }),
    });
    
    const data = await response.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
  } catch (error) {
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: 'Sorry, I encountered an error. Please try again.' 
    }]);
  } finally {
    setIsLoading(false);
  }
};
```

## Project Structure

```
src/
├── components/
│   ├── ContractInputForm.tsx    # Form for contract inputs
│   ├── ContractEditor.tsx        # Manual contract editor
│   └── LLMHelper.tsx             # AI assistant chat interface
├── utils/
│   └── contractGenerator.ts      # Contract generation logic
├── App.tsx                       # Main application component
└── main.tsx                      # Application entry point
```

## Technologies

- React 19
- TypeScript
- Vite
- CSS Variables (for theming)

## License

MIT
