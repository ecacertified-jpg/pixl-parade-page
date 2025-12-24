import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Colors matching the design system
const COLORS = {
  primary: '#7A5DC7',
  secondary: '#FAD4E1',
  background: '#E8E2F5',
  text: '#2E2E2E',
  muted: '#6B7280',
  success: '#22C55E',
  white: '#FFFFFF',
};

export interface PDFOptions {
  orientation?: 'portrait' | 'landscape';
  format?: 'a4';
  title?: string;
  subtitle?: string;
  period?: string;
}

export const createPDF = (options: PDFOptions = {}): jsPDF => {
  const { orientation = 'portrait', format = 'a4' } = options;
  return new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });
};

export const captureChartAsImage = async (
  elementId: string,
  scale: number = 2
): Promise<string | null> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with id "${elementId}" not found`);
    return null;
  }

  try {
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor: COLORS.white,
      logging: false,
      useCORS: true,
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing chart:', error);
    return null;
  }
};

export const addHeader = (
  doc: jsPDF,
  title: string,
  pageNumber: number,
  totalPages: number
): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header line
  doc.setDrawColor(122, 93, 199); // primary color
  doc.setLineWidth(0.5);
  doc.line(15, 12, pageWidth - 15, 12);
  
  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(122, 93, 199);
  doc.text(title, 15, 10);
  
  // Page number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`${pageNumber} / ${totalPages}`, pageWidth - 15, 10, { align: 'right' });
};

export const addFooter = (doc: jsPDF, date: string): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Footer line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
  
  // Date and branding
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Généré le ${date}`, 15, pageHeight - 10);
  doc.text('JOIE DE VIVRE - Rapport Business', pageWidth - 15, pageHeight - 10, { align: 'right' });
};

export const addCoverPage = (
  doc: jsPDF,
  title: string,
  subtitle: string,
  period: string,
  date: string
): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  
  // Background gradient effect (simplified)
  doc.setFillColor(232, 226, 245); // background color
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative circle
  doc.setFillColor(122, 93, 199, 0.1);
  doc.circle(centerX, pageHeight / 3, 50, 'F');
  
  // Icon placeholder
  doc.setFontSize(48);
  doc.text('📊', centerX, pageHeight / 3 - 10, { align: 'center' });
  
  // Main title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(46, 46, 46);
  doc.text(title, centerX, pageHeight / 2, { align: 'center' });
  
  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.setTextColor(107, 114, 128);
  doc.text(subtitle, centerX, pageHeight / 2 + 12, { align: 'center' });
  
  // Period
  doc.setFontSize(14);
  doc.setTextColor(122, 93, 199);
  doc.text(period, centerX, pageHeight / 2 + 30, { align: 'center' });
  
  // Footer with date
  doc.setFontSize(11);
  doc.setTextColor(107, 114, 128);
  doc.text(`Généré le ${date}`, centerX, pageHeight - 30, { align: 'center' });
  
  // Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(122, 93, 199);
  doc.text('JOIE DE VIVRE', centerX, pageHeight - 20, { align: 'center' });
};

export const addSectionTitle = (
  doc: jsPDF,
  title: string,
  y: number,
  icon?: string
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Background bar
  doc.setFillColor(232, 226, 245);
  doc.roundedRect(15, y - 5, pageWidth - 30, 12, 2, 2, 'F');
  
  // Icon and title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(122, 93, 199);
  const displayTitle = icon ? `${icon} ${title}` : title;
  doc.text(displayTitle, 20, y + 3);
  
  return y + 15;
};

export const addKPIGrid = (
  doc: jsPDF,
  kpis: Array<{ label: string; value: string; icon: string }>,
  startY: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const cardWidth = (pageWidth - 40) / 3;
  const cardHeight = 25;
  const gap = 5;
  
  let currentY = startY;
  
  kpis.forEach((kpi, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const x = 15 + col * (cardWidth + gap);
    const y = currentY + row * (cardHeight + gap);
    
    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');
    
    // Icon
    doc.setFontSize(14);
    doc.text(kpi.icon, x + 5, y + 12);
    
    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(46, 46, 46);
    doc.text(kpi.value, x + 20, y + 12);
    
    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(kpi.label, x + 5, y + 20);
  });
  
  const totalRows = Math.ceil(kpis.length / 3);
  return currentY + totalRows * (cardHeight + gap) + 5;
};

export const addChartImage = async (
  doc: jsPDF,
  elementId: string,
  y: number,
  maxHeight: number = 80
): Promise<number> => {
  const imageData = await captureChartAsImage(elementId);
  if (!imageData) {
    return y;
  }
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const imgWidth = pageWidth - 30;
  
  // Add image
  doc.addImage(imageData, 'PNG', 15, y, imgWidth, maxHeight);
  
  return y + maxHeight + 10;
};

export const addTable = (
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  startY: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = pageWidth - 30;
  const colWidth = tableWidth / headers.length;
  const rowHeight = 8;
  
  let currentY = startY;
  
  // Header row
  doc.setFillColor(122, 93, 199);
  doc.rect(15, currentY, tableWidth, rowHeight, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  
  headers.forEach((header, i) => {
    doc.text(header, 17 + i * colWidth, currentY + 5.5);
  });
  
  currentY += rowHeight;
  
  // Data rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  rows.forEach((row, rowIndex) => {
    // Alternating row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(15, currentY, tableWidth, rowHeight, 'F');
    }
    
    doc.setTextColor(46, 46, 46);
    row.forEach((cell, colIndex) => {
      doc.text(cell, 17 + colIndex * colWidth, currentY + 5.5);
    });
    
    currentY += rowHeight;
  });
  
  // Border
  doc.setDrawColor(230, 230, 230);
  doc.rect(15, startY, tableWidth, currentY - startY, 'S');
  
  return currentY + 10;
};

export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M XOF`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k XOF`;
  }
  return `${value.toLocaleString('fr-FR')} XOF`;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatMonth = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
};

export const downloadPDF = (doc: jsPDF, filename: string): void => {
  doc.save(filename);
};
