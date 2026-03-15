/**
 * Opens a pdfmake document in a new browser tab for printing.
 */
export async function printPdf(docDefinition) {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default
  const pdfFonts = await import('pdfmake/build/vfs_fonts')
  pdfMake.vfs = pdfFonts.default ?? pdfFonts
  pdfMake.createPdf(docDefinition).open()
}
