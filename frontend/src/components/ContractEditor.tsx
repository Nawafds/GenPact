import { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import ReactMarkdown from 'react-markdown';
import './ContractEditor.css';

interface ContractEditorProps {
  contract: string;
  onContractChange: (contract: string) => void;
}

export default function ContractEditor({ contract, onContractChange }: ContractEditorProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const markdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-scroll to bottom when contract content changes (for streaming)
  useEffect(() => {
    if (contract && !isEditMode) {
      // Scroll markdown view to bottom
      if (markdownRef.current) {
        markdownRef.current.scrollTop = markdownRef.current.scrollHeight;
      }
    } else if (contract && isEditMode) {
      // Scroll textarea to bottom
      if (textareaRef.current) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }
  }, [contract, isEditMode]);

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
    let listIndent = 0;
    const listIndentSize = 10;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Helper function to add text with word wrapping and optional indentation
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false, indent: number = 0) => {
      if (!text.trim()) return;
      
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const currentMargin = margin + indent;
      const currentMaxWidth = maxWidth - indent;
      
      // Split text into lines that fit the page width
      const lines = doc.splitTextToSize(text, currentMaxWidth);
      
      checkNewPage(lines.length * lineHeight);
      
      lines.forEach((line: string) => {
        checkNewPage(lineHeight);
        doc.text(line, currentMargin, yPosition);
        yPosition += lineHeight;
      });
    };

    // Helper function to render text with inline bold formatting
    const addTextWithBold = (text: string, fontSize: number = 10, indent: number = 0) => {
      if (!text.trim()) return;
      
      const currentMargin = margin + indent;
      const currentMaxWidth = maxWidth - indent;
      let currentX = currentMargin;
      let currentY = yPosition;
      
      // Parse bold markers (**text**)
      const parts: Array<{ text: string; bold: boolean }> = [];
      let remaining = text;
      
      while (remaining.length > 0) {
        const boldStart = remaining.indexOf('**');
        if (boldStart === -1) {
          if (remaining.trim()) {
            parts.push({ text: remaining, bold: false });
          }
          break;
        }
        
        // Add text before bold marker
        if (boldStart > 0) {
          parts.push({ text: remaining.substring(0, boldStart), bold: false });
        }
        
        // Find closing bold marker
        const boldEnd = remaining.indexOf('**', boldStart + 2);
        if (boldEnd === -1) {
          // No closing marker, treat rest as regular text
          parts.push({ text: remaining.substring(boldStart), bold: false });
          break;
        }
        
        // Add bold text
        parts.push({ text: remaining.substring(boldStart + 2, boldEnd), bold: true });
        remaining = remaining.substring(boldEnd + 2);
      }
      
      // Render each part sequentially
      doc.setFontSize(fontSize);
      
      parts.forEach((part) => {
        doc.setFont('helvetica', part.bold ? 'bold' : 'normal');
        
        // Calculate available width on current line
        const availableWidth = currentMaxWidth - (currentX - currentMargin);
        
        // Split text to fit available width
        const wrappedLines = doc.splitTextToSize(part.text, availableWidth);
        
        wrappedLines.forEach((line: string, lineIdx: number) => {
          if (lineIdx > 0) {
            // Move to next line
            currentX = currentMargin;
            currentY += lineHeight;
            checkNewPage(lineHeight);
          }
          
          // Check if line fits on current position
          const lineWidth = doc.getTextWidth(line);
          if (lineIdx === 0 && currentX + lineWidth > pageWidth - margin) {
            // Doesn't fit, move to next line
            currentX = currentMargin;
            currentY += lineHeight;
            checkNewPage(lineHeight);
          }
          
          doc.text(line, currentX, currentY);
          currentX += lineWidth;
          
          // If we've reached the end of the line, reset X position
          if (currentX >= pageWidth - margin - 1) {
            currentX = currentMargin;
            currentY += lineHeight;
            checkNewPage(lineHeight);
          }
        });
      });
      
      yPosition = currentY + lineHeight;
    };

    // Parse and format the contract text
    const lines = contract.split('\n');
    let inList = false;
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Handle markdown headers (# ## ###)
      if (trimmedLine.startsWith('#')) {
        const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const headerText = headerMatch[2].replace(/\*\*/g, ''); // Remove any bold markers from header
          yPosition += sectionSpacing * 2;
          checkNewPage(lineHeight * 2);
          
          let fontSize = 16;
          if (level === 1) fontSize = 18;
          else if (level === 2) fontSize = 16;
          else if (level === 3) fontSize = 14;
          else if (level === 4) fontSize = 12;
          else fontSize = 11;
          
          addText(headerText, fontSize, true);
          yPosition += sectionSpacing;
          inList = false;
          listIndent = 0;
          return;
        }
      }
      
      // Handle horizontal rules (---)
      if (trimmedLine === '---' || trimmedLine.match(/^-{3,}$/)) {
        yPosition += sectionSpacing;
        checkNewPage(lineHeight);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += sectionSpacing * 2;
        inList = false;
        listIndent = 0;
        return;
      }
      
      // Handle numbered lists (1. 2. 3. etc.)
      const numberedListMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      if (numberedListMatch) {
        const listText = numberedListMatch[2];
        yPosition += sectionSpacing;
        addTextWithBold(`${numberedListMatch[1]}. ${listText}`, 10, listIndent);
        inList = true;
        return;
      }
      
      // Handle bullet lists (- or *)
      const bulletListMatch = trimmedLine.match(/^[-*]\s+(.+)$/);
      if (bulletListMatch) {
        const listText = bulletListMatch[1];
        yPosition += sectionSpacing;
        addTextWithBold(`• ${listText}`, 10, listIndent);
        inList = true;
        return;
      }
      
      // Handle nested list items (indented with spaces or tabs)
      const nestedListMatch = trimmedLine.match(/^(\s+)([-*]|\d+\.)\s+(.+)$/);
      if (nestedListMatch) {
        const indentLevel = nestedListMatch[1].length;
        const marker = nestedListMatch[2];
        const listText = nestedListMatch[3];
        const nestedIndent = listIndent + Math.min(indentLevel / 2, 3) * listIndentSize;
        yPosition += sectionSpacing / 2;
        const bullet = marker.match(/\d+/) ? `${marker} ` : '• ';
        addTextWithBold(`${bullet}${listText}`, 10, nestedIndent);
        inList = true;
        return;
      }
      
      // Handle empty lines
      if (trimmedLine === '') {
        if (inList) {
          yPosition += sectionSpacing / 2;
        } else {
          yPosition += sectionSpacing;
        }
        inList = false;
        return;
      }
      
      // Handle regular text with potential bold formatting
      // Check if line continues a list (starts with spaces but no list marker)
      const isContinuation = inList && /^\s+/.test(line) && !trimmedLine.match(/^[-*]|\d+\./);
      const indent = isContinuation ? listIndent + listIndentSize : listIndent;
      
      if (trimmedLine.includes('**')) {
        addTextWithBold(trimmedLine, 10, indent);
      } else {
        addText(trimmedLine, 10, false, indent);
      }
      
      // Reset list state if we have a non-list, non-empty line after spacing
      if (!isContinuation && !inList) {
        listIndent = 0;
      }
    });

    // Save the PDF
    doc.save('contract.pdf');
  };

  return (
    <div className="contract-editor">
      <div className="editor-header">
        <h3>Contract Editor</h3>
        <div className="header-actions">
          <button 
            onClick={() => setIsEditMode(!isEditMode)} 
            className="toggle-button"
          >
            {isEditMode ? '👁️ View' : '✏️ Edit'}
          </button>
          <button onClick={handleDownload} className="download-button">
            Download Contract
          </button>
        </div>
      </div>
      {isEditMode ? (
        <textarea
          ref={textareaRef}
          className="contract-textarea"
          value={contract}
          onChange={handleChange}
          placeholder="Contract content will appear here..."
        />
      ) : (
        <div ref={markdownRef} className="contract-markdown">
          <ReactMarkdown>{contract || 'No contract content available.'}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

