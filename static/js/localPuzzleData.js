const puzzlesCompleted = document.getElementById('puzzles-completed');
let dailyPuzzlesCompleted = 0;

export function incrementPuzzlesSolved() {
    let currentCount = parseInt(localStorage.getItem('puzzles-completed') || '0', 10);
    localStorage.setItem('puzzles-completed', (currentCount + 1).toString());

    displayPuzzlesCompleted();
}

export function displayPuzzlesCompleted(){
    const count = localStorage.getItem('puzzles-completed') || '0';
    puzzlesCompleted.textContent = count;
}

// Function to update daily puzzles completed display
export function updateDailyPuzzlesCompleted() {
    const dailyPuzzlesElement = document.getElementById('daily-puzzles-completed');
    if (dailyPuzzlesElement) {
        dailyPuzzlesElement.textContent = dailyPuzzlesCompleted;
    }
}

// Function to increment daily puzzles completed
export function incrementDailyPuzzlesCompleted() {
    const today = new Date().toDateString();
    const lastSolvedDate = localStorage.getItem('lastDailyPuzzleSolved');
    
    // Only increment if the puzzle hasn't been solved today
    if (lastSolvedDate !== today) {
        dailyPuzzlesCompleted++;
        updateDailyPuzzlesCompleted();
        localStorage.setItem('lastDailyPuzzleSolved', today);
        localStorage.setItem('dailyPuzzlesCompleted', dailyPuzzlesCompleted);
    }
}

// Function to load daily puzzles completed from localStorage
export function loadDailyPuzzlesCompleted() {
    const lastDate = localStorage.getItem('lastDailyPuzzleDate');
    const today = new Date().toDateString();
    
    // Reset counter if it's a new day
    if (lastDate !== today) {
        dailyPuzzlesCompleted = 0;
        localStorage.setItem('dailyPuzzlesCompleted', '0');
        localStorage.setItem('lastDailyPuzzleDate', today);
        localStorage.removeItem('lastDailyPuzzleSolved'); // Clear the solved status for the new day
    } else {
        dailyPuzzlesCompleted = parseInt(localStorage.getItem('dailyPuzzlesCompleted')) || 0;
    }
    updateDailyPuzzlesCompleted();
} 