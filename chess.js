var board = null;
var game = new Chess();
var $status = $('#status');
var squareSelected = null;
var gameMode = 'ai'; // 'ai' or 'local'
var redoStack = [];

function removeHighlights () {
    $('#board .square-55d63').css('background', '');
    $('.legal-move-hint').remove();
}

function highlightSquare (square) {
    var $square = $('#board .square-' + square);
    var isNeon = $('body').hasClass('neon-theme');
    var background = isNeon ? '#4a4e69' : '#a9a9a9';
    if ($square.hasClass('black-3c85d')) {
        background = isNeon ? '#353b52' : '#696969';
    }
    $square.css('background', background);
}

function showLegalMoves (square) {
    var moves = game.moves({
        square: square,
        verbose: true
    });

    if (moves.length === 0) return;

    for (var i = 0; i < moves.length; i++) {
        var $square = $('#board .square-' + moves[i].to);
        $square.append('<div class="legal-move-hint"></div>');
    }
}

function makeBestMove () {
    if (game.game_over()) return;
    
    var possibleMoves = game.moves();
    if (possibleMoves.length === 0) return;

    var bestMove = null;
    var bestValue = -9999;

    for (var i = 0; i < possibleMoves.length; i++) {
        var move = possibleMoves[i];
        game.move(move);
        var boardValue = -evaluateBoard(game.board());
        game.undo();
        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    }

    game.move(bestMove || possibleMoves[Math.floor(Math.random() * possibleMoves.length)]);
    board.position(game.fen());
    updateStatus();
}

function evaluateBoard (board) {
    var totalEvaluation = 0;
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            totalEvaluation = totalEvaluation + getPieceValue(board[i][j]);
        }
    }
    return totalEvaluation;
}

function getPieceValue (piece) {
    if (piece === null) return 0;
    var getAbsoluteValue = function (piece) {
        if (piece.type === 'p') return 10;
        if (piece.type === 'r') return 50;
        if (piece.type === 'n') return 30;
        if (piece.type === 'b') return 30;
        if (piece.type === 'q') return 90;
        if (piece.type === 'k') return 900;
        throw "Unknown piece type: " + piece.type;
    };
    var absoluteValue = getAbsoluteValue(piece);
    return piece.color === 'w' ? absoluteValue : -absoluteValue;
}

function onSnapEnd () {
    board.position(game.fen());
}

function updateStatus () {
    var status = '';
    var moveColor = 'White';
    if (game.turn() === 'b') {
        moveColor = 'Black';
    }

    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
    } else if (game.in_draw()) {
        status = 'Game over, drawn position';
    } else {
        status = moveColor + ' to move';
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check';
        }
    }

    $status.html(status);
    $('#undoBtn').prop('disabled', game.history().length === 0);
    $('#redoBtn').prop('disabled', redoStack.length === 0);
}

var config = {
    draggable: false,
    position: 'start',
    onSnapEnd: onSnapEnd,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

$(document).ready(function() {
    board = Chessboard('board', config);
    updateStatus();

    // Click to move logic
    $('#board').on('click', '.square-55d63', function () {
        if (game.game_over()) return;
        
        if (gameMode === 'ai' && game.turn() === 'b') return;

        var square = $(this).attr('data-square');

        if (squareSelected) {
            var move = game.move({
                from: squareSelected,
                to: square,
                promotion: 'q'
            });

            if (move === null) {
                var piece = game.get(square);
                if (piece && piece.color === game.turn()) {
                    squareSelected = square;
                    removeHighlights();
                    highlightSquare(square);
                    showLegalMoves(square);
                } else {
                    squareSelected = null;
                    removeHighlights();
                }
            } else {
                board.position(game.fen());
                redoStack = [];
                updateStatus();
                squareSelected = null;
                removeHighlights();
                
                if (gameMode === 'ai' && !game.game_over()) {
                    window.setTimeout(makeBestMove, 250);
                }
            }
        } else {
            var piece = game.get(square);
            if (piece && piece.color === game.turn()) {
                squareSelected = square;
                highlightSquare(square);
                showLegalMoves(square);
            }
        }
    });

    $('#undoBtn').on('click', function() {
        var move = game.undo();
        if (move) {
            redoStack.push(move);
            if (gameMode === 'ai' && game.turn() === 'b') {
                var humanMove = game.undo();
                if (humanMove) redoStack.push(humanMove);
            }
            board.position(game.fen());
            updateStatus();
        }
    });

    $('#redoBtn').on('click', function() {
        var move = redoStack.pop();
        if (move) {
            game.move(move);
            if (gameMode === 'ai' && game.turn() === 'b' && redoStack.length > 0) {
                var aiMove = redoStack.pop();
                game.move(aiMove);
            }
            board.position(game.fen());
            updateStatus();
        }
    });

    $('#flipBtn').on('click', function() {
        board.orientation('flip');
    });

    $('#modeBtn').on('click', function() {
        if (gameMode === 'ai') {
            gameMode = 'local';
            $(this).text('Switch to AI Mode');
            $('#title').text('Chess: Local Multiplayer');
        } else {
            gameMode = 'ai';
            $(this).text('Switch to Local Play');
            $('#title').text('Chess: AI Mode');
            if (game.turn() === 'b') makeBestMove();
        }
    });

    $('#themeBtn').on('click', function() {
        $('body').toggleClass('neon-theme');
        var isNeon = $('body').hasClass('neon-theme');
        $(this).text(isNeon ? 'Classic Theme' : 'Neon Theme');
    });

    $('#resetBtn').on('click', function() {
        game.reset();
        board.start();
        squareSelected = null;
        redoStack = [];
        removeHighlights();
        updateStatus();
    });
});