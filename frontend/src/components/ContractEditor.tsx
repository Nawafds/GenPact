import { useState, useEffect, useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import ReactMarkdown from 'react-markdown';
import { parseContractSections, type ContractSection } from '../utils/sectionParser';
import './ContractEditor.css';

interface ContractEditorProps {
  contract: string;
  onContractChange: (contract: string) => void;
  onSectionSelect?: (title: string, body: string) => void;
  onReplaceText?: (callback: (oldText: string, newText: string) => void) => void;
}

export default function ContractEditor({ contract, onContractChange, onSectionSelect, onReplaceText }: ContractEditorProps) {
  const [_selectedText, setSelectedText] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [editingSectionBody, setEditingSectionBody] = useState<string>('');
  const [currentSection, setCurrentSection] = useState<ContractSection | null>(null);
  const markdownRef = useRef<HTMLDivElement>(null);
  const sectionTextareaRefs = useRef<Map<number, HTMLTextAreaElement>>(new Map());
  const isSavingRef = useRef<boolean>(false);
  const savedScrollPositionRef = useRef<number>(0);
  
  // Parse contract into sections
  const sections = useMemo(() => parseContractSections(contract), [contract]);
  
  // Identify the title section (first section, typically level 1)
  const titleSectionIndex = useMemo(() => {
    if (sections.length === 0) return null;
    // Find first section with level 1, or just the first section
    const level1Index = sections.findIndex(s => s.level === 1);
    return level1Index !== -1 ? level1Index : 0;
  }, [sections]);
  
  const isTitleSection = (index: number) => index === titleSectionIndex;
  
  // Clear selection when contract changes significantly
  useEffect(() => {
    if (selectedSectionIndex !== null && selectedSectionIndex >= sections.length) {
      setSelectedSectionIndex(null);
      setCurrentSection(null);
      setSelectedText('');
      setSelectedRange(null);
    } else if (selectedSectionIndex !== null && currentSection) {
      // Update current section reference if sections were re-parsed
      const updatedSection = sections[selectedSectionIndex];
      if (updatedSection && updatedSection.title === currentSection.title) {
        setCurrentSection(updatedSection);
      }
    }
  }, [contract, sections, selectedSectionIndex, currentSection]);
  
  // Auto-scroll to bottom when contract content changes (for streaming only, not when saving)
  useEffect(() => {
    if (contract && editingSectionIndex === null && !isSavingRef.current) {
      // Only auto-scroll if we're not saving (i.e., during streaming)
      if (markdownRef.current) {
        markdownRef.current.scrollTop = markdownRef.current.scrollHeight;
      }
    } else if (isSavingRef.current && markdownRef.current) {
      // Restore scroll position after saving
      markdownRef.current.scrollTop = savedScrollPositionRef.current;
      isSavingRef.current = false;
    }
  }, [contract, editingSectionIndex]);
  
  // Focus textarea when section enters edit mode
  useEffect(() => {
    if (editingSectionIndex !== null) {
      const textarea = sectionTextareaRefs.current.get(editingSectionIndex);
      if (textarea) {
        textarea.focus();
        textarea.scrollTop = 0;
      }
    }
  }, [editingSectionIndex]);

  const handleStartEditSection = (section: ContractSection, index: number) => {
    // Don't allow editing the title section
    if (isTitleSection(index)) {
      return;
    }
    // Allow editing even if section is selected
    setEditingSectionIndex(index);
    setEditingSectionBody(section.body);
    // Optionally keep the section selected for AI assistance
    // The section can be both selected and edited simultaneously
  };

  const handleCancelEditSection = () => {
    // Save current scroll position before canceling
    if (markdownRef.current) {
      savedScrollPositionRef.current = markdownRef.current.scrollTop;
    }
    isSavingRef.current = true;
    
    setEditingSectionIndex(null);
    setEditingSectionBody('');
  };

  const handleSaveSection = (section: ContractSection, index: number) => {
    // Prevent saving the title section
    if (isTitleSection(index)) {
      return;
    }
    
    // Save current scroll position before making changes
    if (markdownRef.current) {
      savedScrollPositionRef.current = markdownRef.current.scrollTop;
    }
    isSavingRef.current = true;
    
    if (!currentSection || currentSection.title !== section.title) {
      // Update current section reference
      setCurrentSection(section);
    }
    
    // Find the header line within the section
    const sectionText = contract.substring(section.startIndex, section.endIndex);
    const lines = sectionText.split('\n');
    
    // Find where the header ends (first line is the header)
    let headerEndIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Check if this is the section header
      if (trimmedLine.match(/^(#{1,6})\s+(.+)$/)) {
        const headerText = trimmedLine.replace(/^#+\s+/, '').trim();
        if (headerText === section.title || i === 0) {
          // Header ends after this line
          headerEndIndex = line.length + 1; // +1 for newline
          break;
        }
      }
    }
    
    // Calculate absolute positions
    const bodyStartIndex = section.startIndex + headerEndIndex;
    const bodyEndIndex = section.endIndex;
    
    // Replace only the body portion (keep header intact)
    const beforeSection = contract.substring(0, bodyStartIndex);
    const afterSection = contract.substring(bodyEndIndex);
    
    // Ensure newText doesn't have extra newlines at start/end
    const cleanNewBody = editingSectionBody.trim();
    
    // Replace the body with the new text
    const newContract = beforeSection + cleanNewBody + (afterSection ? '\n' + afterSection : '');
    onContractChange(newContract);
    
    // If this section is currently selected, update the selection with new body
    if (selectedSectionIndex === index && onSectionSelect) {
      onSectionSelect(section.title, cleanNewBody);
      setSelectedText(cleanNewBody);
    }
    
    // Exit edit mode
    setEditingSectionIndex(null);
    setEditingSectionBody('');
  };

  // Expose replace function to parent
  useEffect(() => {
    if (onReplaceText) {
      onReplaceText((oldText: string, newText: string) => {
        // If we have a current section, replace only within that section's body
        if (currentSection) {
          // Find the header line within the section
          const sectionText = contract.substring(currentSection.startIndex, currentSection.endIndex);
          const lines = sectionText.split('\n');
          
          // Find where the header ends (first line is the header)
          let headerEndIndex = 0;
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Check if this is the section header
            if (trimmedLine.match(/^(#{1,6})\s+(.+)$/)) {
              const headerText = trimmedLine.replace(/^#+\s+/, '').trim();
              if (headerText === currentSection.title || i === 0) {
                // Header ends after this line
                headerEndIndex = line.length + 1; // +1 for newline
                break;
              }
            }
          }
          
          // Calculate absolute positions
          const bodyStartIndex = currentSection.startIndex + headerEndIndex;
          const bodyEndIndex = currentSection.endIndex;
          
          // Replace only the body portion (keep header intact)
          const beforeSection = contract.substring(0, bodyStartIndex);
          const afterSection = contract.substring(bodyEndIndex);
          
          // Ensure newText doesn't have extra newlines at start/end
          const cleanNewText = newText.trim();
          
          // Replace the body with the new text
          const newContract = beforeSection + cleanNewText + (afterSection ? '\n' + afterSection : '');
          onContractChange(newContract);
          
          // Update the selected section to reflect the change
          setSelectedText(cleanNewText);
        } else if (selectedRange) {
          // Fallback: use selected range if available
          const newContract = contract.substring(0, selectedRange.start) + newText + contract.substring(selectedRange.end);
          onContractChange(newContract);
          setSelectedRange(null);
          setSelectedText('');
        } else if (oldText && contract.includes(oldText)) {
          // Last resort: search and replace (but warn this might affect multiple sections)
          const newContract = contract.replace(oldText, newText);
          onContractChange(newContract);
          setSelectedText('');
        }
      });
    }
  }, [onReplaceText, contract, selectedRange, currentSection, onContractChange]);

  const handleSectionBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingSectionBody(e.target.value);
  };

  const handleSectionClick = (section: ContractSection, index: number, e: React.MouseEvent) => {
    // Don't allow selecting the title section
    if (isTitleSection(index)) {
      return;
    }
    
    e.stopPropagation();
    // Clear any text selection
    window.getSelection()?.removeAllRanges();
    
    setSelectedSectionIndex(index);
    setCurrentSection(section);
    setSelectedText(section.body);
    setSelectedRange({ start: section.startIndex, end: section.endIndex });
    
    if (onSectionSelect) {
      onSectionSelect(section.title, section.body);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Don't clear section selection on empty selection
      return;
    }

    const selectedTextValue = selection.toString().trim();
    if (!selectedTextValue) {
      return;
    }

    // If user selected text within a section, update to use that specific text
    // but keep the section context
    setSelectedText(selectedTextValue);
    
    // Try to find the position in the original markdown text
    const startIndex = contract.indexOf(selectedTextValue);
    const endIndex = startIndex + selectedTextValue.length;
    
    if (startIndex !== -1) {
      setSelectedRange({ start: startIndex, end: endIndex });
      
      // Find which section contains this selection
      const containingSection = sections.find(
        section => startIndex >= section.startIndex && startIndex < section.endIndex
      );
      
      // If text is selected within a section, use that section's title but the selected text as body
      if (containingSection && onSectionSelect) {
        onSectionSelect(containingSection.title, selectedTextValue);
      }
    }
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
          <button onClick={handleDownload} className="download-button">
            Download Contract
          </button>
        </div>
      </div>
      <div 
        ref={markdownRef} 
        className="contract-markdown"
        onMouseUp={handleTextSelection}
        onKeyUp={handleTextSelection}
      >
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <div
              key={index}
              className={`contract-section ${selectedSectionIndex === index ? 'selected' : ''} ${editingSectionIndex === index ? 'editing' : ''} ${isTitleSection(index) ? 'title-section' : ''}`}
              onClick={(e) => {
                // Don't allow selection of title section
                if (isTitleSection(index)) {
                  return;
                }
                // Don't trigger section selection when clicking edit buttons or header actions
                if ((e.target as HTMLElement).closest('.section-edit-actions') ||
                    (e.target as HTMLElement).closest('.section-header-actions') ||
                    (e.target as HTMLElement).closest('.edit-section-btn')) {
                  return;
                }
                handleSectionClick(section, index, e);
              }}
            >
              <div className="section-header">
                <h2 className={`section-title level-${section.level || 2}`}>
                  {section.title}
                </h2>
                <div className="section-header-actions">
                  {editingSectionIndex === index ? (
                    <div className="section-edit-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveSection(section, index);
                        }}
                        className="save-section-btn"
                      >
                        ✓ Save
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEditSection();
                        }}
                        className="cancel-section-btn"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      {!isTitleSection(index) && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditSection(section, index);
                            }}
                            className="edit-section-btn"
                          >
                            ✏️ Edit
                          </button>
                          <span className="section-select-hint">Click to select for AI assistance</span>
                        </>
                      )}
                      {/* {isTitleSection(index) && (
                        <span className="section-select-hint title-hint">Title section (not editable or selectable)</span>
                      )} */}
                    </>
                  )}
                </div>
              </div>
              {editingSectionIndex === index ? (
                <textarea
                  ref={(el) => {
                    if (el) {
                      sectionTextareaRefs.current.set(index, el);
                    } else {
                      sectionTextareaRefs.current.delete(index);
                    }
                  }}
                  className="section-edit-textarea"
                  value={editingSectionBody}
                  onChange={handleSectionBodyChange}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Edit section content..."
                />
              ) : (
                <div className="section-content">
                  <ReactMarkdown>{section.body}</ReactMarkdown>
                </div>
              )}
            </div>
          ))
        ) : (
          <ReactMarkdown>{contract || 'No contract content available.'}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}

