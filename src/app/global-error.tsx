"use client"; // Les error boundaries doivent être des Client Components.

import { useEffect } from "react";

/**
 * Dernier filet : erreur DANS le layout racine lui-même. À ce niveau, le layout
 * (polices next/font, tokens `@theme`) est justement ce qui a échoué — on ne peut
 * donc pas compter sur les classes Tailwind de marque. Cet écran est volontairement
 * autonome, en styles inline avec les hex de la palette (même exception que les
 * PDF / OG images de DESIGN.md : un support sans Tailwind). Il doit fournir ses
 * propres balises <html> et <body>, puisqu'il remplace le layout racine.
 *
 * Next 16 : la récupération passe par `unstable_retry` (ex-`reset`).
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[app] erreur racine non gérée:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f0e9", // papier
          color: "#16202b", // encre
          fontFamily:
            "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "32rem", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#35507f", // accent
            }}
          >
            Une erreur est survenue
          </p>
          <h1
            style={{
              margin: "12px 0 0",
              fontSize: "1.875rem",
              fontWeight: 600,
              lineHeight: 1.15,
            }}
          >
            Dossimo est momentanément indisponible
          </h1>
          <p
            style={{
              margin: "16px auto 0",
              maxWidth: "28rem",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: "#5b636d", // ardoise
            }}
          >
            Le problème vient de chez nous. Vos données sont enregistrées.
            Réessayez dans un instant.
          </p>

          {error.digest && (
            <p
              style={{
                margin: "16px 0 0",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "#9aa1a9", // encre-claire
              }}
            >
              Référence : {error.digest}
            </p>
          )}

          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              marginTop: "32px",
              height: "44px",
              padding: "0 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#35507f", // accent
              color: "#fbf9f3", // blanc-casse
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>

          <p
            style={{
              margin: "40px 0 0",
              fontSize: "0.75rem",
              color: "#9aa1a9", // encre-claire
            }}
          >
            Dossimo · service indépendant d&rsquo;aide à la préparation de
            dossier, non affilié à l&rsquo;Anah ni à France Rénov&rsquo;.
          </p>
        </div>
      </body>
    </html>
  );
}