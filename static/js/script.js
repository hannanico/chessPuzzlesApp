var board = null;
var game = new Chess();
var solutionMoves = [];
var userColor = 'white';

function loadPuzzle() {
    fetch('/get-puzzle')
        .then(response => response.json())
        .then(data => {
            console.log('Puzzle data:', data);

            // Set the FEN for the puzzle and reset the board
            game.load(data.FEN);
            board.position(data.FEN);

            setUserColorFromFEN(data.FEN);
            
            // Store solution moves if needed for validation
            solutionMoves = data.Moves.split(' ');
            console.log('Puzzle Moves:', solutionMoves);

            setBoardOrientation();

            makeMachineMove();
        })
        .catch(error => {
            console.error('Error loading puzzle:', error);
        });
}

function makeMachineMove() {
    if(solutionMoves.length > 0){
        var move = solutionMoves.shift();

        var from = move.substring(0,2);
        var to = move.substring(2,4);
        var moveObject = game.move({from, to});

        if (moveObject === null) {
            console.error('Invalid move by machine:', move);
        } else {
            // Update the board with the new FEN after machine move
            board.position(game.fen());  // Sync board with the current game position
            console.log('Machine made move:', move);
        }
    }
}

function validateMove(source,target){
    var expectedMove = solutionMoves[0];
    var move = source + target;

    return move === expectedMove;
}

function setUserColorFromFEN(fen){
    var parts = fen.split(' ');
    var activeColor = parts[1];

    if(activeColor === 'w'){
        userColor = 'white';
    } else {
        userColor = 'black';
    }
}

function setBoardOrientation(){
    if(userColor === 'black'){
        board.orientation('white');
    } else {
        board.orientation('black');
    }
}

function onDragStart(source, piece) {
    // If the user is playing white and tries to move a black piece, block it
    if (userColor === 'white' && piece.search(/^w/) !== -1) {
        return false;
    }
    // If the user is playing black and tries to move a white piece, block it
    if (userColor === 'black' && piece.search(/^b/) !== -1) {
        return false;
    }
    // Allow the move otherwise
}

// Initialize the chessboard
board = Chessboard('myBoard', {
    pieceTheme: '/static/img/{piece}.png',
    draggable: true,
    position: 'start',
    onDrop: function(source, target) {

        if(!validateMove(source,target)){
            console.log('Invalid move');
            return 'snapback';
        }

        var move = game.move({
            from: source,
            to: target,
            promotion: 'q' // Promote to a queen by default
        });

        if (move === null) return 'snapback'; // Invalid move

        console.log('Move made:', move);

        board.position(game.fen());
        solutionMoves.shift();

        if(solutionMoves.length > 0){
            setTimeout(makeMachineMove, 500);
        }

        if(solutionMoves.length === 0){
            console.log('Puzzle solved!');
            loadPuzzle();
        }
    },
    onDragStart: onDragStart // Hook the onDragStart event
});

// Load the first puzzle on page load
loadPuzzle();

// Load a new puzzle when the button is clicked
document.getElementById('newPuzzle').addEventListener('click', loadPuzzle);
