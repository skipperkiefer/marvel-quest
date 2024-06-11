// Define the quest progression tree with items, keys, unlockable heroes, chained heroes, and special categories
const questTree = {
    // Core Set
    "Juggernaut": {
        "name": "Juggernaut",
        "items": ["Key", "Key"],
        "next": ["Magneto", "Mystique", "Sabretooth"],
        "unlockHeroes": ["Wolverine"],
        "victoryPoints": 4
    },
    "Magneto": {
        "name": "Magneto",
        "items": ["Key"],
        "next": ["Professor Xavier"],
        "unlockHeroes": ["Cyclops"],
        "victoryPoints": 15,
        "itemGates": [{ "item": "Key" }]
    },
    "Mystique": {
        "name": "Mystique",
        "items": ["Brain"],
        "next": ["Professor Xavier"],
        "unlockHeroes": ["Jean Grey"],
        "victoryPoints": 12,
        "chainedHero": "Rogue"
    },
    // Add more villains following the same structure...
};

const startingPoints = {
    "avengers": {
        "heroes": ["Iron Man", "Hulk", "Captain America", "Black Widow"],
        "villains": ["Juggernaut", "Magneto"]
    },
    "xmen": {
        "heroes": ["Jean Grey", "Beast", "Cyclops", "Iceman"],
        "villains": ["Mystique", "Sabretooth"]
    }
};

const heroes = {
    "Doctor Strange": {
        "name": "Doctor Strange",
        "image": "Images/DoctorStrange.png",
        "abilities": ["magic", "teleportation"],
        "specialAbility": "Eye of Agamotto",
        "description": "Stephen Strange, the Sorcerer Supreme.",
        "itemGate": "Key" // Item required to unlock this hero
    },
    // Add more heroes here...
};

// Initialize current villains, collected items, unlocked heroes, defeated villains, and starting point, loading from localStorage if available
let currentVillains = JSON.parse(localStorage.getItem('currentVillains')) || [];
let collectedItems = JSON.parse(localStorage.getItem('collectedItems')) || [];
let unlockedHeroes = JSON.parse(localStorage.getItem('unlockedHeroes')) || [];
let defeatedVillains = JSON.parse(localStorage.getItem('defeatedVillains')) || [];
let selectedStartingPoint = JSON.parse(localStorage.getItem('selectedStartingPoint')) || null;
let selectedHeroes = [];
let selectedVillain = null;
let unlockedGates = JSON.parse(localStorage.getItem('unlockedGates')) || [];
let campaignLog = JSON.parse(localStorage.getItem('campaignLog')) || [];

// Function to display the starting point selection
function displayStartingPointSelection() {
    const container = document.getElementById('shield-hq-tasks');
    container.innerHTML = `
        <h2>Pick a Starting Point</h2>
        <div class="starting-point">
            <button onclick="selectStartingPoint('avengers')">Avengers</button>
            <button onclick="selectStartingPoint('xmen')">X-Men</button>
        </div>
    `;
}

// Function to select a starting point
function selectStartingPoint(point) {
    selectedStartingPoint = point;
    unlockedHeroes = startingPoints[point].heroes;
    currentVillains = startingPoints[point].villains;
    saveGameState();
    displayUnlockedHeroes();
    displayCurrentVillains();
}

// Function to display the current villains and ask if the player won
function displayCurrentVillains() {
    const container = document.getElementById('shield-hq-tasks');
    if (!selectedStartingPoint) {
        displayStartingPointSelection();
        return;
    }
    container.innerHTML = '<h2>SHIELD HQ Tasks</h2>'; // Reset container with header

    currentVillains.forEach(villainId => {
        const villain = questTree[villainId];
        const villainDiv = document.createElement('div');
        villainDiv.classList.add('quest-card');
        villainDiv.onclick = () => selectVillain(villainId);

        const villainName = document.createElement('h3');
        villainName.textContent = `${villain.name} (${villain.victoryPoints} VP)`;
        villainDiv.appendChild(villainName);

        if (villain.chainedHero) {
            const chainedHero = document.createElement('p');
            chainedHero.textContent = `Chained Hero: ${villain.chainedHero}`;
            villainDiv.appendChild(chainedHero);
        }

        if (villain.specialCategory) {
            const specialCategory = document.createElement('p');
            specialCategory.textContent = getSpecialCategoryText(villain.specialCategory);
            villainDiv.appendChild(specialCategory);
        }

        if (selectedVillain === villainId) {
            villainDiv.classList.add('selected');
        }

        container.appendChild(villainDiv);
    });

    displayDefeatedVillains();
}

