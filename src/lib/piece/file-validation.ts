import "server-only";

/** Formats acceptés côté serveur. Le type MIME transmis par le navigateur seul
 * ne suffit pas : il est entièrement contrôlé par l'expéditeur. */
export const ACCEPTED_DOCUMENT_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

/** Vérifie la signature binaire du fichier et sa cohérence avec le MIME déclaré. */
export function isAcceptedDocument(bytes: Uint8Array, mime: string): boolean {
  if (!ACCEPTED_DOCUMENT_MIMES.has(mime)) return false;

  switch (mime) {
    case "application/pdf":
      return startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
    case "image/jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return (
        startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        startsWith(bytes.slice(8), [0x57, 0x45, 0x42, 0x50])
      );
    default:
      return false;
  }
}
