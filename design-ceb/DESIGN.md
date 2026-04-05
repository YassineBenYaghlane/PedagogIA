# Charte Design : L'Équilibre Sophistiqué
**Document de Direction Artistique pour Junior Designers**

## 1. Étoile du Nord : L'Explorateur Curateur
Pour un public de 12 ans, nous devons rejeter l'esthétique "jouet" tout en évitant la froideur institutionnelle. Notre direction créative est **"L'Explorateur Curateur"**. 

Le design ne doit pas ressembler à un manuel scolaire, mais à une plateforme de curation moderne. Nous brisons la structure rigide des grilles traditionnelles par une **asymétrie intentionnelle** : des éléments qui se chevauchent légèrement, des échelles typographiques contrastées et une profondeur de champ créée par des couches de verre translucide. L'objectif est de créer un sentiment d'autorité ludique.

---

## 2. Palette Chromatique & Textures
La couleur n'est pas un simple remplissage ; c'est un outil de hiérarchisation.

*   **Primaire (Bleu Azur) :** `#0059b6` – Notre ancrage "Sérieux". À utiliser pour les actions structurantes.
*   **Secondaire (Jaune Tournesol) :** `#705900` – L'accent "Ludique". Éveille l'attention sans agresser.
*   **Tertiaire (Vert Menthe) :** `#00694b` – La couleur de la validation et du progrès.

### Les Règles d'Or de la Couleur :
1.  **La Règle du "Sans-Ligne" :** Il est formellement interdit d'utiliser des bordures pleines de 1px pour sectionner l'espace. La séparation des contenus doit se faire exclusivement par le changement de ton du fond (ex: une section `surface-container-low` sur un fond `surface`) ou par des transitions tonales subtiles.
2.  **Hiérarchie des Surfaces :** Utilisez les jetons `surface-container` (Lowest à Highest) comme des feuilles de papier fin empilées. Plus un élément est interactif ou important, plus sa surface doit monter en gamme (ex: un conteneur `highest` sur un fond `low`).
3.  **Signature Visuelle "Gradiant Soul" :** Pour les boutons principaux (CTA) et les en-têtes, utilisez un dégradé linéaire subtil allant de `primary` à `primary-container`. Cela apporte une vibration organique que le plat ne permet pas.
4.  **Effet "Glass" :** Pour les éléments flottants (modales, menus contextuels), utilisez les couleurs de surface avec une opacité de 80% et un `backdrop-blur` (flou d'arrière-plan) de 12px.

---

## 3. Typographie Éditoriale
Le contraste est notre meilleur allié pour guider l'œil du pré-ado.

*   **Titres (Plus Jakarta Sans) :** Une police géométrique et moderne. Utilisez les échelles `display-lg` et `headline-lg` avec une approche éditoriale : n'hésitez pas à utiliser des tailles très grandes pour les titres de sections afin de créer un impact visuel fort.
*   **Corps de texte (Be Vietnam Pro) :** Une lisibilité absolue. Son aspect "amical" vient de ses courbes ouvertes.
*   **Hiérarchie :** Le passage d'un `headline-md` à un `body-md` doit être franc. L'espace blanc (le vide) autour de la typographie est aussi important que le texte lui-même.

---

## 4. Élévation & Profondeur Naturelle
Nous remplaçons la structure rigide par une **stratification tonale**.

*   **Le Principe d'Empilement :** Pour créer du relief, posez une carte `surface-container-lowest` sur une section `surface-container-low`. La différence de luminosité crée une séparation naturelle et douce.
*   **Ombres Ambiantes :** Si un élément doit "flotter", utilisez des ombres ultra-diffuses. 
    *   *Shadow-key :* Blur 24px, Opacité 6%.
    *   *Shadow-color :* Utilisez une version teintée du `on-surface` plutôt que du noir pur pour simuler une lumière naturelle.
*   **La Bordure Fantôme (Ghost Border) :** Si une limite est requise pour l'accessibilité, utilisez le token `outline-variant` à 15% d'opacité. Jamais d'opacité à 100%.

---

## 5. Composants Signature

### Boutons
*   **Primaire :** Rayon `xl` (1.5rem), dégradé `primary` vers `primary-container`, ombre douce colorée.
*   **États :** Au survol (hover), l'élément doit subir une légère translation verticale (-2px) pour simuler une réaction physique.

### Cartes & Listes
*   **Interdiction des Diviseurs :** Ne séparez jamais deux éléments de liste par une ligne. Utilisez un espacement généreux (Spacing Scale) ou une alternance très légère de teintes de fond.
*   **Asymétrie :** Sur les listes de modules de cours, alternez légèrement l'alignement des icônes ou la largeur des cartes pour briser la monotonie.

### Champs de Saisie (Inputs)
*   Utilisez la surface `surface-container-low`. Lors du focus, ne changez pas la bordure de manière agressive ; augmentez légèrement la luminosité du fond et appliquez une "bordure fantôme" `primary`.

### Composant Spécifique : La Pastille de Progression
Pour l'aspect éducatif, utilisez des "Orbes de Savoir" : des cercles parfaits utilisant la couleur `tertiary` avec un effet de verre (glassmorphism) pour indiquer les leçons terminées.

---

## 6. Do's & Don'ts

| À Faire (Do) | À Éviter (Don't) |
| :--- | :--- |
| Utiliser des rayons de coins généreux (`xl`) pour la douceur. | Utiliser des coins saillants qui rappellent l'administration. |
| Créer du contraste par la taille de la police (très grand vs petit). | Utiliser uniquement le gras (Bold) pour hiérarchiser. |
| Séparer les sections par des changements de couleur de fond. | Utiliser des lignes horizontales (diviseurs) systématiques. |
| Privilégier les micro-interactions de "rebond" (Spring physics). | Utiliser des animations linéaires et rigides. |
| Utiliser des ombres teintées et presque invisibles. | Utiliser des ombres portées noires et dures ("Drop shadows"). |

**Note de Direction :** Le succès de ce système réside dans sa capacité à paraître simple tout en étant techniquement complexe dans sa gestion des blancs et des transparences. Ne remplissez pas l'espace ; laissez le design respirer.