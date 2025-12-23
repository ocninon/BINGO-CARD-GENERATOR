document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('bingo-grid');
    const newGameBtn = document.getElementById('new-game-btn');

    // Global state variables for current card metadata
    let currentCardId = null;
    let currentTime = null;

    // Helper to safely get from localStorage
    function safeGetStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('LocalStorage access denied or not supported:', e);
            return null;
        }
    }

    // Helper to safely set to localStorage
    function safeSetStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('LocalStorage access denied or not supported:', e);
        }
    }

    // Helper to safely remove from localStorage
    function safeRemoveStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('LocalStorage access denied or not supported:', e);
        }
    }

    // Modal Elements
    const modal = document.getElementById('confirmation-modal');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // New Game Button Listener
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            // Show Modal
            modal.classList.remove('hidden');
        });
    }

    // Modal Listeners
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    if (modalConfirmBtn) {
        modalConfirmBtn.addEventListener('click', () => {
            startNewGame();
            modal.classList.add('hidden');
        });
    }

    // Close modal if clicking outside content
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Initialize Game
    if (safeGetStorage('bingoState')) {
        loadGameState();
    } else {
        generateCard();
    }

    function startNewGame() {
        safeRemoveStorage('bingoState');
        grid.innerHTML = '';
        generateCard();
    }

    function saveGameState() {
        const cells = Array.from(grid.children);
        const state = {
            cardId: currentCardId,
            timestamp: currentTime,
            cells: cells.map(cell => ({
                text: cell.textContent,
                selected: cell.classList.contains('selected'),
                isFree: cell.classList.contains('free-space')
            }))
        };
        safeSetStorage('bingoState', JSON.stringify(state));
    }

    function loadGameState() {
        const json = safeGetStorage('bingoState');
        if (!json) return;

        const stateObj = JSON.parse(json);

        // Restore metadata
        if (stateObj.cardId) {
            currentCardId = stateObj.cardId;
            currentTime = stateObj.timestamp;
            updateCardInfoDisplay(currentCardId, currentTime);
        }

        // Handle legacy state format (array of cells) vs new object
        const cellDataArray = Array.isArray(stateObj) ? stateObj : stateObj.cells;

        grid.innerHTML = '';

        if (cellDataArray) {
            cellDataArray.forEach(cellData => {
                const cell = document.createElement('div');
                cell.classList.add('bingo-cell');
                cell.textContent = cellData.text;

                if (cellData.isFree) {
                    cell.classList.add('free-space');
                }

                if (cellData.selected) {
                    cell.classList.add('selected');
                }

                // Add click listener
                cell.addEventListener('click', toggleCell);

                grid.appendChild(cell);
            });
        }
    }

    function generateCard() {
        // Columns limits: B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
        const columns = [
            generateRandomNumbers(1, 15, 5),  // B
            generateRandomNumbers(16, 30, 5), // I
            generateRandomNumbers(31, 45, 5), // N
            generateRandomNumbers(46, 60, 5), // G
            generateRandomNumbers(61, 75, 5)  // O
        ];

        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = document.createElement('div');
                cell.classList.add('bingo-cell');

                // Middle cell (Row 2, Col 2) is Free Space
                if (row === 2 && col === 2) {
                    cell.textContent = "FREE";
                    cell.classList.add('free-space');
                    cell.addEventListener('click', toggleCell);
                } else {
                    const number = columns[col][row];
                    cell.textContent = number;
                    cell.addEventListener('click', toggleCell);
                }

                grid.appendChild(cell);
            }
        }

        // Update Card Metadata
        let storedId = safeGetStorage('bingoCardId');
        if (!storedId) {
            currentCardId = 1;
        } else {
            currentCardId = parseInt(storedId) + 1;
        }
        safeSetStorage('bingoCardId', currentCardId);

        const now = new Date();
        currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        updateCardInfoDisplay(currentCardId, currentTime);
        saveGameState();
    }

    function updateCardInfoDisplay(id, time) {
        const infoEl = document.getElementById('card-info');
        if (infoEl) {
            const paddedId = String(id).padStart(3, '0');
            infoEl.textContent = `Card #${paddedId} • ${time}`;
        }
    }

    function generateRandomNumbers(min, max, count) {
        const nums = new Set();
        while (nums.size < count) {
            nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        return Array.from(nums);
    }

    function toggleCell(e) {
        e.target.classList.toggle('selected');
        saveGameState();
    }
});
