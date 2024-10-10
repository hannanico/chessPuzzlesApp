var board = null;
var game = new Chess();

function loadPuzzle() {
    fetch('/get-puzzle')
        .then(response => response.json())
        .then(data => {
            console.log('Puzzle data:', data);

            // Set the FEN for the puzzle and reset the board
            game.load(data.FEN);
            board.position(data.FEN);
            
            // Store solution moves if needed for validation
            var solutionMoves = data.Moves.split(' ');
            console.log('Puzzle Moves:', solutionMoves);
        })
        .catch(error => {
            console.error('Error loading puzzle:', error);
        });
}

// Initialize the chessboard
board = Chessboard('board', {
    draggable: true,
    position: 'start',
    onDrop: function(source, target) {
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q' // Promote to a queen by default
        });

        if (move === null) return 'snapback'; // Invalid move

        console.log('Move made:', move);
    }
});

// Load the first puzzle on page load
loadPuzzle();

// Load a new puzzle when the button is clicked
document.getElementById('newPuzzle').addEventListener('click', loadPuzzle);
