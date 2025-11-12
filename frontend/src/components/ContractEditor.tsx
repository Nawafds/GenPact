import { jsPDF } from 'jspdf';
import './ContractEditor.css';

interface ContractEditorProps {
  contract: string;
  onContractChange: (contract: string) => void;
}

export default function ContractEditor({ contract, onContractChange }: ContractEditorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContractChange(e.target.value);
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;
    const lineHeight = 7;
    const sectionSpacing = 5;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      if (!text.trim()) return;
      
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      // Split text into lines that fit the page width
      const lines = doc.splitTextToSize(text, maxWidth);
      
      checkNewPage(lines.length * lineHeight);
      
      lines.forEach((line: string) => {
        checkNewPage(lineHeight);
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    };

    // Helper function to strip markdown and clean text
    const cleanText = (text: string): string => {
      // Remove markdown bold markers
      return text.replace(/\*\*/g, '').trim();
    };

    // Parse and format the contract text
    const lines = contract.split('\n');
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Handle headers (lines that are entirely bold)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && !trimmedLine.slice(2, -2).includes('**')) {
        yPosition += sectionSpacing;
        const headerText = trimmedLine.replace(/\*\*/g, '');
        addText(headerText, 14, true);
        yPosition += sectionSpacing;
      }
      // Handle numbered sections (like "1. ", "2. ", etc.)
      else if (/^\d+\.\s/.test(trimmedLine)) {
        yPosition += sectionSpacing;
        addText(trimmedLine, 11, true);
      }
      // Handle horizontal rules (---)
      else if (trimmedLine === '---' || trimmedLine.startsWith('---')) {
        yPosition += sectionSpacing;
        checkNewPage(lineHeight);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += sectionSpacing;
      }
      // Handle empty lines
      else if (trimmedLine === '') {
        yPosition += sectionSpacing;
      }
      // Handle lines with markdown formatting (strip markdown and add as regular text)
      else if (trimmedLine.includes('**')) {
        const cleanedText = cleanText(trimmedLine);
        addText(cleanedText);
      }
      // Regular text
      else {
        addText(trimmedLine);
      }
    });

    // Save the PDF
    doc.save('contract.pdf');
  };

  return (
    <div className="contract-editor">
      <div className="editor-header">
        <h3>Contract Editor</h3>
        <button onClick={handleDownload} className="download-button">
          Download Contract
        </button>
      </div>
      <textarea
        className="contract-textarea"
        value={contract}
        onChange={handleChange}
        placeholder="Contract content will appear here..."
      />
    </div>
  );
}

