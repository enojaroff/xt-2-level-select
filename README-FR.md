# xt_2_level_select

Version améliorée du fieldview `two_level_select` de Saltcorn, pour les champs de type **Key**. Ajoute quelques options à la version intégrée.

Le premier select (niveau 1) filtre les valeurs du second (niveau 2). Le niveau 1 correspond à une clé étrangère de la table référencée, définie par le paramètre *Top level field*.

## Options

| Option                         | Description                                                                 |
| ------------------------------ | --------------------------------------------------------------------------- |
| Top level field                | Clé étrangère de la table référencée qui définit le niveau 1                |
| Layout                         | `horizontal` (côte à côte) ou `vertical` (l'un sous l'autre)                |
| Spacing between selects        | Espacement en longueur CSS (`8px`, `0.5rem`…). Un nombre seul est lu en px. |
| Level 1 width                  | Horizontal uniquement : largeur du niveau 1, de 1 à 11 colonnes sur 12      |
| Level 1 / 2: searchable select | Remplace le select natif par un select avec recherche (Tom Select)          |
| Level 1 / 2 placeholder        | Texte affiché quand rien n'est sélectionné                                  |
| Force required                 | Rend la sélection obligatoire même si le champ ne l'est pas                 |

## Notes

- Les options sont triées par libellé, aux deux niveaux.
- Le niveau 1 liste toutes les lignes de la table parente, y compris celles qui n'ont aucune valeur de niveau 2.
- Comme pour `two_level_select`, la contrainte `where` du champ n'est pas appliquée.
- Le select de niveau 2 est désactivé tant qu'aucun niveau 1 n'est choisi.
- Tom Select 2.6.2 est embarqué dans `public/` (licence Apache-2.0, voir `public/tom-select.LICENSE`). Aucun CDN n'est requis.
