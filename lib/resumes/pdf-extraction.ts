import "server-only";

const MAX_PDF_PAGES = 50;
const MAX_EXTRACTED_CHARACTERS = 200_000;

export class ResumeProcessingError extends Error {
  readonly code: "INVALID_PDF" | "PDF_TOO_MANY_PAGES" | "PDF_TEXT_EMPTY" | "PDF_TEXT_TOO_LONG" | "PDF_PASSWORD_REQUIRED";

  constructor(message: string, code: ResumeProcessingError["code"]) {
    super(message);
    this.name = "ResumeProcessingError";
    this.code = code;
  }
}

export async function extractPdfText(bytes: Uint8Array) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    // PDF.js transfers this buffer to its worker; keep the upload bytes intact for storage.
    data: bytes.slice(),
    stopAtErrors: true,
    verbosity: 0,
  });

  try {
    const document = await loadingTask.promise;
    if (document.numPages < 1 || document.numPages > MAX_PDF_PAGES) {
      throw new ResumeProcessingError(
        `Choose a PDF with ${MAX_PDF_PAGES} pages or fewer.`,
        "PDF_TOO_MANY_PAGES",
      );
    }

    const pages: string[] = [];
    let characterCount = 0;

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : ""))
        .join("")
        .trim();
      characterCount += pageText.length;
      if (characterCount > MAX_EXTRACTED_CHARACTERS) {
        throw new ResumeProcessingError(
          "This PDF contains more text than SENSAI can safely process. Use a shorter resume PDF.",
          "PDF_TEXT_TOO_LONG",
        );
      }
      if (pageText) pages.push(pageText);
      page.cleanup();
    }

    const text = pages.join("\n\n").trim();
    if (!text) {
      throw new ResumeProcessingError(
        "This PDF has no selectable text. Upload a text-based PDF instead of a scanned image.",
        "PDF_TEXT_EMPTY",
      );
    }

    return { text, pageCount: document.numPages };
  } catch (error) {
    if (error instanceof ResumeProcessingError) throw error;
    if (error && typeof error === "object" && "name" in error && error.name === "PasswordException") {
      throw new ResumeProcessingError("This PDF is password-protected. Remove the password and upload it again.", "PDF_PASSWORD_REQUIRED");
    }
    if (error instanceof Error) {
      console.warn("Resume PDF extraction failed", { name: error.name, message: error.message.slice(0, 180) });
    } else {
      console.warn("Resume PDF extraction failed", { name: "UnknownError" });
    }
    throw new ResumeProcessingError("SENSAI could not open this PDF. Re-save it as a searchable, text-based PDF and try again.", "INVALID_PDF");
  } finally {
    await loadingTask.destroy().catch(() => undefined);
  }
}
