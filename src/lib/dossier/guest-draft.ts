import type { CeeIsolationInput } from "@/lib/dossier/cee-isolation";

const VALUES_KEY = "dossimo:essai:valeurs";
const DB_NAME = "dossimo-essai";
const STORE_NAME = "documents";

export type GuestDraft = {
  valeurs: Partial<CeeIsolationInput>;
  champsTrouves: string[];
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveGuestDraft(draft: GuestDraft, file: File): Promise<void> {
  sessionStorage.setItem(VALUES_KEY, JSON.stringify(draft));
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(file, "devis");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Les valeurs reconnues restent reprises même si le navigateur refuse le Blob.
  }
}

export async function loadGuestDraft(): Promise<(GuestDraft & { file?: File }) | null> {
  const raw = sessionStorage.getItem(VALUES_KEY);
  if (!raw) return null;
  const draft = JSON.parse(raw) as GuestDraft;
  try {
    const db = await openDb();
    const file = await new Promise<File | undefined>((resolve, reject) => {
      const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get("devis");
      request.onsuccess = () => resolve(request.result as File | undefined);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return { ...draft, file };
  } catch {
    return draft;
  }
}

export async function clearGuestDraft(): Promise<void> {
  sessionStorage.removeItem(VALUES_KEY);
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete("devis");
    db.close();
  } catch {
    // Le dossier est déjà créé : le nettoyage local reste best-effort.
  }
}
