# Guide de déploiement — Ba-Diaby Express

Ce guide suppose que vous avez déjà : un compte [GitHub](https://github.com) et un
compte [Vercel](https://vercel.com) (vous pouvez créer le compte Vercel avec votre
compte GitHub directement, c'est le plus simple).

---

## Étape 1 — Créer le dépôt GitHub

Je ne peux pas créer le dépôt à votre place (je n'ai pas accès à votre compte),
mais voici exactement comment faire.

### Option A — Depuis le site GitHub (le plus simple)

1. Allez sur https://github.com/new
2. Nom du dépôt : `ba-diaby-express` (ou ce que vous voulez)
3. Laissez-le en **Private** si vous ne voulez pas que le code soit public
4. Ne cochez aucune case d'initialisation (pas de README, pas de .gitignore — on les a déjà)
5. Cliquez sur **Create repository**
6. GitHub vous montre une page avec des commandes — gardez-la ouverte, vous en aurez besoin à l'étape 2

### Option B — Depuis votre ordinateur avec GitHub CLI

```bash
gh repo create ba-diaby-express --private --source=. --remote=origin
```

---

## Étape 2 — Envoyer le code sur GitHub

Téléchargez le dossier du projet que je vous ai fourni, ouvrez un terminal dedans, puis :

```bash
cd ba-diaby-express
git init
git add .
git commit -m "Version initiale — Ba-Diaby Express"
git branch -M main
git remote add origin https://github.com/VOTRE-NOM-UTILISATEUR/ba-diaby-express.git
git push -u origin main
```

Remplacez `VOTRE-NOM-UTILISATEUR` par votre identifiant GitHub. Si on vous demande de
vous authentifier, suivez les instructions de GitHub (jeton d'accès personnel ou
connexion via le navigateur).

---

## Étape 3 — Connecter GitHub à Vercel

1. Allez sur https://vercel.com/new
2. Cliquez sur **Import Git Repository**
3. Si ce n'est pas déjà fait, autorisez Vercel à accéder à votre compte GitHub
4. Sélectionnez le dépôt `ba-diaby-express` dans la liste
5. Vercel détecte automatiquement **Vite** comme framework — laissez les réglages par défaut :
   - Build Command : `npm run build`
   - Output Directory : `dist`
6. **Avant de cliquer sur Deploy**, ouvrez la section **Environment Variables** et ajoutez :
   - Nom : `ANTHROPIC_API_KEY`
   - Valeur : votre clé API (récupérée sur https://console.anthropic.com/settings/keys)
   - Cochez les 3 environnements (Production, Preview, Development)
7. Cliquez sur **Deploy**

Après 1 à 2 minutes, Vercel vous donne une URL du type `ba-diaby-express.vercel.app` —
votre site est en ligne.

**Important** : à chaque fois que vous (ou moi, si vous me redonnez du code) poussez
une modification sur la branche `main` de GitHub, Vercel redéploie automatiquement le
site. C'est ce lien GitHub ↔ Vercel qui permet les mises à jour continues.

---

## Étape 4 — Connecter votre nom de domaine

Une fois le domaine acheté (chez Namecheap, OVH, Google Domains, etc.) :

1. Dans votre projet sur Vercel, allez dans **Settings → Domains**
2. Tapez votre nom de domaine (ex : `badiaby-express.com`) et cliquez sur **Add**
3. Vercel vous indique les enregistrements DNS à ajouter — en général :
   - Pour le domaine racine (`badiaby-express.com`) : un enregistrement **A** pointant vers `76.76.21.21`
   - Pour un sous-domaine (`www.badiaby-express.com`) : un enregistrement **CNAME** pointant vers `cname.vercel-dns.com`
4. Allez chez votre registrar (là où vous avez acheté le domaine), ouvrez la gestion DNS, et ajoutez exactement les enregistrements indiqués par Vercel
5. Revenez sur Vercel — la validation se fait automatiquement, ça prend généralement de quelques minutes à quelques heures (le temps que le changement DNS se propage)
6. Vercel active automatiquement le certificat HTTPS (cadenas) une fois le domaine validé — rien à faire de votre côté

---

## Compatibilité Vercel — confirmée ✅

Ce projet est un site **Vite + React** classique avec deux petites fonctions serverless
(`api/claude.js`). C'est exactement le type de projet pour lequel Vercel est conçu :
détection automatique, build en une commande, fonctions serverless incluses sans
configuration supplémentaire. Aucun changement d'architecture n'est nécessaire.

---

## Aller plus loin : vraie base de données (recommandé avant un usage à plusieurs agences)

Le stockage actuel (`src/lib/storage.js`) utilise le localStorage du navigateur : chaque
appareil a ses propres données, sans synchronisation. Pour un vrai partage en temps réel
entre agents, agences et appareils (comme demandé dans le cahier des charges initial),
il faut migrer vers une base de données hébergée. Recommandation : **Supabase**
(gratuit pour démarrer, base PostgreSQL, se branche facilement à Vercel).

Grandes lignes de la migration (à faire dans une prochaine session si vous le souhaitez) :

1. Créer un projet sur https://supabase.com
2. Créer une table `bde_data` avec une colonne `value` (type `jsonb`)
3. Remplacer le contenu de `src/lib/storage.js` par des appels à `@supabase/supabase-js`
   au lieu de `localStorage` — la même interface (`get`/`set`/`delete`/`list`) peut être
   gardée, donc le reste de l'application n'a pas besoin de changer
4. Ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les variables d'environnement Vercel
5. Activer Supabase Realtime pour que les changements apparaissent instantanément chez
   tous les utilisateurs connectés, sans recharger la page

Dites-le-moi quand vous voulez vous y attaquer, je peux préparer ce code précisément.
