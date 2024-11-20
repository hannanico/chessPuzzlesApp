var board = null;
var game = new Chess();
var solutionMoves = [];
var userColor = 'white';

// Updates the sidebar with current turn, puzzle rating, and clears previous move info
function updateSidebar(turn, rating) {
    document.getElementById('turn-info').textContent = turn === 'w' ? 'Black to move' : 'White to move';
    document.getElementById('rating-info').textContent = 'Puzzle rating: ' + rating;
    document.getElementById('move-info').textContent = '';  // Clear any previous move info
}

// Displays an error message if an invalid move is made
function displayInvalidMove() {
    document.getElementById('move-info').textContent = 'Invalid move, please try again.';
}

// Fetches and loads a new puzzle from the server
function loadPuzzle() {
    fetch('/get-puzzle')
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

// Executes the computer's move from the solution sequence
function makeMachineMove() {
    if (solutionMoves.length > 0) {
        var move = solutionMoves.shift();  // Get the next move
        var from = move.substring(0, 2);
        var to = move.substring(2, 4);
        var moveObject = game.move({ from, to });

        if (moveObject === null) {
            console.error('Invalid move by machine:', move);
        } else {
            board.position(game.fen());  // Update board to reflect move
            console.log('Machine made move:', move);
        }
    }
}

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
        if (solutionMoves.length === 0) {
            console.log('Puzzle solved!');
            loadPuzzle();
        }
    },
    onDragStart: onDragStart,
    onDragEnd: onDragEnd
});

// Load the initial puzzle on page load
changeBoardTheme('#EAE8E7', '#326548');
loadPuzzle();

// Bind a click event to load a new puzzle
document.getElementById('newPuzzle').addEventListener('click', loadPuzzle);
