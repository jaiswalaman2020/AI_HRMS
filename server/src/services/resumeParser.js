import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Extract plain text from an uploaded resume buffer.
// Supports PDF (via pdf-parse) and plain text; other types fall back to utf-8.
export async function extractResumeText(file) {
  if (!file) return '';
  const mime = file.mimetype || '';
  try {
    if (mime === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf')) {
      // pdf-parse is CommonJS; load lazily so the app boots even if unused.
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(file.buffer);
      return data.text || '';
    }
  } catch (err) {
    console.warn('PDF parse failed, falling back to raw text:', err.message);
  }
  // Plain text / docx-as-text / fallback
  return file.buffer ? file.buffer.toString('utf-8') : '';
}
