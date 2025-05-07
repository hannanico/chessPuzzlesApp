export var darkColor = ' #7D9EB2'; 
export var lightColor = ' #D7E1E7';
export var userColor = 'white';

var cyanColor = ' #08a4a7';

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

// Determines the user's color based on the FEN string
export function setUserColorFromFEN(turn) {
    var activeColor = turn;
    console.log(`activeColor ${activeColor}`);

    if (activeColor === 'w') {
        return userColor = 'black';  // User plays as black
    } else {
       return userColor = 'white';  // User plays as white
    }
}

export function showMovingPiece(solutionMoves) {
    if (solutionMoves.length > 0) {
        const move = solutionMoves[0];  // Get the next move from the solution
        const currentSquare = move.substring(0, 2); // The current square is the 'from' square (e.g., 'e2')

        // Create a style tag if it doesn't already exist
        const styleElement = document.getElementById('showMovingPiece-style');
        if (!styleElement) {
            const style = document.createElement('style');
            style.id = 'showMovingPiece-style';
            document.head.appendChild(style);
        }

        // Use the square class to specifically target the square (e.g., `.square-e2`)
        const targetSquareClass = `.square-${currentSquare}`;

        // Add CSS to highlight only the targeted square
        document.getElementById('showMovingPiece-style').innerHTML = `
            ${targetSquareClass} {
                background-color: ${cyanColor} !important; /* Highlight the square */
            }
        `;
    }
}

export function clearHighlightedSquares() {
    const styleElement = document.getElementById('showMovingPiece-style');
    if (styleElement) {
        styleElement.innerHTML = ''; // Clear all styles, effectively removing the highlight
    }
}