/**
 * Remplace window.storage (spécifique à l'environnement Claude Artifacts) par une
 * implémentation basée sur localStorage, pour que l'application fonctionne comme
 * un site web autonome.
 *
 * ATTENTION — LIMITE IMPORTANTE :
 * localStorage est propre à CHAQUE navigateur / appareil. Deux personnes qui ouvrent
 * le site depuis deux ordinateurs différents ne verront PAS les mêmes données.
 * Pour une vraie synchronisation multi-utilisateurs et multi-appareils (comme demandé
 * dans le cahier des charges "temps réel"), il faut migrer vers une vraie base de
 * données (Supabase, Firebase...). Voir DEPLOIEMENT.md, section "Aller plus loin".
 *
 * L'API (get/set/delete/list) est volontairement identique à window.storage pour que
 * le reste de l'application n'ait presque rien à changer.
 */

const PREFIX = "bde:";

function fullKey(key, shared) {
  // "shared" n'a plus de sens avec localStorage (tout est local à ce navigateur),
  // on garde le paramètre pour compatibilité mais on ignore la distinction.
  return `${PREFIX}${key}`;
}

export const storage = {
  async get(key, shared) {
    const raw = localStorage.getItem(fullKey(key, shared));
    if (raw === null) throw new Error(`Clé "${key}" introuvable`);
    return { key, value: raw, shared: !!shared };
  },

  async set(key, value, shared) {
    localStorage.setItem(fullKey(key, shared), value);
    return { key, value, shared: !!shared };
  },

  async delete(key, shared) {
    localStorage.removeItem(fullKey(key, shared));
    return { key, deleted: true, shared: !!shared };
  },

  async list(prefix, shared) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        const bare = k.slice(PREFIX.length);
        if (!prefix || bare.startsWith(prefix)) keys.push(bare);
      }
    }
    return { keys, prefix, shared: !!shared };
  },
};
