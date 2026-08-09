package com.example.chess

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class PieceType { PAWN, ROOK, KNIGHT, BISHOP, QUEEN, KING }
enum class PlayerColor { WHITE, BLACK }
data class ChessPiece(val type: PieceType, val color: PlayerColor)
data class Position(val row: Int, val col: Int)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ChessGameScreen()
        }
    }
}

@Composable
fun ChessGameScreen() {
    var board by remember { mutableStateOf(initialBoard()) }
    var selectedPos by remember { mutableStateOf<Position?>(null) }
    var turn by remember { mutableStateOf(PlayerColor.WHITE) }
    var isVsComputer by remember { mutableStateOf(true) }

    fun handleMove(from: Position, to: Position) {
        val piece = board[from] ?: return
        val newBoard = board.toMutableMap()
        newBoard[to] = piece
        newBoard.remove(from)
        board = newBoard
        turn = if (turn == PlayerColor.WHITE) PlayerColor.BLACK else PlayerColor.WHITE
        
        if (isVsComputer && turn == PlayerColor.BLACK) {
            // Basic AI: Move a random black piece
            val blackPieces = board.filter { it.value.color == PlayerColor.BLACK }.keys.toList()
            if (blackPieces.isNotEmpty()) {
                val randomFrom = blackPieces.random()
                val randomTo = Position((randomFrom.row + 1) % 8, randomFrom.col)
                val aiBoard = board.toMutableMap()
                aiBoard[randomTo] = aiBoard[randomFrom]!!
                aiBoard.remove(randomFrom)
                board = aiBoard
                turn = PlayerColor.WHITE
            }
        }
    }

    Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Chess Game", fontSize = 24.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(16.dp))
        Row {
            Button(onClick = { isVsComputer = !isVsComputer }) {
                Text(if (isVsComputer) "Mode: VS Computer" else "Mode: 2 Player")
            }
            Spacer(Modifier.width(8.dp))
            Button(onClick = { board = initialBoard(); turn = PlayerColor.WHITE }) { Text("Reset") }
        }
        Text("Turn: $turn", modifier = Modifier.padding(8.dp))

        Box(modifier = Modifier.size(360.dp).background(Color.Gray)) {
            LazyVerticalGrid(columns = GridCells.Fixed(8)) {
                items(64) { index ->
                    val row = index / 8
                    val col = index % 8
                    val pos = Position(row, col)
                    val piece = board[pos]
                    val isDark = (row + col) % 2 != 0
                    
                    Box(
                        modifier = Modifier
                            .size(45.dp)
                            .background(if (selectedPos == pos) Color.Yellow else if (isDark) Color(0xFF769656) else Color(0xFFEEEED2))
                            .clickable {
                                if (selectedPos == null) {
                                    if (piece?.color == turn) selectedPos = pos
                                } else {
                                    handleMove(selectedPos!!, pos)
                                    selectedPos = null
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        if (piece != null) {
                            Text(
                                text = getPieceSymbol(piece),
                                fontSize = 24.sp,
                                color = if (piece.color == PlayerColor.WHITE) Color.White else Color.Black
                            )
                        }
                    }
                }
            }
        }
    }
}

fun getPieceSymbol(piece: ChessPiece): String = when (piece.type) {
    PieceType.PAWN -> "♙"; PieceType.ROOK -> "♖"; PieceType.KNIGHT -> "♘"
    PieceType.BISHOP -> "♗"; PieceType.QUEEN -> "♕"; PieceType.KING -> "♔"
}

fun initialBoard(): Map<Position, ChessPiece> {
    val map = mutableMapOf<Position, ChessPiece>()
    for (i in 0..7) {
        map[Position(1, i)] = ChessPiece(PieceType.PAWN, PlayerColor.BLACK)
        map[Position(6, i)] = ChessPiece(PieceType.PAWN, PlayerColor.WHITE)
    }
    val setup = listOf(PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN, PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK)
    setup.forEachIndexed { i, type ->
        map[Position(0, i)] = ChessPiece(type, PlayerColor.BLACK)
        map[Position(7, i)] = ChessPiece(type, PlayerColor.WHITE)
    }
    return map
}