// Function to get special category text
function getSpecialCategoryText(category) {
    const texts = {
        "deadpool": "Follow the Deadpool Villain rules in the Deadpool expansion for this battle.",
        "phoenix_five": "Follow the Campaign rules in the Phoenix Five expansion to fight these villains.",
        "infinity_gauntlet": "Follow the full rules in the Infinity Gauntlet expansion, fighting the 3 infinity battles then Thanos.",
        "sinister_six": "Follow the rules in the Sinister Six expansion to fight these villains all at once.",
        "horsemen_of_the_apocalypse": "Follow the rules in the Apocalypse expansion, playing the Prelude against the horsemen, then the final battle against Apocalypse.",
        "shapeshifter": "Pick randomly between the 6 villains shown around the villain on the map and fight that villain.",
        "special_battle": "Some advanced villains force a specific challenge. Simply play following the special rules from that challenge’s rulebook."
    };
    return texts[category] || "";
}

// Function to display the defeated villains
function displayDefeatedVillains() {
    const container = document.getElementById('defeated-villains-section');
    container.innerHTML = '<h2>Defeated Villains</h2>'; // Reset container with header
    defeatedVillains.forEach(villainId => {
        const villain = questTree[villainId];
        const villainDiv = document.createElement('div');
        villainDiv.classList.add('defeated-villain-card');

        const villainName = document.createElement('h3');
        villainName.textContent = `${villain.name} (${villain.victoryPoints} VP)`;
        villainDiv.appendChild(villainName);

        container.appendChild(villainDiv);
    });

    updateVictoryPoints(); // Update victory points display
}

// Function to handle the defeat of a villain
function defeatVillain(villainId) {
    defeatedVillains.push(villainId);
    currentVillains = currentVillains.filter(v => v !== villainId);
    const villain = questTree[villainId];
    collectedItems.push(...villain.items); // Collect items
    unlockedHeroes.push(...villain.unlockHeroes); // Unlock heroes
    if (villain.chainedHero) {
        unlockedHeroes.push(villain.chainedHero); // Unlock chained hero
    }
    currentVillains = villain.next.filter(nextVillainId => canUnlock(nextVillainId));
    if (currentVillains.length === 0) {
        alert("Congratulations! You've defeated all available villains.");
    }
    saveGameState(); // Save the game state after defeating a villain
    displayCollectedItems();
    displayUnlockedHeroes();
    displayCurrentVillains();
}

// Function to handle hero selection
function selectHero(hero) {
    if (selectedHeroes.includes(hero)) {
        selectedHeroes = selectedHeroes.filter(h => h !== hero);
    } else {
        selectedHeroes.push(hero);
    }
    displayUnlockedHeroes();
    displayLogGameButton();
}

// Function to handle villain selection
function selectVillain(villainId) {
    selectedVillain = villainId;
    displayCurrentVillains();
    displayLogGameButton();
}

// Function to display the log game button
function displayLogGameButton() {
    const container = document.getElementById('log-game-section');
    container.innerHTML = '<h2>Did you win?</h2>'; // Add header
    if (selectedHeroes.length > 0 && selectedVillain) {
        container.innerHTML += `
            <div class="log-game-buttons">
                <button onclick="logGameResult('victory')">Victory</button>
                <button onclick="logGameResult('defeat')">Defeat</button>
            </div>
        `;
    }
}

