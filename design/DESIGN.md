# Charte Design — Le Jardin de PédagogIA
*Hortus Mathematicus · v1*

Référence visuelle : `design/JARDIN.html` + `design/jardin-screens/`.

## 1. Étoile du Nord — La Serre Savante

PedagogIA est une serre calme. Chaque compétence est une plante, chaque séance un soin, chaque rang acquis une floraison. Le design parle de croissance lente, de patience, d'érudition douce. Pas de mascotte qui saute, pas de confettis arc-en-ciel, pas de pastel bonbon — l'enfant apprend en tant qu'apprenti jardinier, pas en tant qu'utilisateur d'un jeu vidéo.

**Public :** 6–12 ans (FWB, P1–P6). **Surfaces :** tablette 834×1194 + navigateur 1440×900.

## 2. Palette

Trois familles, jamais plus de trois ensemble dans un même composant.

| Jeton | Hex | Rôle |
|---|---|---|
| `bone` | `#FFFFFF` | surface principale |
| `chalk` | `#F6F8F3` | fond de page |
| `mist` | `#ECF1E7` | surface secondaire |
| `paper` | `#FAFCF7` | carte / tag |
| `sage` | `#6FA274` | primaire, validation |
| `sage-deep` | `#3F6F4A` | titres, accent |
| `sage-soft` | `#A6C7A8` | trait atténué |
| `sage-leaf` | `#C7E0B5` | chips, halos, twine |
| `sky` | `#B8DCEA` | accent IA / indices |
| `sky-soft` | `#DCEDF4` | fond sky |
| `sky-deep` | `#4F8BAC` | liens, jardinier IA |
| `bark` | `#2B3A2E` | texte principal (13:1 sur chalk) |
| `stem` | `#5C6B5F` | texte secondaire |
| `twig` | `#A1AEA3` | texte tertiaire / trait |
| `honey` | `#E8C66A` | XP, floraison, mérite (rare) |
| `rose` | `#E8A6A1` | erreur douce — jamais de rouge vif |

## 3. Typographie

| Usage | Famille | Poids | Particularité |
|---|---|---|---|
| Display | **Fraunces** | 400 / 500 / 600 | italique pour les étiquettes latines (*Hortus*, *Multiplicatio*) |
| UI | **Inter** | 400 / 500 / 600 / 700 | 14–16 px corps, 600 boutons |
| Numérique | **JetBrains Mono** | 500 | chiffres tabulaires pour aligner les calculs |

Chargement self-hosted via `@fontsource/*`. Pas de Google Fonts CDN.

## 4. Sept Principes

1. **Le blanc est la matière.** 60 % blanc respiré, 25 % vert pâle, 15 % accents. Pas de fonds bruyants.
2. **Le sage = vivant, le ciel = pensé.** Vert pour la croissance, bleu pour l'IA et les indices. Honey, rare, pour la floraison.
3. **Le calcul a sa typo.** Les chiffres en JetBrains Mono — bord franc, espacement constant.
4. **Le latin signe.** Fraunces italique sur les étiquettes — *Hortus*, *Multiplicatio*. Érudition, pas pédanterie.
5. **L'erreur est une feuille tombée.** Rose-thé, jamais rouge. Le jardinier observe, ne réprimande pas.
6. **Une plante, un état.** *En sommeil · à arroser · en croissance · floraison.* Quatre tons, jamais cinq.
7. **La serre est calme.** Animations 200 ms, ombres douces, pas de paillettes — la croissance est lente par nature.

## 5. Vocabulaire des écrans

| № | Écran | Métaphore | Fond par défaut |
|---|---|---|---|
| ① | Welcome | **Serre** | `.greenhouse` |
| ② | ChildPicker | **Carnets** (pots de plantes) | `bg-chalk` |
| ③ | SkillTree | **Carte** (DAG de spécimens) | `.paper-grid` |
| ④ | Exercise | **Établi** (papier ligné) | `.paper-rule` |
| ⑤ | FeedbackMessage | **Jardinier** (IA, sky-deep) | `bg-mist` |
| ⑥ | Profile | **Herbier** (fleurs pressées) | `bg-chalk` |
| ⑦ | Célébration | **Floraison** | `.water` |

## 6. Primitives CSS

Définies dans `frontend/src/App.css` :

- `.greenhouse`, `.paper-grid`, `.paper-rule`, `.water` — fonds / textures
- `.tag` (+ `::before` point de ficelle), `.chip` (+ `-sky` / `-honey` / `-bark`)
- `.pill` (+ `-ghost` / `-bark`), `.navlink`
- `.pot` (+ `.pot-soil`), `.specimen`
- `.latin`

Ombres : `--shadow-leaf` · `--shadow-dew` · `--shadow-tag` · `--shadow-glasspane`.

## 7. Bibliothèque React

Dans `frontend/src/components/ui/` — chaque composant sous 80 lignes :

`Button` · `Card` · `Chip` · `Input` · `Heading` · `Icon` (wrapper lucide-react) · `Pot` · `ProgressBar` · `SkillNode` · `Floraison`.

Règle : Tailwind d'abord ; CSS custom seulement pour les effets (textures, ombres, tags à ficelle).

## 8. À éviter

- Claymorphisme, pastels acidulés, formes "rebondies"
- Mascotte permanente (pas de Lumi, pas de tournesol qui parle)
- Emojis dans l'UI (boutons, chips, titres) — toujours du SVG (via `lucide-react`)
- Plus de trois couleurs simultanées dans un même composant
- Rouge vif pour l'erreur — toujours rose-thé
- Indigo / violet — écartés (clash avec sage + sky)
- Dégradés arc-en-ciel — au plus, sage → honey pour la barre XP
- Texte en majuscules pour de longs labels (réservé aux micro-tags)
- Lorem ipsum — chaque exemple porte un vrai prénom, un vrai calcul

## 9. Accessibilité

- Contraste bark sur chalk = 13:1 (AAA texte)
- Contraste sage-deep sur paper ≥ 7:1 (AAA UI)
- `prefers-reduced-motion` : toutes les transitions → 0 ms
- Focus ring : `ring-2 ring-sky` pour inputs + nav-links
- Aucune information transmise par la couleur seule — toujours doublée d'un label (*en sommeil*, *à arroser*…)
