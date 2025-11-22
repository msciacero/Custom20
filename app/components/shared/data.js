// This file contains default data that will be loaded into storage.
//

var Data = (function () {
  var conditions = [
    {
      name: "DnD2014",
      items: [
        {
          name: "Blinded",
          desc: [
            "A blinded creature can't see and automatically fails any ability check that requires sight.",
            "Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage.",
          ],
          short: [
            "Automatically fail sight checks",
            "Attack rolls against you have advantage",
            "Disadvantage on attack rolls",
          ],
        },
        {
          name: "Charmed",
          desc: [
            "A charmed creature can't attack the charmer or target the charmer with harmful abilities or magical effects.",
            "The charmer has advantage on any ability check to interact socially with the creature.",
          ],
          short: ["Can't hurt the charmer"],
        },
        {
          name: "Deafened",
          desc: ["A deafened creature can't hear and automatically fails any ability check that requires hearing."],
          short: ["Automatically fail hearing checks"],
        },
        {
          groupName: "Exhaustion",
          name: "1",
          desc: ["Disadvantage on ability checks"],
          short: ["Disadvantage on ability checks"],
        },
        {
          groupName: "Exhaustion",
          name: "2",
          desc: ["Disadvantage on ability checks", "Speed halved"],
          short: ["Disadvantage on ability checks", "Speed halved"],
        },
        {
          groupName: "Exhaustion",
          name: "3",
          desc: ["Disadvantage on ability checks", "Speed halved", "Disadvantage on attack rolls and saving throws"],
          short: [
            "Disadvantage on ability checks",
            "Speed halved",
            "Disadvantage on attack rolls",
            "Disadvantage on saving throws",
          ],
        },
        {
          groupName: "Exhaustion",
          name: "4",
          desc: [
            "Disadvantage on ability checks",
            "Speed halved",
            "Disadvantage on attack rolls and saving throws",
            "Hit point maximum halved",
          ],
          short: [
            "Disadvantage on ability checks",
            "Speed halved",
            "Disadvantage on attack rolls",
            "Disadvantage on saving throws",
            "Hit point maximum halved",
          ],
        },
        {
          groupName: "Exhaustion",
          name: "5",
          desc: [
            "Disadvantage on ability checks",
            "Speed reduced to 0",
            "Disadvantage on attack rolls and saving throws",
            "Hit point maximum halved",
          ],
          short: [
            "Disadvantage on ability checks",
            "Speed reduced to 0",
            "Disadvantage on attack rolls",
            "Disadvantage on saving throws",
            "Hit point maximum halved",
          ],
        },
        {
          name: "Frightened",
          desc: [
            "A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.",
            "The creature can't willingly move closer to the source of its fear.",
          ],
          short: [
            "Disadvantage on ability checks while in sight",
            "Disadvantage on attack rolls while in sight",
            "Can't willingly move closer to source of fear",
          ],
        },
        {
          name: "Grappled",
          desc: [
            "A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed.",
            "The condition ends if the grappler is incapacitated (no action or reaction).",
            "The condition also ends if an effect removes the grappled creature from the reach of the grappler or grappling effect, such as when a creature is hurled away by the thunderwave spell.",
          ],
          short: ["Speed reduced to 0"],
        },
        {
          name: "Incapacitated",
          desc: ["An incapacitated creature can't take actions or reactions."],
          short: ["No actions or reactions"],
        },
        {
          name: "Invisible",
          desc: [
            "An invisible creature is impossible to see without the aid of magic or a special sense. For the purpose of hiding, the creature is heavily obscured. The creature's location can be detected by any noise it makes or any tracks it leaves.",
            "Attack rolls against the creature have disadvantage, and the creature's attack rolls have advantage.",
          ],
          short: ["Advantage on attack rolls", "Attack rolls against you have disadvantage"],
        },
        {
          name: "Paralyzed",
          desc: [
            "A paralyzed creature is incapacitated (no action or reaction) and can't move or speak.",
            "The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.",
            "Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.",
          ],
          short: [
            "No actions or reactions",
            "Speed reduced to 0",
            "Fail strength and dexterity saving throws",
            "Attack rolls against you have disadvantage",
            "Attacks within 5ft that hit auto-crit",
          ],
        },
        {
          name: "Petrified",
          desc: [
            "A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging.",
            "The creature is incapacitated (no action or reaction), can't move or speak, and is unaware of its surroundings.",
            "Attack rolls against the creature have advantage.",
            "The creature automatically fails Strength and Dexterity saving throws.",
            "The creature has resistance to all damage.",
            "The creature is immune to poison and disease, although a poison or disease already in its system is suspended, not neutralized.",
          ],
          short: [
            "No actions or reactions",
            "Speed reduced to 0",
            "Attack rolls against you have advantage",
            "Fail strength and dexterity saving throws",
            "Resistance to all damage, immune to poison and disease",
          ],
        },
        {
          name: "Poisoned",
          desc: ["A poisoned creature has disadvantage on attack rolls and ability checks."],
          short: ["Disadvantage on attack rolls", "Disadvantage on ability checks"],
        },
        {
          name: "Prone",
          desc: [
            "A prone creature's only movement option is to crawl, unless it stands up and thereby ends the condition.",
            "The creature has disadvantage on attack rolls.",
            "An attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage.",
          ],
          short: [
            "Disadvantage on attack rolls",
            "Attacks rolls against you have advantage if within 5ft, otherwise disadvantage",
          ],
        },
        {
          name: "Restrained",
          desc: [
            "A restrained creature's speed becomes 0, and it can't benefit from any bonus to its speed.",
            "Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage.",
            "The creature has disadvantage on Dexterity saving throws.",
          ],
          short: ["Speed reduced to 0", "Attack rolls against you have advantage", "Disadvantage on attack rolls"],
        },
        {
          name: "Stunned",
          desc: [
            "A stunned creature is incapacitated (no action or reaction), can't move, and can speak only falteringly.",
            "The creature automatically fails Strength and Dexterity saving throws.",
            "Attack rolls against the creature have advantage.",
          ],
          short: [
            "No actions or reactions",
            "Speed reduced to 0",
            "Fail strength and dexterity saving throws",
            "Attack rolls against you have advantage",
          ],
        },
        {
          name: "Unconscious",
          desc: [
            "An unconscious creature is incapacitated (no action or reaction), can't move or speak, and is unaware of its surroundings.",
            "The creature drops whatever it's holding and falls prone.",
            "The creature automatically fails Strength and Dexterity saving throws.",
            "Attack rolls against the creature have advantage.",
            "Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.",
          ],
          short: [
            "No actions or reactions",
            "Speed reduced to 0",
            "Drop what you are holding and fall prone",
            "Fail strength and dexterity saving throws",
            "Attack rolls against you have advantage",
            "Attacks within 5ft that hit auto-crit",
          ],
        },
      ],
    },
  ];

  var Data = {
    initConditions: async function initConditions() {
      const storageKey = "global-conditions";
      var storedData = await chrome.storage.local.get([storageKey]);
      if (storedData[storageKey] !== undefined) return;
      chrome.storage.local.set({ [storageKey]: JSON.stringify(conditions) });
    },

    resetConditions: async function resetConditions() {
      const storageKey = "global-conditions";
      chrome.storage.local.set({ [storageKey]: JSON.stringify(conditions) });
    },
  };
  return Data;
})();

if (typeof define === "function" && define.amd) {
  define(function () {
    return Data;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = Data;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("Data", []).factory("Data", function () {
    return Data;
  });
}
