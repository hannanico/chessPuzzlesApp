const puzzlesCompleted = document.getElementById('puzzles-completed');

export function incrementPuzzlesSolved() {
    let currentCount = parseInt(localStorage.getItem('puzzles-completed') || '0', 10);
    localStorage.setItem('puzzles-completed', (currentCount + 1).toString());

    displayPuzzlesCompleted();
}

export function displayPuzzlesCompleted(){
    const count = localStorage.getItem('puzzles-completed') || '0';
    puzzlesCompleted.textContent = count;
}