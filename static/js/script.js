import {startTimer} from "../js/timer.js";
import {incrementPuzzlesSolved, displayPuzzlesCompleted} from "../js/localPuzzleData.js";
import { cyanColor, darkColor, lightColor, updateSidebar, displayInvalidMove, changeBoardAndNotationTheme } from "../js/ui.js";

var board = null;
var game = new Chess();
var solutionMoves = [];
var userColor = 'white';

const loadRatedPuzzlesButton = document.getElementById('loadRatedPuzzles');
const newPuzzleButton = document.getElementById('newPuzzle');

var currentMinRating = 400;
var currentMaxRating = 3500;

function validateRatingInput(minRating, maxRating){
    if ((minRating === '' || minRating === null) && (maxRating === '' || maxRating === null)) {
        return true;
    }

    //Have to convert to numbers because of the way javascript handles inputs
    minRating = Number(minRating);
    maxRating = Number(maxRating);

    // Check valid ranges
    if (minRating < 400 || maxRating > 3500 || minRating > maxRating) {
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
            // Make the computer's move if it's their turn
            makeMachineMove();
            // Start the timer for the puzzle
            startTimer();
        })
        .catch(error => {
            console.error('Error loading puzzle:', error);
        });
}

function loadRatedPuzzles(){
    currentMinRating = document.getElementById('minRating').value;
    currentMaxRating = document.getElementById('maxRating').value;

    if(validateRatingInput(currentMinRating, currentMaxRating)){
        fetchPuzzles(currentMinRating, currentMaxRating);
    }
};

function checkAndLoadNewPuzzle(){
    if(solutionMoves.length === 0){
        console.log('Puzzle solved!');
        document.getElementById('move-info').textContent = 'Good job! Puzzle solved!';
        incrementPuzzlesSolved();
        setTimeout(() => fetchPuzzles(currentMinRating, currentMaxRating), 600);
    }
};

function executeMove(move) {
    var from = move.substring(0, 2);
    var to = move.substring(2, 4);
    var moveObject = game.move({ from, to, promotion: 'q' });

    const styleElement = document.getElementById('showMovingPiece-style');
        if (styleElement) {
            styleElement.innerHTML = ''; // Clear all styles, effectively removing the highlight
        }

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

function showMovingPiece() {
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
    const piece = game.get(source);
    if(piece && piece.type === 'p' && (target[1] === '8' || target[1] === '1')){
        move += 'q';  // Add promotion to queen
    }
    return move === expectedMove;
}

// Prevents the player from dragging the opponent's pieces
function onDragStart(source,piece) {
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

// Initialize the chessboard configuration
board = Chessboard('myBoard', {
    pieceTheme: '/static/img/{piece}.png',
    draggable: true,
    showNotation:true,
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

         // Remove the style to reset the highlight
         const styleElement = document.getElementById('showMovingPiece-style');
         if (styleElement) {
             styleElement.innerHTML = ''; // Clear all styles, effectively removing the highlight
         }

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

// Sets the orientation of the board based on the user's color
function setBoardOrientation() {
    board.orientation(userColor);
}

// Determines the user's color based on the FEN string
function setUserColorFromFEN(fen) {
    var parts = fen.split(' ');
    console.log(`activeColor ${parts[1]}`);
    var activeColor = parts[1];

    if (activeColor === 'w') {
        userColor = 'black';  // User plays as black
    } else {
        userColor = 'white';  // User plays as white
    }
}

// Load the initial puzzle on page load
changeBoardAndNotationTheme(lightColor, darkColor);
displayPuzzlesCompleted();
fetchPuzzles();

// Bind a click event to load a new puzzle
if(loadRatedPuzzlesButton){
    document.getElementById('loadRatedPuzzles').addEventListener('click', loadRatedPuzzles);
}
if(newPuzzleButton){
    document.getElementById('newPuzzle').addEventListener('click', fetchPuzzles);
}
document.getElementById('showNextMove').addEventListener('click', showNextMove);
document.getElementById('solvePuzzle').addEventListener('click', solvePuzzle);
document.getElementById('showMovingPiece').addEventListener('click', showMovingPiece);

document.getElementById('rating-min').oninvalid = function(event) {
    event.target.setCustomValidity('Minimum rating must be at least 300.');
};
document.getElementById('rating-max').oninvalid = function(event) {
    event.target.setCustomValidity('Maximum rating must not exceed 3500.');
};

