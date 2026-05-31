// THE GAUNTLET — PDF intake helper (UI layer).
// Owned by the onboarding UI; NOT imported by the logic/service layer.
//
// fileToBase64() turns an uploaded File (typically a pitch deck / one-pager PDF)
// into a base64 string WITHOUT the `data:<mime>;base64,` prefix, so the result
// can be dropped straight into CompanyInput.pdfBase64 and forwarded to Gemini as
//   { inlineData: { mimeType: 'application/pdf', data: <this string> } }.

/**
 * Read a File and return its contents as base64 WITHOUT the data: URL prefix.
 *
 * FileReader.readAsDataURL yields `data:application/pdf;base64,JVBERi0...`;
 * we strip everything up to and including the first comma so the caller gets
 * the raw base64 payload Gemini's inlineData part expects.
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(reader.error ?? new Error(`Could not read "${file.name}".`));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Unexpected file reader result (expected a data URL).'));
        return;
      }
      // result === "data:<mime>;base64,<payload>" — keep only <payload>.
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

/** Human-friendly byte size, e.g. 1280 -> "1.3 KB", used for upload chips. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

/** True for PDFs by mime type or extension — used to guard the dropzone. */
export function isPdf(file: File): boolean {
  return (
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );
}
