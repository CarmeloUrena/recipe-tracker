import jsPDF from 'jspdf';
import type { Recipe, RecipeVersion } from '@/types';

export const generatePDF = (recipe: Recipe, version: RecipeVersion) => {
  const doc = new jsPDF();
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(recipe.name, 20, 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Version ${version.version_number}`, 20, 30);
  
  let yPos = 45;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Ingredients', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  version.ingredients.forEach(ing => {
    doc.text(`• ${ing}`, 25, yPos);
    yPos += 7;
  });

  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Directions', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  version.directions.forEach((dir, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${dir}`, 170);
    doc.text(lines, 25, yPos);
    yPos += (7 * lines.length);
  });

  if (version.notes) {
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes', 20, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'italic');
    const noteLines = doc.splitTextToSize(version.notes, 170);
    doc.text(noteLines, 25, yPos);
  }

  doc.save(`${recipe.name.replace(/\s+/g, '_')}_v${version.version_number}.pdf`);
};
