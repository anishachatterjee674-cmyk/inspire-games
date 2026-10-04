/**
 * Grandmaster Chess
 * Full Legal Chess Engine with Minimax AI & Local 2P
 * Inspire Games
 */

class ChessGame {
  constructor(container) {
    this.container = container;
    this.container.innerHTML = '';

    this.board = [];
    this.turn = 'w'; // 'w' or 'b'
    this.selectedSquare = null;
    this.validMoves = [];
    this.history = [];
    this.capturedWhite = [];
    this.capturedBlack = [];
    this.lastMove = null;
    this.checkState = null; // 'w', 'b', or null
    this.gameOver = false;
    this.gameOverReason = '';
    this.gameMode = 'ai'; // 'ai' or '2p'
    this.aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
    this.playerColor = 'w';
    this.enPassantSquare = null; // [r, c]
    this.castlingRights = {
      wK: true, wQ: true,
      bK: true, bQ: true
    };

    // Piece values for evaluation
    this.pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

    this.initDOM();
    this.resetBoard();
    this.render();
  }

  initDOM() {
    this.container.classList.add('chess-game-wrapper');
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'chess-container';

    this.wrapper.innerHTML = `
      <div class="chess-header-panel">
        <div class="chess-score-tray" id="chess-black-tray">
          <span class="player-label">Black: <span id="black-status">Computer</span></span>
          <span class="captured-pieces" id="black-captured"></span>
        </div>
        <div class="chess-controls">
          <select id="chess-mode-select" class="chess-btn-select">
            <option value="ai">Vs Computer AI</option>
            <option value="2p">2-Player Local</option>
          </select>
          <select id="chess-diff-select" class="chess-btn-select">
            <option value="easy">AI: Casual</option>
            <option value="medium" selected>AI: Intermediate</option>
            <option value="hard">AI: Grandmaster</option>
          </select>
          <button id="chess-undo-btn" class="chess-btn">Undo Move</button>
          <button id="chess-restart-btn" class="chess-btn">New Game</button>
        </div>
      </div>
      
      <div class="chess-board-area">
        <div class="chess-board" id="chess-board"></div>
      </div>

      <div class="chess-footer-panel">
        <div class="chess-score-tray" id="chess-white-tray">
          <span class="player-label">White: <span id="white-status">Player</span></span>
          <span class="captured-pieces" id="white-captured"></span>
        </div>
        <div class="chess-status-badge" id="chess-status">White to move</div>
      </div>
    `;

    this.container.appendChild(this.wrapper);
    this.boardEl = this.wrapper.querySelector('#chess-board');
    this.statusEl = this.wrapper.querySelector('#chess-status');
    this.blackTrayEl = this.wrapper.querySelector('#black-captured');
    this.whiteTrayEl = this.wrapper.querySelector('#white-captured');

    // Button event listeners
    this.wrapper.querySelector('#chess-mode-select').addEventListener('change', (e) => {
      this.gameMode = e.target.value;
      const diffSelect = this.wrapper.querySelector('#chess-diff-select');
      diffSelect.style.display = this.gameMode === 'ai' ? 'inline-block' : 'none';
      this.resetBoard();
      this.render();
    });

    this.wrapper.querySelector('#chess-diff-select').addEventListener('change', (e) => {
      this.aiDifficulty = e.target.value;
    });

    this.wrapper.querySelector('#chess-undo-btn').addEventListener('click', () => {
      this.undoMove();
    });

    this.wrapper.querySelector('#chess-restart-btn').addEventListener('click', () => {
      this.resetBoard();
      this.render();
    });
  }

  resetBoard() {
    // 8x8 standard chess starting position
    // Uppercase = White, Lowercase = Black
    this.board = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];

