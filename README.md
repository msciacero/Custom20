# C20

C20 is a browser extension for Roll20 that adds a number of quality of life improvements to the D&D 5e 2014 character sheet and game.

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

## Table of Contents

- Features
  - [Characteristics/Features](https://github.com/msciacero/C20#characteristics--features-and-traits-updates)
  - [Conditions Section](https://github.com/msciacero/C20#conditions-section)
  - [Defenses Section](https://github.com/msciacero/C20#defenses-section)
  - [Inventory Updates](https://github.com/msciacero/C20#inventory-updates)
  - [Journal Updates](https://github.com/msciacero/C20#journal-updates)
  - [Marker Menu Updates](https://github.com/msciacero/C20#marker-updates)
  - [Spell View](https://github.com/msciacero/C20#spell-updates)
  - [C20 Settings](https://github.com/msciacero/C20#settings)
  - [Compendium](https://github.com/msciacero/C20#compendium)
  - [Compendium Editor](https://github.com/msciacero/C20#compendium-editor)
- [3rd Party Libraries](https://github.com/msciacero/C20#3rd-party-libraries)
- [Wish List](https://github.com/msciacero/C20#wish-list)
- [Known Issues](https://github.com/msciacero/C20#known-issues)

## Features

### Characteristics / Features and Traits Updates

- Added some markdown format support
  - Bold: https://www.markdownguide.org/basic-syntax/#bold
  - Italic: https://www.markdownguide.org/basic-syntax/#italic
  - Bold and Italic: https://www.markdownguide.org/basic-syntax/#bold-and-italic
  - Header: https://www.markdownguide.org/basic-syntax/#headings
  - Unordered Lists: https://www.markdownguide.org/basic-syntax/#unordered-lists
  - Tables: https://www.markdownguide.org/extended-syntax/#tables
- Removed titles from scrolls to make boxes more generic

![Characteristics View](/.docs/images/characteristics-1.png)

---

### Conditions Section

Track and display conditions that are afflicting this character

- Display condition and effects
- Only shows unique effects if multiple conditions are enabled
- Click on condition name to read full description (maybe one day I will make this look nice)

![Conditions View](/.docs/images/conditions-1.png) ![Conditions Editor](/.docs/images/conditions-2.png)

---

### Defenses Section

- Dedicated location for resistance, vulnerability, and immunity.
- Option wheel is on the right side between speed and hit point boxes

![Defense View](/.docs/images/defense-1.png) ![Defense Editor](/.docs/images/defense-2.png)

---

### Inventory Updates

- Customizable color to denote magic and attuned items
- Full UI inventory editor
  - Edit item modifiers
  - Armor and weapons stats
  - Track upgrades for "The Complete Armorer's Handbook"
- Item type of "Divider" only displays the item name

![Inventory View](/.docs/images/inventory-1.png) ![Inventory Editor](/.docs/images/inventory-2.png)

---

### Journal Updates

Only enabled for players because GMs already get most of these features.

- Journal search filter (1)
- Drag and drop sorting
- Right click menu
  - Add/rename folders
  - Hide/show items and folders
  - Toggle hidden to view hidden items and folders
- Exclude/include hidden journal items (2)
- Enable/disable drag and drop sorting (3)

![Journal Header](/.docs/images/journal-1.png)

---

### Marker Updates

- Adds titles next to each icon

![Marker Menu](/.docs/images/markers-1.png)

---

### Spell Updates

- Added row view layout with additional spell details
- Added markdown support to spell descriptions
- Added spell filter
  - Show only prepared/ritual spells
  - Filter spells by requirements
  - Show/hide spell filter
  - Reset spell filter

![Spell View](/.docs/images/spell-1.png)

---

### Settings

- Game Settings
  - Enable/disable features for the campaign screen
  - Import/Export local data
- Character Settings
  - Enable/disable features for the character sheet
  - Set as Default: Sets current settings as future default settings
  - Reset to Default: Resets sheet to your default settings

![Game Settings](/.docs/images/settings-1.png) ![Sheet Settings](/.docs/images/settings-2.png)

---

### Compendium

- Select different compendiums
  - Roll20 compendium (D&D 5th Edition)
  - Each compendium is isolated
- Custom compendiums
  - Fuzzy search filter
  - Drag and drop items to character sheet (including popped out sheets)
    - Backgrounds, classes, subclasses, and feats add a new trait
    - Items will be added to inventory and create attack and resources if specified
    - Spells will be added to spell list

![Compendium](/.docs/images/compendium-1.png)

---

### Compendium Editor

- Allows players to create and edit items for their custom compendiums
- Currently supports backgrounds, classes, conditions, feats, items, spells, and subclasses
- Full UI or JSON editor
- Easter egg next to the Compendium Editor

![Editor](/.docs/images/editor-1.png)

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

## Random Questions and Answers

1. _Why isn't this an FAQ?_ Because no one has asked any questions.
2. _Why doesn't feature x work?_ Sorry, sometimes I break things. I swear its not on purpose and I might not even know I did it.
3. _Why did you make this?_ My friend wanted to organize their journal and for some reason I thought that sounded like a simple task. Little did I know...
4. _When do you add new features?_ When I feel like it. Half the battle is trying to find a concept that works.
5. _Why is markdown support limited?_ Safety. People might want to share homebrew items and I wanted to reduce the chance of malicious text being executed.
6. _Does this support dark mode?_ I don't use dark mode but I try to support it for people who do. If I missed something, just let me know.
