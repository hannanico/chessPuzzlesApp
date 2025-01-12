var board = null;
var game = new Chess();
var solutionMoves = [];
var userColor = 'white';

var currentMinRating = 400;
var currentMaxRating = 3500;

// Updates the sidebar with current turn, puzzle rating, and clears previous move info
function updateSidebar(turn, rating) {
    document.getElementById('turn-info').textContent = turn === 'w' ? 'Black to move' : 'White to move';
    document.getElementById('rating-info').textContent = rating;
    document.getElementById('move-info').textContent = '';  // Clear any previous move info
}

// Displays an error message if an invalid move is made
function displayInvalidMove() {
    document.getElementById('move-info').textContent = 'Invalid move, please try again.';
}

function validateRatingInput(minRating, maxRating){
    if(minRating < 400 || minRating > 3500 || minRating > maxRating){
        alert('Please enter a minimum rating of at least 400 and a maximum rating no greater than 3500. The minimum rating must also be less than the maximum rating.');
        return false;
    }
    return true
}

// Fetches and loads a new puzzle from the server
function fetchPuzzles(minRating, maxRating) {
    fetch(`get-puzzle?minRating=${minRating}&maxRating=${maxRating}`)
        .then(response => response.json())
        .then(data => {
            console.log('Puzzle data:', data);

            // Set up the chessboard with the new puzzle
            game.load(data.FEN);
            board.position(data.FEN);
            setUserColorFromFEN(data.FEN);
            updateSidebar(data.FEN.split(' ')[1], data.Rating);

            // Store the solution moves
            solutionMoves = data.Moves.split(' ');
            console.log('Puzzle Moves:', solutionMoves);

            // Ensure the board orientation is correct for the player
            setBoardOrientation();
            makeMachineMove();  // Make the computer's move if it's their turn
        })
        .catch(error => {
            console.error('Error loading puzzle:', error);
        });
}

function loadRatedPuzzles(){
    currentMinRating = document.getElementById('ratingMin').value;
    currentMaxRating = document.getElementById('ratingMax').value;

    if(validateRatingInput(ratingMin, ratingMax)){
        fetchPuzzles(currentMinRating, currentMaxRating);
    }
};

function checkAndLoadNewPuzzle(){
    if(solutionMoves.length === 0){
        console.log('Puzzle solved!');
        setTimeout(() => fetchPuzzles(currentMinRating, currentMaxRating), 600);
    }
};

function executeMove(move) {
    var from = move.substring(0, 2);
    var to = move.substring(2, 4);
    var moveObject = game.move({ from, to, promotion: 'q' });

    if (moveObject === null) {
        console.error('Invalid move:', move);
        return false;
    } else {
        board.position(game.fen());  // Update board to reflect move
        console.log('Move executed:', move);
        return true;
    }
}

// Executes the computer's move from the solution sequence
function makeMachineMove() {
    if (solutionMoves.length > 0 && executeMove(solutionMoves.shift())) {
        checkAndLoadNewPuzzle();
    }
}

function showNextMove(){
    if (solutionMoves.length > 0 && executeMove(solutionMoves.shift())) {
        setTimeout(makeMachineMove, 650); 
        checkAndLoadNewPuzzle();
    }
};

function solvePuzzle(){
    if(solutionMoves.length > 0){
       if(executeMove(solutionMoves.shift())){
            setTimeout(solvePuzzle, 650);
       }else{
           console.error('Error solving puzzle');
       }
    }else{
        console.log('Puzzle solved!');
        fetchPuzzles(currentMinRating, currentMaxRating);
    }
};

// Validates the user's move against the expected move
function validateMove(source, target) {
    var expectedMove = solutionMoves[0];
    var move = source + target;
    return move === expectedMove;
}

// Determines the user's color based on the FEN string
function setUserColorFromFEN(fen) {
    var parts = fen.split(' ');
    var activeColor = parts[1];

    if (activeColor === 'w') {
        userColor = 'black';  // User plays as black
    } else {
        userColor = 'white';  // User plays as white
    }
}

// Sets the orientation of the board based on the user's color
function setBoardOrientation() {
    board.orientation(userColor);
}

// Prevents the player from dragging the opponent's pieces
function onDragStart(source, piece) {
    if ((userColor === 'white' && piece.search(/^b/) !== -1) || 
        (userColor === 'black' && piece.search(/^w/) !== -1)) {
        return false;
    }
    document.body.style.overflow = 'hidden';
}

function onDragEnd() {
    document.body.style.overflow = 'auto';
}

function onSnapEnd() {
    board.position(game.fen());
}

function changeBoardTheme(lightColor, darkColor) {
    const styleElement = document.getElementById('dynamic-board-style');
    if(!styleElement){
        const style = document.createElement('style');
        style.id = 'dynamic-board-style';
        document.head.appendChild(style);
    }
    document.getElementById('dynamic-board-style').innerHTML = `
        .white-1e1d7 { background-color: ${lightColor} !important; }
        .black-3c85d { background-color: ${darkColor} !important; }
    `;
}

// Initialize the chessboard configuration
board = Chessboard('myBoard', {
    pieceTheme: '/static/img/{piece}.png',
    draggable: true,
    position: 'start',
    onSnapEnd: onSnapEnd,
    onDrop: function (source, target) {
        if (!validateMove(source, target)) {
            console.log('Invalid move');
            displayInvalidMove();
            return 'snapback';
        }

        // Execute a valid move
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q'  // Automatically promote pawns to a queen
        });

        if (move === null) return 'snapback';

        console.log('Move made:', move);
        board.position(game.fen());
        solutionMoves.shift();

        // Execute machine's move if there are any left
        if (solutionMoves.length > 0) {
            setTimeout(makeMachineMove, 500);
        }

        // Load a new puzzle when the current one is solved
        checkAndLoadNewPuzzle();
    },
    onDragStart: onDragStart,
    onDragEnd: onDragEnd
});

// Load the initial puzzle on page load
changeBoardTheme('#7D9EB2', '#D7E1E7');
fetchPuzzles();

// Bind a click event to load a new puzzle
document.getElementById('newPuzzle').addEventListener('click', fetchPuzzles);
document.getElementById('showNextMove').addEventListener('click', showNextMove);
document.getElementById('solvePuzzle').addEventListener('click', solvePuzzle);
document.getElementById('loadRatedPuzzles').addEventListener('click', loadRatedPuzzles);

document.getElementById('rating-min').oninvalid = function(event) {
    event.target.setCustomValidity('Minimum rating must be at least 300.');
};
document.getElementById('rating-max').oninvalid = function(event) {
    event.target.setCustomValidity('Maximum rating must not exceed 3500.');
};

