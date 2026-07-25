# C20

C20 is a browser extension for Roll20 that adds a number of quality of life improvements to the D&D 5e 2014 character sheet and game.

## App Features

- Additional journal actions for players (hide, filter, sort, and folder management)
- Custom Compendium
  - Ability to add your own custom compendium content
  - Drag and drop onto character sheet that populates items, spells, and feature/traits.
  - Does not work with Charactermancer

## D&D 5e 2014 Character Sheet Features

- Defense section to track resistance, immunity, and vulnerability.
- Conditions tracking, similar to exhaustion tracking but broader.
- Spell table layout and filter
- Inventory tweaks that allow dividers, different colors for magical items, and advanced item editor
- Features and Traits has some markdown syntax support (bold, italic, list, tables)

## 3rd Party Libraries

- expr-eval (https://github.com/silentmatt/expr-eval) - Calculate roll20 dice formulas
- FontAwesome Icons (https://fontawesome.com/) - Filter/Shield Icon
- idb (https://github.com/jakearchibald/idb) - async indexeddb helper
- Sortable.js by RubaXa & owenm (https://github.com/SortableJS/Sortable) - Custom journal drag & drop

## Wish List

- Compendium: Species, Monsters, Features, Groupings (Type/Name|GroupName), category search filter
- Move styles to css
- Language support
- Compendium: Related categories search

## Known Issues

- 5e sheet does not fully support versatile weapons (no synch and uses hidden inputs)
