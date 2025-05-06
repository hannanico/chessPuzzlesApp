export var cyanColor = ' #08a4a7';
export var darkColor = ' #7D9EB2'; 
export var lightColor = ' #D7E1E7';

// Updates the sidebar with current turn, puzzle rating, and clears previous move info
export function updateSidebar(turn, rating) {
    document.getElementById('turn-info').textContent = turn === 'w' ? 'Black to move' : 'White to move';
    document.getElementById('rating-info').textContent = rating;
    document.getElementById('move-info').textContent = '';  // Clear any previous move info
}

// Displays an error message if an invalid move is made
export function displayInvalidMove() {
    document.getElementById('move-info').textContent = 'Wrong move, try again!';
}

export function changeBoardAndNotationTheme(lightColor, darkColor) {
    const styleElement = document.getElementById('boardNotation-style');
    if(!styleElement){
        const style = document.createElement('style');
        style.id = 'boardNotation-style';
        document.head.appendChild(style);
    }
    document.getElementById('boardNotation-style').innerHTML = `
        .white-1e1d7 
        { background-color: ${lightColor} !important;
         color: ${darkColor} !important; }
        .black-3c85d 
        { background-color: ${darkColor} !important; 
        color: ${lightColor} !important; }
    `;
}