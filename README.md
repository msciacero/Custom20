# C20

C20 is a browser extension for Roll20 that adds a number of quality of life improvements to the D&D 5e 2014 character sheet and game.

## Overall Features

### App Features

- Additional journal actions for players (hide, filter, sort, and folder management)
- Custom Compendium
  - Ability to add your own custom compendium content
  - Drag and drop onto character sheet that populates items, spells, and feature/traits.
  - Does not work with Charactermancer

### D&D 5e 2014 Character Sheet Features

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

## Features

### Journal

Only enabled for players because GMs already get most of these features.

- Journal search filter (1)
- Drag and drop sorting
- Right click menu
  - Add/rename folders
  - Hide/show items and folders
  - Toggle hidden to view hidden items and folders
- Exclude/include hidden journal items (2)
- Enable/disable drag and drop sorting (3)

[![Journal Header](/_docs/images/journal-1.png)]

---

### Markers

Adds titles next to each icon

[![Marker Menu](/_docs/images/markers-1.png)]

---

### Defenses

Dedicated location for resistance, vulnerability, and immunity.

[![Marker Menu](/_docs/images/defense-1.png)] [![Marker Menu](/_docs/images/defense-2.png)]

---

### Conditions

Track and display conditions that are afflicting this character

- Display condition and effects
- Only shows unique effects if multiple conditions are enabled
- Click on condition name to read full description (maybe one day I will make this look nice)

[![Marker Menu](/_docs/images/conditions-1.png)] [![Marker Menu](/_docs/images/conditions-2.png)]
