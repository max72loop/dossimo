import { describe, expect, it } from "vitest";

import { isAcceptedDocument } from "@/lib/piece/file-validation";

describe("isAcceptedDocument", () => {
  it("accepte les signatures correspondant aux formats autorisés", () => {
    expect(isAcceptedDocument(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), "application/pdf")).toBe(true);
    expect(isAcceptedDocument(new Uint8Array([0xff, 0xd8, 0xff]), "image/jpeg")).toBe(true);
    expect(isAcceptedDocument(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).toBe(true);
    expect(isAcceptedDocument(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), "image/webp")).toBe(true);
  });

  it("refuse un MIME falsifié ou un format inconnu", () => {
    expect(isAcceptedDocument(new Uint8Array([0x3c, 0x73, 0x76, 0x67]), "image/png")).toBe(false);
    expect(isAcceptedDocument(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), "image/svg+xml")).toBe(false);
  });
});

