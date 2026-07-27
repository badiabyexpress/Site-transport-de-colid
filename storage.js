/**
 * Remplace window.storage (spécifique à l'environnement Claude Artifacts) par une
 * implémentation Supabase, pour que TOUS les appareils et utilisateurs qui ouvrent
 * le site partagent réellement les mêmes données, en temps réel.
 *
 * L'API (get/set/delete/list) reste volontairement identique à window.storage pour
 * que le reste de l'application (App.jsx) n'ait presque rien à changer.
 *
 * NOTE DE SÉCURITÉ IMPORTANTE :
 * L'application gère son propre écran de connexion interne (identifiant/mot de passe),
 * indépendant de Supabase Auth. La table `bde_data` est donc accessible en lecture/écriture
 * via la clé publique "anon" (nécessaire puisque le site n'utilise pas de compte Supabase
 * par utilisateur), et la protection réelle est l'écran de connexion de l'application.
 * Cela veut dire que la clé anon, présente dans le code envoyé au navigateur, permettrait
 * techniquement à quelqu'un qui l'extrairait de lire/modifier les données directement,
 * en contournant l'écran de connexion. Pour un usage interne d'entreprise c'est un
 * compromis raisonnable, mais si vous stockez des données très sensibles, il faudra migrer
 * vers de vrais comptes Supabase Auth + des règles RLS par utilisateur.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être configurées (voir .env.example).");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLE = "bde_data";

export const storage = {
  async get(key, shared) {
    const { data, error } = await supabase.from(TABLE).select("value").eq("key", key).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Clé "${key}" introuvable`);
    return { key, value: JSON.stringify(data.value), shared: !!shared };
  },

  async set(key, value, shared) {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    const { error } = await supabase.from(TABLE).upsert({ key, value: parsed, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { key, value, shared: !!shared };
  },

  async delete(key, shared) {
    const { error } = await supabase.from(TABLE).delete().eq("key", key);
    if (error) throw error;
    return { key, deleted: true, shared: !!shared };
  },

  async list(prefix, shared) {
    let query = supabase.from(TABLE).select("key");
    if (prefix) query = query.like("key", `${prefix}%`);
    const { data, error } = await query;
    if (error) throw error;
    return { keys: (data || []).map((r) => r.key), prefix, shared: !!shared };
  },
};

/**
 * S'abonne aux changements en temps réel d'une clé donnée (ex: "bde-data").
 * callback(newValueString) est appelé à chaque fois qu'un AUTRE appareil/onglet modifie la donnée,
 * pour que l'application puisse rafraîchir son état sans que l'utilisateur ait à recharger la page.
 * Retourne une fonction "unsubscribe" à appeler au démontage du composant.
 */
export function subscribeToChanges(key, callback) {
  const channel = supabase
    .channel(`bde_data_changes_${key}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `key=eq.${key}` },
      (payload) => {
        if (payload.new && payload.new.value !== undefined) {
          callback(JSON.stringify(payload.new.value));
        }
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