// Function to log the game result
function logGameResult(result) {
    const villain = questTree[selectedVillain];
    const heroNames = selectedHeroes.join(", ");
    const logEntry = {
        game: campaignLog.length + 1,
        heroes: heroNames,
        villain: villain.name,
        result: result
    };
    campaignLog.push(logEntry);
    localStorage.setItem('campaignLog', JSON.stringify(campaignLog)); // Save the log

    if (result === 'victory') {
        defeatVillain(selectedVillain);
    } else if (result === 'defeat') {
        selectedHeroes.forEach(hero => {
            unlockedHeroes = unlockedHeroes.filter(h => h !== hero);
        });
        alert('Heroes defeated! They can no longer be used.');
    }
    selectedHeroes = [];
    selectedVillain = null;
    displayUnlockedHeroes();
    displayCurrentVillains();
    displayLogGameButton();
}
// Function to check if a path can be unlocked based on collected items/keys
function canUnlock(villainId) {
    const villain = questTree[villainId];
    if (villain.itemGates) {
        for (const gate of villain.itemGates) {
            if (!collectedItems.includes(gate.item) || unlockedGates.includes(villainId)) {
                return false;
            }
        }
    }
    return true; // Allow paths without item gates or already unlocked gates
}

// Function to display collected items
function displayCollectedItems() {
    const itemList = document.getElementById('resource-list');
    itemList.innerHTML = '';
    collectedItems.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('resource-item');
        const img = document.createElement('img');
        img.src = `Images/${item}.png`; // Adjust the path as necessary
        img.alt = item;
        const span = document.createElement('span');
        span.textContent = item;
        li.appendChild(img);
        li.appendChild(span);
        li.onclick = () => useItem(item);
        itemList.appendChild(li);
    });
}

// Function to use an item
function useItem(item) {
    const unlockables = getUnlockables(item);
    if (unlockables.length > 0) {
        const confirm = window.confirm(`Do you want to use ${item} to unlock ${unlockables.join(", ")}?`);
        if (confirm) {
            unlockables.forEach(unlockable => {
                if (heroes[unlockable]) {
                    unlockedHeroes.push(unlockable); // Add to hero pool
                } else if (questTree[unlockable]) {
                    currentVillains.push(unlockable); // Add to SHIELD HQ Tasks
                }
                collectedItems = collectedItems.filter(i => i !== item); // Remove the item from collected items
                unlockedGates.push(unlockable); // Add to unlocked gates
            });
            saveGameState(); // Save the game state
            displayCollectedItems();
            displayUnlockedHeroes();
            displayCurrentVillains();
        }
    } else {
        alert(`No unlockables available for ${item}`);
    }
}

// Function to get unlockables for an item
function getUnlockables(item) {
    const unlockables = [];
    for (const hero in heroes) {
        if (heroes[hero].itemGate === item && !unlockedHeroes.includes(hero)) {
            unlockables.push(hero);
        }
    }
    for (const villainId in questTree) {
        if (questTree[villainId].itemGates) {
            questTree[villainId].itemGates.forEach(gate => {
                if (gate.item === item && !currentVillains.includes(villainId) && !unlockedGates.includes(villainId)) {
                    unlockables.push(villainId);
                }
            });
        }
    }
    return unlockables;
}

// Function to display unlocked heroes
function displayUnlockedHeroes() {
    const heroList = document.getElementById('hero-list');
    heroList.innerHTML = '';
    unlockedHeroes.forEach(hero => {
        const li = document.createElement('li');
        li.textContent = hero;
        li.onclick = () => selectHero(hero);
        if (selectedHeroes.includes(hero)) {
            li.classList.add('selected');
        }
        heroList.appendChild(li);
    });
}

// Function to display item gates for unlocking
function displayItemGates() {
    const container = document.getElementById('unlockables-section');
    container.innerHTML = '<h2>Unlockables</h2>'; // Reset container with header
    const unlockables = getAllUnlockables();
    unlockables.forEach(unlockable => {
        const unlockableItem = document.createElement('div');
        unlockableItem.classList.add('unlockable-item');
        unlockableItem.innerHTML = `
            <p>${unlockable}</p>
            <button onclick="unlock('${unlockable}')">Unlock</button>
        `;
        container.appendChild(unlockableItem);
    });
}

