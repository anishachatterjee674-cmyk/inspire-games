/**
 * Cyber 2048: Neon Pulse
 * Number Fusion Brain Puzzle
 * Inspire Games
 */

class Game2048 {
  constructor(container) {
    this.container = container;
    this.container.innerHTML = '';

    this.size = 4;
    this.grid = [];
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('inspire_2048_high') || '0', 10);
    this.history = [];
    this.gameOver = false;
    this.won = false;

    this.initDOM();
    this.initEvents();
    this.start();
  }

  initDOM() {
    this.container.classList.add('puzzle-2048-wrapper');
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'puzzle-2048-container';

    this.wrapper.innerHTML = `
      <div class="puzzle-header">
        <div class="puzzle-score-boxes">
          <div class="puzzle-score-box">
            <span class="score-title">SCORE</span>
            <span class="score-val" id="score-2048">0</span>
          </div>
          <div class="puzzle-score-box">
            <span class="score-title">BEST</span>
            <span class="score-val" id="best-2048">${this.highScore}</span>
          </div>
        </div>
        <div class="puzzle-actions">
          <button class="puzzle-btn" id="btn-undo-2048">Undo</button>
          <button class="puzzle-btn" id="btn-restart-2048">Restart</button>
        </div>
      </div>

      <div class="grid-2048-board" id="board-2048"></div>
      
      <div class="puzzle-instructions">
        Join the numbers to reach the <strong>2048</strong> tile! Use <strong>Arrow Keys</strong> or <strong>Swipe</strong>.
      </div>
    `;

    this.container.appendChild(this.wrapper);
    this.boardEl = this.wrapper.querySelector('#board-2048');
    this.scoreEl = this.wrapper.querySelector('#score-2048');
    this.bestEl = this.wrapper.querySelector('#best-2048');

    this.wrapper.querySelector('#btn-undo-2048').addEventListener('click', () => this.undo());
    this.wrapper.querySelector('#btn-restart-2048').addEventListener('click', () => this.start());
  }

  initEvents() {
    this.onKeyDown = (e) => {
      if (this.gameOver) return;
      let moved = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') moved = this.move(0);
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moved = this.move(1);
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') moved = this.move(2);
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moved = this.move(3);

      if (moved) {
        e.preventDefault();
      }
    };

    // Touch swipe
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.onTouchStart = (e) => {
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    };
    this.onTouchEnd = (e) => {
      if (e.changedTouches.length > 0) {
        const dx = e.changedTouches[0].clientX - this.touchStartX;
        const dy = e.changedTouches[0].clientY - this.touchStartY;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 30) this.move(1); // right
          else if (dx < -30) this.move(3); // left
        } else {
          if (dy > 30) this.move(2); // down
          else if (dy < -30) this.move(0); // up
        }
      }
    };

    window.addEventListener('keydown', this.onKeyDown);
    this.boardEl.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.boardEl.addEventListener('touchend', this.onTouchEnd, { passive: true });
  }

  start() {
    this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.score = 0;
    this.history = [];
    this.gameOver = false;
    this.won = false;

    this.spawnTile();
    this.spawnTile();
    this.render();
  }

  spawnTile() {
    const empty = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length > 0) {
      const spot = empty[Math.floor(Math.random() * empty.length)];
      this.grid[spot.r][spot.c] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  saveState() {
    this.history.push({
      grid: this.grid.map((r) => [...r]),
      score: this.score
    });
    if (this.history.length > 10) this.history.shift();
  }

  undo() {
    if (this.history.length === 0) return;
    const prev = this.history.pop();
    this.grid = prev.grid;
    this.score = prev.score;
    this.gameOver = false;
    this.render();
  }

  // dir: 0: up, 1: right, 2: down, 3: left
  move(dir) {
    this.saveState();
    let moved = false;
    let addedScore = 0;

    const rotate = (m) => m[0].map((_, i) => m.map((row) => row[i]).reverse());

    // Rotate grid so we always process sliding left
    let temp = this.grid.map((r) => [...r]);
    for (let i = 0; i < dir; i++) temp = rotate(temp);

    // Slide and merge left
    for (let r = 0; r < this.size; r++) {
      let row = temp[r].filter((val) => val !== 0);
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
          row[i] *= 2;
          addedScore += row[i];
          row.splice(i + 1, 1);
        }
      }
      while (row.length < this.size) row.push(0);
      if (row.some((val, idx) => val !== temp[r][idx])) moved = true;
      temp[r] = row;
    }

    // Rotate back to original orientation
    for (let i = 0; i < (4 - dir) % 4; i++) temp = rotate(temp);

    if (moved) {
      this.grid = temp;
      this.score += addedScore;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('inspire_2048_high', this.score);
      }
      if (addedScore > 0 && window.sound) {
        window.sound.playBubblePop(1.2);
      } else if (window.sound) {
        window.sound.playClick();
      }

      this.spawnTile();

      if (this.checkGameOver()) {
        this.gameOver = true;
        if (window.sound) window.sound.playGameOver();
      }

      this.render();
      return true;
    } else {
      this.history.pop(); // discard saved state if nothing changed
      return false;
    }
  }

  checkGameOver() {
    // Check for empty cells
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) return false;
      }
    }
    // Check for adjacent matching numbers
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        if (r < this.size - 1 && this.grid[r + 1][c] === val) return false;
        if (c < this.size - 1 && this.grid[r][c + 1] === val) return false;
      }
    }
    return true;
  }

  render() {
    this.scoreEl.textContent = this.score;
    this.bestEl.textContent = this.highScore;

    this.boardEl.innerHTML = '';
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        const tile = document.createElement('div');
        tile.className = `tile-2048 ${val > 0 ? 'tile-' + val : 'tile-empty'}`;
        tile.textContent = val > 0 ? val : '';
        this.boardEl.appendChild(tile);
      }
    }

    if (this.gameOver) {
      const overOverlay = document.createElement('div');
      overOverlay.className = 'tile-overlay';
      overOverlay.innerHTML = `
        <h2>GAME OVER</h2>
        <p>Score: ${this.score}</p>
        <button class="puzzle-btn" onclick="document.querySelector('#btn-restart-2048').click()">Try Again</button>
      `;
      this.boardEl.appendChild(overOverlay);
    }
  }

  pause() {}
  resume() {}
  restart() {
    this.start();
  }
  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    this.container.innerHTML = '';
  }
}

window.Game2048 = Game2048;
