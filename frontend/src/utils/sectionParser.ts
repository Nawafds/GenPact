export interface ContractSection {
  title: string;
  body: string;
  fullText: string; // Includes the header
  startIndex: number;
  endIndex: number;
  level: number; // Header level (1-6)
}

/**
 * Parses a markdown contract into sections based on headers
 */
export function parseContractSections(contract: string): ContractSection[] {
  if (!contract) return [];

  const sections: ContractSection[] = [];
  const lines = contract.split('\n');
  let currentSection: ContractSection | null = null;
  let charIndex = 0;
  let preambleContent = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check if this line is a header
    const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    
    if (headerMatch) {
      // If we have preamble content before the first header, create a section for it
      if (preambleContent && sections.length === 0 && !currentSection) {
        const preambleSection: ContractSection = {
          title: 'Preamble',
          body: preambleContent.trimEnd(),
          fullText: preambleContent,
          startIndex: 0,
          endIndex: charIndex - line.length - 1,
          level: 0
        };
        sections.push(preambleSection);
        preambleContent = '';
      }
      
      // Save previous section if it exists
      if (currentSection) {
        currentSection.endIndex = charIndex - line.length - 1; // End before the new header
        currentSection.fullText = contract.substring(currentSection.startIndex, currentSection.endIndex);
        // Remove trailing newlines from body
        currentSection.body = currentSection.body.trimEnd();
        sections.push(currentSection);
      }
      
      // Start new section
      const level = headerMatch[1].length;
      const title = headerMatch[2].trim();
      const sectionStart = charIndex;
      
      currentSection = {
        title,
        body: '', // Will be populated as we read more lines
        fullText: line + '\n',
        startIndex: sectionStart,
        endIndex: sectionStart + line.length,
        level
      };
    } else if (currentSection) {
      // Add line to current section body
      currentSection.body += line + '\n';
      currentSection.fullText += line + '\n';
    } else {
      // Content before first header (preamble)
      preambleContent += line + '\n';
    }
    
    charIndex += line.length + 1; // +1 for newline
  }
  
  // Handle preamble if no headers were found
  if (preambleContent && sections.length === 0 && !currentSection) {
    sections.push({
      title: 'Contract',
      body: preambleContent.trimEnd(),
      fullText: preambleContent,
      startIndex: 0,
      endIndex: contract.length,
      level: 0
    });
    return sections;
  }
  
  // Don't forget the last section
  if (currentSection) {
    currentSection.endIndex = charIndex;
    currentSection.fullText = contract.substring(currentSection.startIndex, currentSection.endIndex);
    // Remove trailing newlines from body
    currentSection.body = currentSection.body.trimEnd();
    sections.push(currentSection);
  }
  
  // If no sections found, create one section with all content
  if (sections.length === 0 && contract.trim()) {
    sections.push({
      title: 'Contract',
      body: contract.trim(),
      fullText: contract,
      startIndex: 0,
      endIndex: contract.length,
      level: 0
    });
  }
  
  return sections;
}