// Function to unlock an item
function unlock(unlockable) {
    const requiredItem = heroes[unlockable]?.itemGate || questTree[unlockable]?.itemGates[0].item;
    if (collectedItems.includes(requiredItem)) {
        useItem(requiredItem);
    } else {
        alert(`You need a ${requiredItem} to unlock ${unlockable}`);
    }
}

// Function to get all unlockables
function getAllUnlockables() {
    const unlockables = [];
    for (const hero in heroes) {
        if (heroes[hero].itemGate && !unlockedHeroes.includes(hero)) {
            unlockables.push(hero);
        }
    }
    for (const villainId in questTree) {
        if (questTree[villainId].itemGates && !currentVillains.includes(villainId)) {
            unlockables.push(villainId);
        }
    }
    return unlockables;
}

// Function to update victory points display
function updateVictoryPoints() {
    const points = defeatedVillains.reduce((sum, villainId) => sum + questTree[villainId].victoryPoints, 0);
    document.getElementById('victory-points').textContent = `Victory Points: ${points}`;
}

// Example: saveGameState function
function saveGameState() {
    localStorage.setItem('currentVillains', JSON.stringify(currentVillains));
    localStorage.setItem('collectedItems', JSON.stringify(collectedItems));
    localStorage.setItem('unlockedHeroes', JSON.stringify(unlockedHeroes));
    localStorage.setItem('defeatedVillains', JSON.stringify(defeatedVillains));
    localStorage.setItem('selectedStartingPoint', JSON.stringify(selectedStartingPoint));
    localStorage.setItem('unlockedGates', JSON.stringify(unlockedGates));
    localStorage.setItem('campaignLog', JSON.stringify(campaignLog));
}

// Function to reset the game
function resetGame() {
    currentVillains = [];
    collectedItems = [];
    unlockedHeroes = [];
    defeatedVillains = [];
    selectedStartingPoint = null;
    selectedHeroes = [];
    selectedVillain = null;
    unlockedGates = [];
    campaignLog = [];
    saveGameState();
    displayStartingPointSelection();
    displayUnlockedHeroes();
    displayCollectedItems();
    displayCurrentVillains();
    displayItemGates();
    displayLogGameButton();
}

// Function to display campaign log
function displayCampaignLog() {
    const log = campaignLog.map(entry => `Game ${entry.game}: Heroes - ${entry.heroes}, Villain - ${entry.villain}, Result - ${entry.result}`).join('\n');
    alert(log);
}

// Function to upload and process the Excel file
function uploadExcel() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const excelData = {
            Heroes: XLSX.utils.sheet_to_json(workbook.Sheets['Heroes']),
            Villains: XLSX.utils.sheet_to_json(workbook.Sheets['Villains'])
        };
        importDataFromExcel(excelData);
    };
    reader.readAsArrayBuffer(file);
}

// Function to import data from Excel
function importDataFromExcel(excelData) {
    // Clear existing data
    Object.keys(questTree).forEach(key => delete questTree[key]);
    Object.keys(heroes).forEach(key => delete heroes[key]);

    // Import heroes
    excelData.Heroes.forEach(hero => {
        heroes[hero.Name] = {
            name: hero.Name,
            image: hero.Image,
            abilities: hero.Abilities.split(","),
            specialAbility: hero.SpecialAbility,
            description: hero.Description,
            itemGate: hero.ItemGate
        };
    });

    // Import villains
    excelData.Villains.forEach(villain => {
        questTree[villain.Name] = {
            name: villain.Name,
            items: villain.Items.split(","),
            next: villain.Next.split(","),
            unlockHeroes: villain.UnlockHeroes.split(","),
            victoryPoints: parseInt(villain.VictoryPoints),
            itemGates: villain.ItemGates ? villain.ItemGates.split(",").map(item => ({ item })) : [],
            chainedHero: villain.ChainedHero,
            specialCategory: villain.SpecialCategory
        };
    });

    // Save to localStorage
    saveGameState();
}

// Function to trigger file input for Excel upload
function triggerFileInput() {
    document.getElementById('file-input').click();
}

// Initial display
displayStartingPointSelection();
displayUnlockedHeroes();
displayCollectedItems();
displayCurrentVillains();
displayItemGates();
displayLogGameButton();