    this.turn = 'w';
    this.selectedSquare = null;
    this.validMoves = [];
    this.history = [];
    this.capturedWhite = [];
    this.capturedBlack = [];
    this.lastMove = null;
    this.checkState = null;
    this.gameOver = false;
    this.gameOverReason = '';
    this.enPassantSquare = null;
    this.castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
  }

  getPiece(r, c) {
    if (r < 0 || r > 7 || c < 0 || c > 7) return null;
    return this.board[r][c];
  }

  isWhite(piece) {
    return piece && piece === piece.toUpperCase();
  }

  isBlack(piece) {
    return piece && piece === piece.toLowerCase();
  }

  render() {
    this.boardEl.innerHTML = '';

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        const isLight = (r + c) % 2 === 0;
        sq.className = `chess-sq ${isLight ? 'light' : 'dark'}`;
        sq.dataset.row = r;
        sq.dataset.col = c;

        // Last move highlight
        if (this.lastMove && ((this.lastMove.from[0] === r && this.lastMove.from[1] === c) || (this.lastMove.to[0] === r && this.lastMove.to[1] === c))) {
          sq.classList.add('last-move');
        }

        // Selected square highlight
        if (this.selectedSquare && this.selectedSquare[0] === r && this.selectedSquare[1] === c) {
          sq.classList.add('selected');
        }

        // King check highlight
        const piece = this.board[r][c];
        if (this.checkState && piece) {
          if ((this.checkState === 'w' && piece === 'K') || (this.checkState === 'b' && piece === 'k')) {
            sq.classList.add('in-check');
          }
        }

        // Valid move hint
        const isMoveValid = this.validMoves.some((m) => m.to[0] === r && m.to[1] === c);
        if (isMoveValid) {
          const dot = document.createElement('div');
          dot.className = piece ? 'valid-capture' : 'valid-dot';
          sq.appendChild(dot);
        }

        // Piece symbol SVG / Unicode
        if (piece) {
          const pieceIcon = document.createElement('span');
          pieceIcon.className = `chess-piece ${this.isWhite(piece) ? 'white-piece' : 'black-piece'}`;
          pieceIcon.innerHTML = this.getPieceSymbol(piece);
          sq.appendChild(pieceIcon);
        }

        sq.addEventListener('click', () => this.handleSquareClick(r, c));
        this.boardEl.appendChild(sq);
      }
    }

    // Update status bar
    if (this.gameOver) {
      this.statusEl.innerHTML = `<span style="color: #ef4444; font-weight: bold;">GAME OVER: ${this.gameOverReason}</span>`;
    } else {
      const turnName = this.turn === 'w' ? 'White' : 'Black';
      const checkText = this.checkState ? ` - CHECK!` : '';
      this.statusEl.textContent = `${turnName} to move${checkText}`;
    }

    // Update Captured trays
    this.whiteTrayEl.innerHTML = this.capturedWhite.map((p) => this.getPieceSymbol(p)).join(' ');
    this.blackTrayEl.innerHTML = this.capturedBlack.map((p) => this.getPieceSymbol(p)).join(' ');
  }

  getPieceSymbol(piece) {
    const symbols = {
      K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
      k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
    };
    return symbols[piece] || '';
  }

  handleSquareClick(r, c) {
    if (this.gameOver) return;
    if (this.gameMode === 'ai' && this.turn !== this.playerColor) return;

    const clickedPiece = this.board[r][c];

    // If already selected, check if this is a legal target square
    if (this.selectedSquare) {
      const targetMove = this.validMoves.find((m) => m.to[0] === r && m.to[1] === c);
      if (targetMove) {
        this.makeMove(targetMove);
        this.selectedSquare = null;
        this.validMoves = [];
        this.render();

        // AI trigger
        if (!this.gameOver && this.gameMode === 'ai' && this.turn !== this.playerColor) {
          setTimeout(() => this.makeAIMove(), 350);
        }
        return;
      }
    }

    // Select piece if it's the current player's color
    if (clickedPiece && ((this.turn === 'w' && this.isWhite(clickedPiece)) || (this.turn === 'b' && this.isBlack(clickedPiece)))) {
      this.selectedSquare = [r, c];
      this.validMoves = this.getLegalMovesForPiece(r, c);
      this.render();
    } else {
      this.selectedSquare = null;
      this.validMoves = [];
      this.render();
    }
  }

  makeMove(move) {
    const [fromR, fromC] = move.from;
    const [toR, toC] = move.to;
    const piece = this.board[fromR][fromC];
    const target = this.board[toR][toC];

    // Save history state for undo
    this.history.push({
      board: this.board.map((row) => [...row]),
      turn: this.turn,
      castlingRights: { ...this.castlingRights },
      enPassantSquare: this.enPassantSquare ? [...this.enPassantSquare] : null,
      capturedWhite: [...this.capturedWhite],
      capturedBlack: [...this.capturedBlack],
      lastMove: this.lastMove
    });

    // Capture handling
    if (target) {
      if (this.isWhite(target)) this.capturedWhite.push(target);
      else this.capturedBlack.push(target);
    }

    // En Passant capture
    if (move.isEnPassant) {
      const capturedPawnRow = fromR;
      const capturedPawn = this.board[capturedPawnRow][toC];
      if (this.isWhite(capturedPawn)) this.capturedWhite.push(capturedPawn);
      else this.capturedBlack.push(capturedPawn);
      this.board[capturedPawnRow][toC] = null;
    }

    // Castling rook move
    if (move.isCastle) {
      if (toC === 6) { // Kingside
        this.board[fromR][5] = this.board[fromR][7];
        this.board[fromR][7] = null;
      } else if (toC === 2) { // Queenside
        this.board[fromR][3] = this.board[fromR][0];
        this.board[fromR][0] = null;
      }
    }

    // Move piece
    this.board[toR][toC] = piece;
    this.board[fromR][fromC] = null;

    // Pawn Promotion (Auto-promote to Queen for fluid gameplay)
    if (piece === 'P' && toR === 0) this.board[toR][toC] = 'Q';
    if (piece === 'p' && toR === 7) this.board[toR][toC] = 'q';

    // Update castling rights
    if (piece === 'K') { this.castlingRights.wK = false; this.castlingRights.wQ = false; }
    if (piece === 'k') { this.castlingRights.bK = false; this.castlingRights.bQ = false; }
    if (piece === 'R' && fromR === 7 && fromC === 0) this.castlingRights.wQ = false;
    if (piece === 'R' && fromR === 7 && fromC === 7) this.castlingRights.wK = false;
    if (piece === 'r' && fromR === 0 && fromC === 0) this.castlingRights.bQ = false;
    if (piece === 'r' && fromR === 0 && fromC === 7) this.castlingRights.bK = false;

    // Update En Passant potential
    if ((piece === 'P' || piece === 'p') && Math.abs(toR - fromR) === 2) {
      this.enPassantSquare = [(fromR + toR) / 2, fromC];
    } else {
      this.enPassantSquare = null;
    }

    this.lastMove = move;
    this.turn = this.turn === 'w' ? 'b' : 'w';

    // Check detection
    const opposingColor = this.turn;
    const inCheck = this.isKingInCheck(opposingColor, this.board);
    this.checkState = inCheck ? opposingColor : null;

    if (inCheck) {
      if (window.sound) window.sound.playChessCheck();
    } else {
      if (window.sound) window.sound.playChessMove();
    }

    // Checkmate or Stalemate
    const legalOpposingMoves = this.getAllLegalMoves(opposingColor, this.board);
    if (legalOpposingMoves.length === 0) {
      this.gameOver = true;
      if (inCheck) {
        const winner = opposingColor === 'w' ? 'Black' : 'White';
        this.gameOverReason = `Checkmate! ${winner} wins!`;
        if (window.sound) window.sound.playVictory();
      } else {
        this.gameOverReason = 'Stalemate! Game is a Draw.';
      }
    }
  }

  undoMove() {
    if (this.history.length === 0) return;
    const prev = this.history.pop();
    this.board = prev.board;
    this.turn = prev.turn;
    this.castlingRights = prev.castlingRights;
    this.enPassantSquare = prev.enPassantSquare;
    this.capturedWhite = prev.capturedWhite;
    this.capturedBlack = prev.capturedBlack;
    this.lastMove = prev.lastMove;
    this.gameOver = false;
    this.checkState = this.isKingInCheck(this.turn, this.board) ? this.turn : null;
    this.selectedSquare = null;
    this.validMoves = [];
    this.render();
  }

  getLegalMovesForPiece(r, c) {
    const rawMoves = this.getPseudoLegalMoves(r, c, this.board);
    const piece = this.board[r][c];
    const isWhite = this.isWhite(piece);
    const color = isWhite ? 'w' : 'b';

    // Filter out moves that leave king in check
    return rawMoves.filter((m) => {
      const simulatedBoard = this.board.map((row) => [...row]);
      simulatedBoard[m.to[0]][m.to[1]] = simulatedBoard[m.from[0]][m.from[1]];
      simulatedBoard[m.from[0]][m.from[1]] = null;

      if (m.isEnPassant) {
        simulatedBoard[m.from[0]][m.to[1]] = null;
      }

      return !this.isKingInCheck(color, simulatedBoard);
    });
  }

  getAllLegalMoves(color, currentBoard = this.board) {
    const allMoves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = currentBoard[r][c];
        if (p && ((color === 'w' && this.isWhite(p)) || (color === 'b' && this.isBlack(p)))) {
          const pseudo = this.getPseudoLegalMoves(r, c, currentBoard);
          for (const m of pseudo) {
            const sim = currentBoard.map((row) => [...row]);
            sim[m.to[0]][m.to[1]] = sim[m.from[0]][m.from[1]];
            sim[m.from[0]][m.from[1]] = null;
            if (m.isEnPassant) sim[m.from[0]][m.to[1]] = null;

            if (!this.isKingInCheck(color, sim)) {
              allMoves.push(m);
            }
          }
        }
      }
    }
    return allMoves;
  }

  getPseudoLegalMoves(r, c, b) {
    const p = b[r][c];
    if (!p) return [];

    const isWhite = this.isWhite(p);
    const type = p.toLowerCase();
    const moves = [];

    const addMove = (toR, toC, flags = {}) => {
      if (toR >= 0 && toR < 8 && toC >= 0 && toC < 8) {
        const destPiece = b[toR][toC];
        if (!destPiece) {
          moves.push({ from: [r, c], to: [toR, toC], ...flags });
          return true; // continue sliding
        } else if (this.isWhite(destPiece) !== isWhite) {
          moves.push({ from: [r, c], to: [toR, toC], ...flags });
          return false; // capture and stop sliding
        }
      }
      return false; // blocked by friendly
    };

    // 1. Pawn
    if (type === 'p') {
      const dir = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;

      // 1 square forward
      if (r + dir >= 0 && r + dir < 8 && !b[r + dir][c]) {
        moves.push({ from: [r, c], to: [r + dir, c] });
        // 2 squares forward
        if (r === startRow && !b[r + 2 * dir][c]) {
          moves.push({ from: [r, c], to: [r + 2 * dir, c] });
        }
      }

      // Diagonal captures
      [-1, 1].forEach((dc) => {
        const tr = r + dir;
        const tc = c + dc;
        if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
          const tgt = b[tr][tc];
          if (tgt && this.isWhite(tgt) !== isWhite) {
            moves.push({ from: [r, c], to: [tr, tc] });
          }
          // En passant
          if (this.enPassantSquare && this.enPassantSquare[0] === tr && this.enPassantSquare[1] === tc) {
            moves.push({ from: [r, c], to: [tr, tc], isEnPassant: true });
          }
        }
      });
    }

    // 2. Knight
    if (type === 'n') {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      knightOffsets.forEach(([dr, dc]) => addMove(r + dr, c + dc));
    }

    // 3. Bishop & Queen (diagonals)
    if (type === 'b' || type === 'q') {
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      dirs.forEach(([dr, dc]) => {
        let step = 1;
        while (addMove(r + dr * step, c + dc * step)) {
          step++;
        }
      });
    }

    // 4. Rook & Queen (straights)
    if (type === 'r' || type === 'q') {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      dirs.forEach(([dr, dc]) => {
        let step = 1;
        while (addMove(r + dr * step, c + dc * step)) {
          step++;
        }
      });
    }

    // 5. King
    if (type === 'k') {
      const kingDirs = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
      kingDirs.forEach(([dr, dc]) => addMove(r + dr, c + dc));

      // Castling
      if (isWhite && r === 7 && c === 4) {
        if (this.castlingRights.wK && !b[7][5] && !b[7][6] && b[7][7] === 'R') {
          moves.push({ from: [7, 4], to: [7, 6], isCastle: true });
        }
        if (this.castlingRights.wQ && !b[7][3] && !b[7][2] && !b[7][1] && b[7][0] === 'R') {
          moves.push({ from: [7, 4], to: [7, 2], isCastle: true });
        }
      } else if (!isWhite && r === 0 && c === 4) {
        if (this.castlingRights.bK && !b[0][5] && !b[0][6] && b[0][7] === 'r') {
          moves.push({ from: [0, 4], to: [0, 6], isCastle: true });
        }
        if (this.castlingRights.bQ && !b[0][3] && !b[0][2] && !b[0][1] && b[0][0] === 'r') {
          moves.push({ from: [0, 4], to: [0, 2], isCastle: true });
        }
      }
    }

    return moves;
  }

  isKingInCheck(color, board) {
    const kingChar = color === 'w' ? 'K' : 'k';
    let kingPos = null;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === kingChar) {
          kingPos = [r, c];
          break;
        }
      }
      if (kingPos) break;
    }

    if (!kingPos) return false;

    // Check if any opposing piece attacks kingPos
    const oppColor = color === 'w' ? 'b' : 'w';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && ((oppColor === 'w' && this.isWhite(p)) || (oppColor === 'b' && this.isBlack(p)))) {
          const attacks = this.getPseudoLegalMoves(r, c, board);
          if (attacks.some((m) => m.to[0] === kingPos[0] && m.to[1] === kingPos[1])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  makeAIMove() {
    const legalMoves = this.getAllLegalMoves('b', this.board);
    if (legalMoves.length === 0) return;

    let chosenMove = null;

    if (this.aiDifficulty === 'easy') {
      // Pick random legal move or basic capture
      const captures = legalMoves.filter((m) => this.board[m.to[0]][m.to[1]]);
      chosenMove = captures.length > 0 && Math.random() < 0.6
        ? captures[Math.floor(Math.random() * captures.length)]
        : legalMoves[Math.floor(Math.random() * legalMoves.length)];
    } else {
      // Minimax evaluation
      const depth = this.aiDifficulty === 'hard' ? 3 : 2;
      let bestScore = -Infinity;
      let bestMoves = [];

      for (const move of legalMoves) {
        const sim = this.board.map((row) => [...row]);
        sim[move.to[0]][move.to[1]] = sim[move.from[0]][move.from[1]];
        sim[move.from[0]][move.from[1]] = null;

        const score = -this.minimax(sim, depth - 1, -Infinity, Infinity, false);
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [move];
        } else if (score === bestScore) {
          bestMoves.push(move);
        }
      }
      chosenMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    if (chosenMove) {
      this.makeMove(chosenMove);
      this.render();
    }
  }

  minimax(board, depth, alpha, beta, isMaximizing) {
    if (depth === 0) {
      return this.evaluateBoard(board);
    }

    const color = isMaximizing ? 'b' : 'w';
    const moves = this.getAllLegalMoves(color, board);

    if (moves.length === 0) {
      if (this.isKingInCheck(color, board)) {
        return isMaximizing ? -10000 : 10000;
      }
      return 0; // stalemate
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const m of moves) {
        const sim = board.map((row) => [...row]);
        sim[m.to[0]][m.to[1]] = sim[m.from[0]][m.from[1]];
        sim[m.from[0]][m.from[1]] = null;
        const ev = this.minimax(sim, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const m of moves) {
        const sim = board.map((row) => [...row]);
        sim[m.to[0]][m.to[1]] = sim[m.from[0]][m.from[1]];
        sim[m.from[0]][m.from[1]] = null;
        const ev = this.minimax(sim, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  evaluateBoard(board) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          const val = this.pieceValues[p.toLowerCase()] || 0;
          if (this.isBlack(p)) {
            score += val;
          } else {
            score -= val;
          }
        }
      }
    }
    return score;
  }

  pause() {}
  resume() {}
  restart() {
    this.resetBoard();
    this.render();
  }
  destroy() {
    this.container.innerHTML = '';
  }
}

window.ChessGame = ChessGame;
