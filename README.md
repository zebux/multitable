# Multi Tables

Application 100 % statique d'entraînement aux multiplications, conçue pour être
publiée directement sur **GitHub Pages**. Elle ne nécessite ni backend, ni base de
données, ni dépendance externe.

## Fonctionnement

### 1. Configuration

- Les tables de **1 à 10** sont affichées et sélectionnées par défaut.
- Le bouton **Afficher les tables avancées** révèle les tables de **11 à 20**.
- Une ou plusieurs tables peuvent être sélectionnées, y compris toutes les tables.
- Les boutons **Tout cocher** et **Tout décocher** agissent sur les 20 tables.
- Le nombre d'opérations est réglable de **10 à 200** (valeur initiale : **40**).

Une table sélectionnée `n` produit les opérations `n × 1` à `n × 10`.
Si les tables 2 et 4 sont sélectionnées, `2 × 4` et `4 × 2` sont donc deux
opérations distinctes et peuvent toutes deux apparaître.

### 2. Génération des exercices

- Les opérations sont tirées au hasard.
- Chaque paire ordonnée est **unique** : la même multiplication ne peut jamais
  apparaître deux fois dans une série.
- Si le nombre demandé dépasse les combinaisons possibles, un message clair
  propose de sélectionner davantage de tables ou de réduire le nombre d'exercices.
  Par exemple, 10 tables offrent 100 combinaisons ; les 20 tables en offrent 200.

### 3. Saisie

- Chaque exercice dispose d'un champ numérique avec clavier numérique sur mobile.
- **Entrée** passe à l'exercice suivant ; sur le dernier champ, le focus va au
  bouton **Corriger**.
- Les réponses sont conservées pendant toute la séance.

### 4. Correction en deux étapes

1. **Premier clic sur Corriger** : seules les couleurs apparaissent.
   - Vert = bonne réponse.
   - Rouge = erreur.
   - Les réponses fausses restent modifiables et le score provisoire est affiché
     (total, réussites, erreurs, pourcentage). Les bonnes réponses ne sont jamais
     révélées à cette étape.
2. **Deuxième clic sur Corriger** : la correction complète s'affiche.
   - Chaque erreur devient `4 × 8 = ~~24~~ → 32`, avec le mauvais résultat barré
     et la bonne réponse en rouge.
   - Le bilan final remplace le score provisoire.
   - Un message de félicitations apparaît en cas de 100 % de réussite.

Les boutons **Recommencer** et **Retour à la configuration** sont toujours
disponibles. Recommencer génère une nouvelle série avec les mêmes paramètres.

## Fichiers

| Fichier      | Rôle                                              |
| ------------ | ------------------------------------------------- |
| `index.html` | Structure HTML5 des deux vues de l'application    |
| `style.css`  | Mise en page responsive, thèmes clair/sombre, UI  |
| `script.js`  | Génération, navigation clavier, correction        |
| `README.md`  | Documentation et instructions de déploiement      |

## Qualité et accessibilité

- HTML5, CSS moderne et JavaScript ES6 natif, commentés et découpés en fonctions.
- Aucune bibliothèque, aucun appel réseau, aucune donnée stockée ou envoyée.
- Interface responsive (ordinateur, tablette, smartphone) avec de gros boutons.
- Mode clair/sombre automatique selon les préférences du système.
- Contraste élevé, labels explicites, focus visible, Navigation clavier et
  attributs ARIA (`aria-live`, `aria-expanded`, `aria-invalid`,
  `aria-describedby`).
- Animations légères, désactivées si l'utilisateur préfère réduire les mouvements.

## Déploiement sur GitHub Pages

1. Créez un dépôt GitHub (par exemple `multitable`).
2. Ajoutez les quatre fichiers à la **racine** du dépôt :
   `index.html`, `style.css`, `script.js` et `README.md`.
3. Publiez sur la branche principale (`main` ou `master`) :

   ```bash
   git add index.html style.css script.js README.md
   git commit -m "Add static multiplication trainer"
   git push origin main
   ```

4. Dans le dépôt, ouvrez **Settings** → **Pages**.
5. Dans **Build and deployment**, choisissez :
   - **Source** : `Deploy from a branch`
   - **Branch** : `main` (ou `master`) et dossier `/ (root)`
6. Cliquez sur **Save**. Après quelques instants, l'application est disponible à
   l'adresse `https://<votre-pseudo>.github.io/<nom-du-depot>/`.

Aucune étape de build ou de configuration supplémentaire n'est nécessaire.

## Test local

Ouvrez simplement `index.html` dans un navigateur.

Vous pouvez aussi lancer un petit serveur statique local :

```bash
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.
