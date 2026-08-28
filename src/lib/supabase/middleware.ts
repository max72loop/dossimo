import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { construireCsp } from "@/lib/security/csp";

/**
 * Fenêtre laissée à Supabase pour rafraîchir la session, en millisecondes.
 *
 * Le proxy s'exécute devant TOUTES les routes, vitrine comprise. Un appel non
 * borné vers Supabase Auth transforme donc la moindre lenteur de leur côté en
 * panne totale du site. C'est arrivé le 2026-08-27 : l'incident Supabase
 * « Increased response times for requests » a fait expirer le proxy, et Vercel
 * a renvoyé `504 MIDDLEWARE_INVOCATION_TIMEOUT` sur chaque page — y compris la
 * landing, les guides et le cluster refus, qui n'ont aucun besoin de session.
 *
 * La valeur reste très en dessous de la limite d'exécution du proxy : on préfère
 * servir la page avec une session non rafraîchie qu'un 504 sur tout le site.
 */
const DELAI_RAFRAICHISSEMENT_MS = 2_500;

/**
 * Rafraîchir n'a de sens que si le navigateur présente déjà un cookie de
 * session. Un visiteur anonyme — donc tout le trafic d'acquisition — ne doit
 * jamais dépendre de la disponibilité de Supabase Auth pour lire la vitrine.
 *
 * `@supabase/ssr` nomme ses cookies `sb-<ref>-auth-token`, éventuellement
 * découpés en `.0`, `.1` quand le jeton dépasse la taille d'un cookie.
 */
function possedeCookieSession(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}

/**
 * Refreshes the Supabase auth session on every matched request and keeps the
 * auth cookies in sync between the browser and Server Components.
 */
export async function updateSession(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const csp = construireCsp({ nonce, isDev });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const nextResponse = () => NextResponse.next({ request: { headers: requestHeaders } });
  let response = nextResponse();

  // Visiteur anonyme : rien à rafraîchir, et surtout aucune raison de faire
  // dépendre la vitrine d'un appel réseau vers Supabase.
  if (!possedeCookieSession(request)) {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  // Passé le délai, on cesse d'écrire dans la réponse : elle est déjà partie.
  let rafraichissementAbandonne = false;

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          if (rafraichissementAbandonne) return;
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = nextResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touch the session so tokens refresh. Do not run logic between client
  // creation and this call, per Supabase SSR guidance.
  //
  // L'appel est borné et ne rejette jamais : en cas de panne Supabase on échoue
  // dans le journal, pas en 504. Les cookies déjà présents restent en place, et
  // les espaces protégés refont leur propre contrôle (`getCurrentArtisan` dans
  // `app/dossiers/layout.tsx` et `app/devis/layout.tsx`) — laisser passer ici
  // n'ouvre donc aucun accès.
  const rafraichissement = supabase.auth
    .getUser()
    .then(({ error }) => (error ? `échec: ${error.message}` : "ok"))
    .catch((cause: unknown) =>
      `échec: ${cause instanceof Error ? cause.message : String(cause)}`,
    );

  let minuteur: ReturnType<typeof setTimeout> | undefined;
  const expiration = new Promise<"expiré">((resolve) => {
    minuteur = setTimeout(() => resolve("expiré"), DELAI_RAFRAICHISSEMENT_MS);
  });

  try {
    const issue = await Promise.race([rafraichissement, expiration]);
    if (issue !== "ok") {
      rafraichissementAbandonne = issue === "expiré";
      console.error(
        `[proxy] Session Supabase non rafraîchie (${issue}) après ${DELAI_RAFRAICHISSEMENT_MS} ms au plus — page servie sans rafraîchissement.`,
      );
    }
  } finally {
    clearTimeout(minuteur);
  }

  response.headers.set("Content-Security-Policy", csp);

  return response;
}
