import jsPDF from 'jspdf';

export interface PDFPageData {
  storyText: string;
  compositeUrl?: string;
  sequenceNumber: number;
}

export interface PDFGenerationData {
  title: string;
  authorName: string;
  pages: PDFPageData[];
  layout: 'classic' | 'full-bleed' | 'side-by-side';
}

/**
 * Generates a PDF from story data
 * Returns a Blob that can be downloaded or printed
 */
export async function generatePDF(data: PDFGenerationData): Promise<Blob> {
  // A5 landscape: 148mm x 210mm (landscape: 210mm x 148mm)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Cover page
  pdf.setFillColor(200, 150, 255); // Purple gradient effect
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Title on cover
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.text(data.title, pageWidth / 2, pageHeight / 2 - 20, {
    align: 'center',
  });

  // Author on cover
  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.text(`Written and illustrated by ${data.authorName}`, pageWidth / 2, pageHeight / 2 + 20, {
    align: 'center',
  });

  // Story pages
  for (const page of data.pages) {
    pdf.addPage('a5', 'landscape');

    // Add background color
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    if (data.layout === 'classic') {
      // Image in top 60%
      if (page.compositeUrl) {
        const imageHeight = (pageHeight * 0.6);
        try {
          pdf.addImage(
            page.compositeUrl,
            'PNG',
            0,
            0,
            pageWidth,
            imageHeight
          );
        } catch (e) {
          // Image failed to load, continue
          console.error('Failed to add image to PDF:', e);
        }
      }

      // Text in bottom 40%
      const textStartY = pageHeight * 0.6 + 5;
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);

      const textLines = pdf.splitTextToSize(
        page.storyText,
        pageWidth - 10
      );
      pdf.text(textLines, 5, textStartY);
    } else if (data.layout === 'full-bleed') {
      // Image as full background
      if (page.compositeUrl) {
        try {
          pdf.addImage(
            page.compositeUrl,
            'PNG',
            0,
            0,
            pageWidth,
            pageHeight
          );
        } catch (e) {
          console.error('Failed to add image to PDF:', e);
        }
      }

      // Semi-transparent overlay at bottom
      pdf.setFillColor(60, 30, 90); // purple-900
      (pdf as any).setGlobalAlpha?.(0.7);
      pdf.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
      (pdf as any).setGlobalAlpha?.(1);

      // Text overlay
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);

      const textLines = pdf.splitTextToSize(
        page.storyText,
        pageWidth - 10
      );
      pdf.text(textLines, 5, pageHeight * 0.65);
    } else if (data.layout === 'side-by-side') {
      // Image on left 50%
      if (page.compositeUrl) {
        const imageWidth = pageWidth / 2;
        try {
          pdf.addImage(
            page.compositeUrl,
            'PNG',
            0,
            0,
            imageWidth,
            pageHeight
          );
        } catch (e) {
          console.error('Failed to add image to PDF:', e);
        }
      }

      // Text on right 50%
      pdf.setFillColor(255, 255, 255);
      pdf.rect(pageWidth / 2, 0, pageWidth / 2, pageHeight, 'F');

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);

      const textLines = pdf.splitTextToSize(
        page.storyText,
        pageWidth / 2 - 10
      );
      pdf.text(textLines, pageWidth / 2 + 5, 10);
    }

    // Page number
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${page.sequenceNumber}`,
      pageWidth - 15,
      pageHeight - 5,
      { align: 'right' }
    );
  }

  // Back page
  pdf.addPage('a5', 'landscape');
  pdf.setFillColor(255, 250, 240); // Light purple tint
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(32);
  pdf.setTextColor(100, 50, 150);
  pdf.text('The End', pageWidth / 2, pageHeight / 2 - 10, {
    align: 'center',
  });

  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`A story by ${data.authorName}`, pageWidth / 2, pageHeight / 2 + 15, {
    align: 'center',
  });

  const today = new Date().toLocaleDateString();
  pdf.setFontSize(10);
  pdf.text(today, pageWidth / 2, pageHeight / 2 + 25, {
    align: 'center',
  });

  // Return as Blob
  return pdf.output('blob') as Blob;
}
