var board = null;
var game = new Chess();
var solutionMoves = [];
var userColor = 'white';

function updateSidebar(turn, rating) {
    document.getElementById('turn-info').textContent = turn === 'w' ? 'Black to move' : 'White to move';
    document.getElementById('rating-info').textContent = 'Puzzle rating: ' + rating;
    document.getElementById('move-info').textContent = '';  // Clear any previous move info
}

function displayInvalidMove() {
    // Display the invalid move message below the rating
    document.getElementById('move-info').textContent = 'Invalid move, please try again.';
}


function loadPuzzle() {
    fetch('/get-puzzle')
        .then(response => response.json())
        .then(data => {
            console.log('Puzzle data:', data);

            // Set the FEN for the puzzle and reset the board
            game.load(data.FEN);
            board.position(data.FEN);

            setUserColorFromFEN(data.FEN);

            // Update sidebar with whose turn and puzzle rating
            updateSidebar(data.FEN.split(' ')[1], data.Rating);

            // Store solution moves for validation
            solutionMoves = data.Moves.split(' ');
            console.log('Puzzle Moves:', solutionMoves);

            setBoardOrientation();  // Ensure correct orientation for the player's color

            makeMachineMove();  // Let the machine make its move if needed
        })
        .catch(error => {
            console.error('Error loading puzzle:', error);
        });
}

function makeMachineMove() {
    if (solutionMoves.length > 0) {
        var move = solutionMoves.shift();  // Get the next move from the solution
        var from = move.substring(0, 2);
        var to = move.substring(2, 4);
        var moveObject = game.move({ from, to });

        if (moveObject === null) {
            console.error('Invalid move by machine:', move);
        } else {
            // Update the board with the new FEN after machine move
            board.position(game.fen());  // Sync board with the current game position
            console.log('Machine made move:', move);
        }
    }
}

function validateMove(source, target) {
    var expectedMove = solutionMoves[0];  // The next expected move
    var move = source + target;

    return move === expectedMove;
}

function setUserColorFromFEN(fen) {
    var parts = fen.split(' ');
    var activeColor = parts[1];

    if (activeColor === 'w') {
        userColor = 'black';  // Player is black, machine moves first
    } else {
        userColor = 'white';  // Player is white, machine is black
    }
}

function setBoardOrientation() {
    if (userColor === 'black') {
        board.orientation('black');  // Set board orientation to black
    } else {
        board.orientation('white');  // Set board orientation to white
    }
}

function onDragStart(source, piece) {
    // Block the user's move if they're trying to move the opponent's pieces
    if ((userColor === 'white' && piece.search(/^b/) !== -1) || 
        (userColor === 'black' && piece.search(/^w/) !== -1)) {
        return false;  // Prevent dragging opponent's pieces
    }

    document.body.style.overflow = 'hidden';
}

function ondragend(){
    document.body.style.overflow = 'auto';
}

// Initialize the chessboard
board = Chessboard('myBoard', {
    pieceTheme: '/static/img/{piece}.png',
    draggable: true,
    position: 'start',
    onDrop: function (source, target) {
        if (!validateMove(source, target)) {
            console.log('Invalid move');
            displayInvalidMove();
            return 'snapback';
        }

        var move = game.move({
            from: source,
            to: target,
            promotion: 'q'  // Promote to a queen by default
        });

        if (move === null) return 'snapback';  // Invalid move

        console.log('Move made:', move);
        board.position(game.fen());
        solutionMoves.shift();  // Remove the move from the list after making it

        // If there are remaining machine moves, let the machine move
        if (solutionMoves.length > 0) {
            setTimeout(makeMachineMove, 500);
        }

        // Load a new puzzle once the current one is solved
        if (solutionMoves.length === 0) {
            console.log('Puzzle solved!');
            loadPuzzle();
        }
    },
    onDragStart: onDragStart,  // Hook the onDragStart event
    ondragend: ondragend
});

// Load the first puzzle on page load
loadPuzzle();

// Load a new puzzle when the button is clicked
document.getElementById('newPuzzle').addEventListener('click', loadPuzzle);
