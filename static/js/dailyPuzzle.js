import {startTimer, resetTimer} from "./timer.js";
import { darkColor, lightColor, updateSidebar, displayInvalidMove, changeBoardAndNotationTheme, setUserColorFromFEN, userColor, clearHighlightedSquares, showMovingPiece } from "./ui.js";
import { incrementDailyPuzzlesCompleted, loadDailyPuzzlesCompleted } from "../js/localPuzzleData.js";

var board = null;
var game = new Chess();
var solutionMoves = [];
var lastPuzzleDate = null;

// Fetches and loads the daily puzzle from the server
function fetchDailyPuzzle() {
    fetch('get-daily-puzzle')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error loading daily puzzle:', data.error);
                return;
            }

            console.log('Daily puzzle data:', data);
            
            // Check if this is a new puzzle
            if (lastPuzzleDate !== data.Date) {
                lastPuzzleDate = data.Date;
                
                // Set up the chessboard with the new puzzle
                game.load(data.FEN);
                board.position(data.FEN);
                setUserColorFromFEN(data.FEN.split(' ')[1]);
                updateSidebar(data.FEN.split(' ')[1], data.Rating);
             
                // Store the solution moves
                solutionMoves = data.Moves.split(' ');
                console.log('Puzzle Moves:', solutionMoves);
                
                board.orientation(userColor);
                // Make the computer's move if it's their turn
                makeMachineMove();
                // Start the timer for the puzzle
                startTimer();
            }
        })
        .catch(error => {
            console.error('Error loading daily puzzle:', error);
        });
}

function executeMove(move) {
    clearHighlightedSquares();

    var from = move.substring(0, 2);
    var to = move.substring(2, 4);
    var moveObject = game.move({ from, to, promotion: 'q' });

    if (moveObject === null) {
        console.error('Invalid move:', move);
        return false;
    } else {
        onSnapEnd();
        console.log('Move executed:', move);
        return true;
    }
}

function makeMachineMove() {
    if (solutionMoves.length > 0 && executeMove(solutionMoves.shift())) {
        if(solutionMoves.length === 0){
            console.log('Daily puzzle solved!');
            document.getElementById('move-info').textContent = 'Congratulations! You solved today\'s puzzle!';
            incrementDailyPuzzlesCompleted();
            resetTimer();
        }
    }
}

function validateMove(source, target) {
    var expectedMove = solutionMoves[0];
    var move = source + target;
    const piece = game.get(source);
    if(piece && piece.type === 'p' && (target[1] === '8' || target[1] === '1')){
        move += 'q';
    }
    return move === expectedMove;
}

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

// Initialize the chessboard configuration
board = Chessboard('myBoard', {
    pieceTheme: '/static/img/{piece}.png',
    draggable: true,
    showNotation: true,
    position: 'start',
    snapSpeed: 'fast',
    moveSpeed: 'fast',
    onSnapEnd: onSnapEnd,
    onDrop: function (source, target) {
        if (!validateMove(source, target)) {
            console.log('Invalid move');
            displayInvalidMove();
            return 'snapback';
        }

        var move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        clearHighlightedSquares();

        if (move === null) return 'snapback';

        console.log('Move made:', move);
        onSnapEnd();
        solutionMoves.shift();

        if (solutionMoves.length > 0) {
            setTimeout(makeMachineMove, 500);
        }

        if(solutionMoves.length === 0){
            console.log('Daily puzzle solved!');
            document.getElementById('move-info').textContent = 'Congratulations! You solved today\'s puzzle!';
            incrementDailyPuzzlesCompleted();
            resetTimer();
        }
    },
    onDragStart: onDragStart,
    onDragEnd: onDragEnd
});

// Initialize the page
changeBoardAndNotationTheme(lightColor, darkColor);
loadDailyPuzzlesCompleted();
fetchDailyPuzzle();

// Check for new daily puzzle every minute
setInterval(fetchDailyPuzzle, 60000);

document.getElementById('showNextMove').addEventListener('click', () => {
    if (solutionMoves.length > 0 && executeMove(solutionMoves.shift())) {
        setTimeout(makeMachineMove, 650);
    }
});

document.getElementById('showMovingPiece').addEventListener('click', () => {
    showMovingPiece(solutionMoves);
}); 