# Ba-Diaby Express — Plateforme de gestion logistique

Application de gestion pour Ba-Diaby Express : colis, tarification multi-devises,
clients, comptabilité, commissions par agence et assistant IA.

## Stack technique

- **React 18** + **Vite** (build rapide, supporté nativement par Vercel)
- **lucide-react** pour les icônes
- Stockage : **localStorage** par défaut (voir limite ci-dessous)
- IA : **Claude (Anthropic)** via une fonction serverless (`api/claude.js`) qui garde la clé API côté serveur

## ⚠️ Limite importante du stockage actuel

Par défaut, les données (colis, utilisateurs, tarifs...) sont stockées dans le
**localStorage du navigateur**. Cela veut dire :

- Aucune donnée n'est perdue si vous rechargez la page ou fermez l'onglet.
- **Mais** deux appareils ou navigateurs différents ne partagent PAS les mêmes données.
  Un agent sur son téléphone ne verra pas les colis créés par un collègue sur son ordinateur.

C'est un excellent point de départ pour tester en production, mais **pas suffisant**
pour une utilisation à plusieurs agents en simultané. Voir `DEPLOIEMENT.md`,
section "Aller plus loin : vraie base de données", pour la marche à suivre.

## Démarrer en local

```bash
npm install
cp .env.example .env   # puis renseignez votre clé ANTHROPIC_API_KEY
npm run dev
```

L'application sera disponible sur http://localhost:5173

Note : les fonctions serverless (`api/claude.js`) ne tournent pas avec `vite dev` seul.
Pour les tester en local, utilisez `vercel dev` (voir DEPLOIEMENT.md) ou déployez
directement sur Vercel.

## Compte de démonstration

- Identifiant : `admin`
- Mot de passe : `admin123`

Pensez à changer ce mot de passe une fois en production (Configuration → Gestion Utilisateurs).

## Structure du projet

```
ba-diaby-express/
├── api/
│   └── claude.js        # Fonction serverless : proxy sécurisé vers l'API Claude
├── src/
│   ├── App.jsx           # Toute l'application (une seule page)
│   ├── main.jsx          # Point d'entrée React
│   └── lib/storage.js    # Couche de stockage (localStorage)
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── .env.example
```

Voir `DEPLOIEMENT.md` pour la mise en ligne complète (GitHub → Vercel → nom de domaine).
