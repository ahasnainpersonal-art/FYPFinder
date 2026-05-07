import jsPDF from 'jspdf'

// FAST Logo constant - paste base64 encoded PNG string here when available
const FAST_LOGO_BASE64 = ''

/**
 * Generate a professional PDF proposal document
 * @param {Object} params - Parameter object
 * @param {Object} params.proposal - Proposal data containing questions and answers
 * @param {string} params.projectTitle - Title of the project
 * @param {string} params.domain - Domain of the project
 * @param {string} params.supervisorName - Name of the supervisor
 * @param {string} params.supervisorEmail - Email of the supervisor
 * @param {Array} params.groupMembers - Array of group member objects
 * @returns {string} Base64 encoded PDF string
 */
export function generateProposalPDF({
  proposal = {},
  projectTitle = '',
  domain = '',
  supervisorName = '',
  supervisorEmail = '',
  groupMembers = [],
}) {
  const doc = new jsPDF('p', 'mm', 'a4')
  
  // Constants
  const MARGIN = 20
  const PAGE_WIDTH = doc.internal.pageSize.getWidth()
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight()
  const MAX_WIDTH = PAGE_WIDTH - 2 * MARGIN
  const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN
  const DARK_BLUE = [26, 54, 93]
  const BLACK = [0, 0, 0]
  const LIGHT_GRAY = [240, 240, 240]
  
  let currentY = MARGIN
  
  // Helper function to add footer
  const addFooter = () => {
    const footerY = PAGE_HEIGHT - 10
    doc.setFontSize(8)
    doc.setTextColor(...BLACK)
    doc.text('FYPFinder — FAST-NUCES Lahore', PAGE_WIDTH / 2, footerY, { align: 'center' })
    doc.text(`Page ${doc.internal.pages.length - 1} of ${doc.internal.pages.length - 1}`, PAGE_WIDTH - MARGIN - 5, footerY, { align: 'right' })
  }
  
  // Helper function to check and add new page
  const checkPageBreak = (requiredSpace = 20) => {
    if (currentY + requiredSpace > PAGE_HEIGHT - 15) {
      addFooter()
      doc.addPage()
      currentY = MARGIN
    }
  }
  
  // Helper function to add section heading
  const addSectionHeading = (text) => {
    checkPageBreak(15)
    
    // Light gray background
    doc.setFillColor(...LIGHT_GRAY)
    doc.rect(MARGIN, currentY - 4, MAX_WIDTH, 10, 'F')
    
    // Section heading text
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK_BLUE)
    doc.text(text, MARGIN + 3, currentY + 3)
    
    currentY += 12
    
    // Divider line
    doc.setLineWidth(0.5)
    doc.line(MARGIN, currentY, MARGIN + MAX_WIDTH, currentY)
    currentY += 3
  }
  
  // Helper function to add text with wrapping
  const addWrappedText = (text, fontSize, isBold = false, indent = 0) => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.setTextColor(...BLACK)
    
    const wrappedText = doc.splitTextToSize(String(text || ''), MAX_WIDTH - indent)
    const lineHeight = fontSize * 0.35
    
    wrappedText.forEach((line, index) => {
      checkPageBreak(fontSize * 0.5)
      doc.text(line, MARGIN + indent, currentY)
      currentY += lineHeight
    })
  }
  
  // ============ HEADER ============
  
  // Logo (if available)
  if (FAST_LOGO_BASE64) {
    try {
      const logoHeight = 15
      const logoWidth = 15
      const logoX = (PAGE_WIDTH - logoWidth) / 2
      doc.addImage(FAST_LOGO_BASE64, 'PNG', logoX, currentY, logoWidth, logoHeight)
      currentY += logoHeight + 3
    } catch (err) {
      console.warn('Failed to add logo:', err)
    }
  }
  
  // University name
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text('National University of Computer and Emerging Sciences', PAGE_WIDTH / 2, currentY, { align: 'center' })
  currentY += 8
  
  // Campus name
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('FAST-NUCES Lahore', PAGE_WIDTH / 2, currentY, { align: 'center' })
  currentY += 8
  
  // Proposal title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Final Year Project Proposal', PAGE_WIDTH / 2, currentY, { align: 'center' })
  currentY += 10
  
  // Divider line
  doc.setLineWidth(1)
  doc.line(MARGIN, currentY, MARGIN + MAX_WIDTH, currentY)
  currentY += 8
  
  // ============ PROJECT DETAILS SECTION ============
  addSectionHeading('Project Details')
  
  // Proposed Title
  addWrappedText('Proposed Title:', 10, true)
  addWrappedText(projectTitle, 10, false, 3)
  currentY += 2
  
  // Domain
  addWrappedText('Domain:', 10, true)
  addWrappedText(domain, 10, false, 3)
  currentY += 2
  
  // Supervisor
  addWrappedText('Supervisor:', 10, true)
  const supervisorInfo = `${supervisorName} (${supervisorEmail})`
  addWrappedText(supervisorInfo, 10, false, 3)
  currentY += 2
  
  // Submission Date
  addWrappedText('Submission Date:', 10, true)
  const submissionDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '/')
  addWrappedText(submissionDate, 10, false, 3)
  currentY += 5
  
  // ============ GROUP MEMBERS SECTION ============
  addSectionHeading('Group Members')
  
  groupMembers.forEach((member, index) => {
    checkPageBreak(12)
    
    // Member number and name
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLACK)
    const memberLabel = `${index + 1}. ${member.name || 'N/A'}`
    doc.text(memberLabel, MARGIN + 3, currentY)
    currentY += 5
    
    // Member details
    const details = [
      { label: 'Email:', value: member.email || 'N/A' },
      { label: 'CGPA Range:', value: member.cgpa || 'N/A' },
      { label: 'Skills:', value: member.skills || 'N/A' },
      { label: 'GitHub:', value: member.github || 'N/A' },
      { label: 'Role:', value: member.role || 'Member' },
    ]
    
    details.forEach(({ label, value }) => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...BLACK)
      const detailText = `${label} ${value}`
      const wrapped = doc.splitTextToSize(detailText, MAX_WIDTH - 8)
      wrapped.forEach((line) => {
        checkPageBreak(4)
        doc.text(line, MARGIN + 6, currentY)
        currentY += 3.5
      })
    })
    
    currentY += 2
  })
  
  currentY += 3
  
  // ============ PROPOSAL CONTENT SECTION ============
  addSectionHeading('Proposal')
  
  // Map proposal questions to labels
  const proposalQuestions = [
    { key: 'projectUnderstanding', label: 'Project Understanding' },
    { key: 'proposedApproach', label: 'Proposed Approach' },
    { key: 'relevantSkills', label: 'Relevant Skills' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'whyThisGroup', label: 'Why This Group' },
  ]
  
  proposalQuestions.forEach(({ key, label }) => {
    const answer = proposal[key] || ''
    if (answer) {
      checkPageBreak(10)
      
      // Question label
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK_BLUE)
      doc.text(`${label}:`, MARGIN + 3, currentY)
      currentY += 5
      
      // Answer text
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...BLACK)
      const wrappedAnswer = doc.splitTextToSize(answer, MAX_WIDTH - 6)
      wrappedAnswer.forEach((line) => {
        checkPageBreak(4)
        doc.text(line, MARGIN + 6, currentY)
        currentY += 4
      })
      
      currentY += 2
    }
  })
  
  // Add footer to last page
  addFooter()
  
  // Return PDF as base64
  return doc.output('datauristring').split('base64,')[1]
}
