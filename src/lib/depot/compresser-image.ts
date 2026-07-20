/**
 * Réduction d'une photo AVANT l'envoi, côté navigateur.
 *
 * Le bénéficiaire photographie ses papiers au téléphone. Un capteur récent sort du
 * 8 à 12 Mo par cliché, pour un document dont 2000 px de large suffisent largement à
 * la lecture (c'est la résolution que le VLM reçoit de toute façon). Envoyer l'original
 * en 4G, c'est trente secondes d'attente muette, un `TAILLE_MAX` de 15 Mo frôlé, et un
 * client qui recharge la page en croyant que c'est planté.
 *
 * Trois garde-fous, parce que dégrader une pièce justificative est pire que l'envoyer
 * lourde :
 *  - les PDF ne sont JAMAIS touchés (un avis d'imposition est souvent un PDF natif,
 *    le rastériser détruirait sa netteté et le texte sélectionnable) ;
 *  - une image déjà petite est renvoyée telle quelle ;
 *  - au moindre échec (canvas indisponible, image illisible, résultat plus lourd que
 *    l'original), on renvoie le fichier d'origine. La compression est un confort, pas
 *    une condition d'envoi.
 */

/** Côté le plus long, en pixels. Au-delà, on ne gagne plus en lisibilité. */
const COTE_MAX = 2000;

/** En deçà, le gain ne vaut pas le risque de recompresser une image déjà propre. */
const SEUIL_OCTETS = 1_500_000;

const QUALITE_JPEG = 0.85;

function chargerImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible."));
    };
    img.src = url;
  });
}

export async function compresserImage(file: File): Promise<File> {
  if (file.type === "application/pdf") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= SEUIL_OCTETS) return file;

  try {
    const img = await chargerImage(file);
    const facteur = Math.min(1, COTE_MAX / Math.max(img.width, img.height));
    if (facteur === 1 && file.size <= SEUIL_OCTETS) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * facteur);
    canvas.height = Math.round(img.height * facteur);

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITE_JPEG),
    );
    // Recompresser un PNG de capture d'écran peut l'alourdir : on garde le meilleur.
    if (!blob || blob.size >= file.size) return file;

    const nom = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${nom}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}