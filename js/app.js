/**
 * Inspire Games - Portal Application Controller
 * Manages game registry, filtering, search, theater mode, and interactions
 */

const GAMES_CATALOG = [
  {
    id: 'bottle-shooter',
    title: 'Bottle Shooter 3D Gallery',
    genre: 'Shooting',
    category: 'shooting',
    badge: 'Popular',
    badgeClass: 'badge-popular',
    icon: '🎯',
    rating: '4.9 ★',
    plays: '142K plays',
    desc: 'Sharpen your precision aim! Shoot dynamic glass bottles, trigger explosive TNT combos, and rack up high score multipliers.',
    storageKey: 'inspire_bottle_high',
    instructions: {
      goal: 'Hit as many bottles as possible in 60 seconds without wasting ammo.',
      controls: [
        'Aim: Move Mouse or Touch Screen',
        'Shoot: Click Left Mouse Button or Tap',
        'Reload: Press [R] or wait when magazine empties',
        'Combos: Hit consecutive bottles without missing for up to 5x points',
        'Explosive Bottles: Hit red TNT to shatter surrounding bottles in a fireball!'
      ]
    },
    create: (container) => new BottleShooterGame(container)
  },
  {
    id: 'bubble-shooter',
    title: 'Bubble Shooter Classic',
    genre: 'Puzzle',
    category: 'puzzle',
    badge: 'Addictive',
    badgeClass: 'badge-new',
    icon: '🔮',
    rating: '4.8 ★',
    plays: '210K plays',
    desc: 'Match 3 or more colored gem bubbles to pop them. Clear clusters and trigger massive cascade drops before the ceiling crashes down.',
    storageKey: 'inspire_bubble_high',
    instructions: {
      goal: 'Pop all bubbles or clear clusters to achieve the highest score before the bubbles cross the bottom danger line.',
      controls: [
        'Aim: Move Mouse or Touch Screen to align trajectory laser',
        'Shoot: Click or Tap to fire current bubble',
        'Swap: Press [Space] or [C] or click the ⇄ icon to swap with next bubble',
        'Bank Shots: Bounce bubbles off side walls to reach tricky clusters!',
        'Cascades: Cut off root bubbles to drop all floating disconnected bubbles for huge bonus points.'
      ]
    },
    create: (container) => new BubbleShooterGame(container)
  },
  {
    id: 'granny',
    title: 'Granny: Haunted Escape',
    genre: 'Horror',
    category: 'horror',
    badge: 'Thriller',
    badgeClass: 'badge-hot',
    icon: '🏚️',
    rating: '4.9 ★',
    plays: '320K plays',
    desc: 'You are locked in a creepy haunted house. Creep quietly, hide inside closets and under beds, find 4 escape tools, and flee before Day 5!',
    storageKey: 'inspire_granny_days',
    instructions: {
      goal: 'Find all 4 escape tools (Hammer, Wire Cutters, Padlock Key, Master Key) to unlock the front exit door before Granny catches you 5 times.',
      controls: [
        'Move: [W][A][S][D] or Arrow Keys',
        'Look / Aim: Move Mouse',
        'Interact / Hide: Press [E] or [Space] near beds, closets, doors, or items',
        'Crouch / Sneak: Press [C] to walk quietly and avoid squeaking floorboards',
        'Flashlight: Press [F] to toggle flashlight (Careful: Granny sees light!)',
        'Drop Item: Press [G] to drop currently held tool',
        'Audio Clues: Watch for red sound waves and listen to your heartbeat when Granny nears.'
      ]
    },
    create: (container) => new GrannyGame(container)
  },
  {
    id: 'chess',
    title: 'Grandmaster Chess',
    genre: 'Strategy',
    category: 'strategy',
    badge: 'Mind Game',
    badgeClass: 'badge-pro',
    icon: '♟️',
    rating: '4.9 ★',
    plays: '95K plays',
    desc: 'Classic game of kings! Play against an intelligent Minimax AI with 3 difficulty tiers or challenge a friend in 2-Player Pass & Play.',
    storageKey: 'inspire_chess_wins',
    instructions: {
      goal: 'Outmaneuver opponent pieces and deliver Checkmate to the opposing King.',
      controls: [
        'Select Piece: Click on any of your white pieces to see valid moves',
        'Move Piece: Click on green dot or target square to execute move',
        'Castling: Move King 2 squares toward Rook when squares are clear and unchecked',
        'En Passant: Capture advancing opponent pawns diagonally on adjacent ranks',
        'Undo Move: Click Undo button to take back recent moves',
        'Difficulty: Toggle Casual, Intermediate, or Grandmaster AI depth.'
      ]
    },
    create: (container) => new ChessGame(container)
  },
  {
    id: 'temple-run',
    title: 'Temple Run: Relic Escape',
    genre: 'Action',
    category: 'action',
    badge: 'High Speed',
    badgeClass: 'badge-hot',
    icon: '🏃',
    rating: '4.9 ★',
    plays: '450K plays',
    desc: 'Dash along ancient golden temple causeways high above the jungle abyss! Jump spikes, slide under fire traps, and escape the Demon Beast.',
    storageKey: 'inspire_temple_high',
    instructions: {
      goal: 'Sprint as far as possible, collect ancient coins, and avoid obstacles while escaping the Demon Beast.',
      controls: [
        'Switch Lanes: [A]/[D] or Left/Right Arrow or Swipe Left/Right',
        'Jump: [W] or Up Arrow or [Space] or Swipe Up (Leap over spiked logs & broken stones)',
        'Slide: [S] or Down Arrow or Swipe Down (Slide under flaming arches & low beams)',
        'Beast Alert: If you stumble on obstacles, the Demon Beast will close in on your heels. Stumble twice and you get caught!'
      ]
    },
    create: (container) => new TempleRunGame(container)
  },
  {
    id: 'space-invaders',
    title: 'Space Invaders: Galaxy Strike',
    genre: 'Arcade',
    category: 'arcade',
    badge: 'Retro',
    badgeClass: 'badge-popular',
    icon: '👾',
    rating: '4.7 ★',
    plays: '88K plays',
    desc: 'Defend planet Earth against descending waves of neon alien invaders! Use defensive shields, shoot laser cannons, and snipe the mystery UFO.',
    storageKey: 'inspire_space_high',
    instructions: {
      goal: 'Destroy all descending alien invaders and mothership UFOs before they reach your defensive base.',
      controls: [
        'Move: [A]/[D] or Left/Right Arrow or Touch Screen Drag',
        'Shoot Lasers: [Space] or Up Arrow or Tap Screen',
        'Shields: Take cover behind green bunkers (they deteriorate as they take damage)',
        'Mystery UFO: Look out for the red mothership at the top of the screen for +200 bonus points!'
      ]
    },
    create: (container) => new SpaceInvadersGame(container)
  },
  {
    id: '2048',
    title: 'Cyber 2048: Neon Pulse',
    genre: 'Puzzle',
    category: 'puzzle',
    badge: 'Casual',
    badgeClass: 'badge-new',
    icon: '🔢',
    rating: '4.8 ★',
    plays: '115K plays',
    desc: 'Slide and merge matching cyber number tiles to create the elusive 2048 tile in this mesmerizing neon brain teaser.',
    storageKey: 'inspire_2048_high',
    instructions: {
      goal: 'Join identical numbers to double their value and create the legendary 2048 tile.',
      controls: [
        'Slide Tiles: Arrow Keys, [W][A][S][D], or Swipe (Up, Down, Left, Right)',
        'Merge: When two tiles with the same number touch, they merge into one!',
        'Undo: Use the Undo button if you make a misstep'
      ]
    },
    create: (container) => new Game2048(container)
  }
];

class InspireGamesApp {
  constructor() {
    this.games = GAMES_CATALOG;
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.favorites = JSON.parse(localStorage.getItem('inspire_favorites') || '[]');
    this.activeGameInstance = null;
    this.activeGameMeta = null;
    this.isPaused = false;

    this.initDOM();
    this.initEvents();
    this.renderCards();
    this.updateStats();
  }

  initDOM() {
    this.gamesGrid = document.getElementById('games-grid');
    this.searchInput = document.getElementById('search-input');
    this.chipButtons = document.querySelectorAll('.chip-btn');
    this.heroPlayBtn = document.getElementById('hero-play-btn');

    // Arena Modal elements
    this.theaterModal = document.getElementById('game-modal');
    this.theaterTitle = document.getElementById('theater-title');
    this.theaterGenre = document.getElementById('theater-genre');
    this.gameCanvasContainer = document.getElementById('game-canvas-container');

    this.btnPause = document.getElementById('btn-pause-game');
    this.btnRestart = document.getElementById('btn-restart-game');
    this.btnHelp = document.getElementById('btn-help-game');
    this.btnMute = document.getElementById('btn-mute-sound');
    this.btnFullscreen = document.getElementById('btn-fullscreen-game');
    this.btnClose = document.getElementById('btn-close-theater');

    // Global sound toggle
    this.globalAudioBtn = document.getElementById('btn-global-audio');

    // Help Modal
    this.helpModal = document.getElementById('help-modal');
    this.helpTitle = document.getElementById('help-title');
    this.helpGoal = document.getElementById('help-goal');
    this.helpControlsList = document.getElementById('help-controls-list');
    this.btnCloseHelp = document.getElementById('btn-close-help');

    // Host Contact Modal (Anisha)
    this.btnHostContact = document.getElementById('btn-host-contact');
    this.hostModal = document.getElementById('host-modal');
    this.btnCloseHostModal = document.getElementById('btn-close-host-modal');
    this.hostContactForm = document.getElementById('host-contact-form');
    this.contactSuccessMsg = document.getElementById('contact-success-msg');

    // Virtual Touch Controls
    this.touchBar = document.getElementById('touch-controls-bar');
    this.initTouchControls();
  }

  initEvents() {
    // Search
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderCards();
    });

    // Category chips
    this.chipButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.chipButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.dataset.category;
        this.renderCards();
        if (window.sound) window.sound.playClick();
      });
    });

    // Hero Play button
    if (this.heroPlayBtn) {
      this.heroPlayBtn.addEventListener('click', () => {
        // Launch featured game (Temple Run or Bottle Shooter)
        this.launchGame('temple-run');
      });
    }

    // Theater Toolbar actions
    this.btnPause.addEventListener('click', () => this.togglePause());
    this.btnRestart.addEventListener('click', () => {
      if (this.activeGameInstance && this.activeGameInstance.restart) {
        this.activeGameInstance.restart();
        if (window.sound) window.sound.playClick();
      }
    });

    this.btnHelp.addEventListener('click', () => this.showHelpModal());
    this.btnCloseHelp.addEventListener('click', () => this.hideHelpModal());
    this.helpModal.addEventListener('click', (e) => {
      if (e.target === this.helpModal) this.hideHelpModal();
    });

    // Host Contact Modal Event Listeners
    if (this.btnHostContact) {
      this.btnHostContact.addEventListener('click', () => {
        this.showHostModal();
        if (window.sound) window.sound.playClick();
      });
    }

    if (this.btnCloseHostModal) {
      this.btnCloseHostModal.addEventListener('click', () => this.hideHostModal());
    }

    if (this.hostModal) {
      this.hostModal.addEventListener('click', (e) => {
        if (e.target === this.hostModal) this.hideHostModal();
      });
    }

    // Footer Private Contact Link
    const footerContactLink = document.getElementById('footer-contact-link');
    if (footerContactLink) {
      footerContactLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showHostModal();
        if (window.sound) window.sound.playClick();
      });
    }

    if (this.hostContactForm) {
      this.hostContactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('contact-name').value.trim();
        const playerEmail = document.getElementById('contact-player-email') ? document.getElementById('contact-player-email').value.trim() : '';
        const issue = document.getElementById('contact-issue').value.trim();

        // Save privately in Host Inbox (stored securely on browser)
        const existingMessages = JSON.parse(localStorage.getItem('inspire_host_inbox') || '[]');
        const newMessage = {
          id: Date.now(),
          name,
          playerContact: playerEmail || 'Not provided',
          message: issue,
          date: new Date().toLocaleString()
        };
        existingMessages.push(newMessage);
        localStorage.setItem('inspire_host_inbox', JSON.stringify(existingMessages));
        this.renderHostInbox();

        // Display Success Confirmation
        if (this.contactSuccessMsg) {
          this.contactSuccessMsg.style.display = 'block';
          this.hostContactForm.style.display = 'none';
        }
        if (window.sound) window.sound.playVictory();

        setTimeout(() => {
          this.hideHostModal();
          // Reset form for future submissions
          setTimeout(() => {
            if (this.contactSuccessMsg) this.contactSuccessMsg.style.display = 'none';
            if (this.hostContactForm) {
              this.hostContactForm.reset();
              this.hostContactForm.style.display = 'block';
            }
          }, 400);
        }, 3000);
      });
    }

    this.btnMute.addEventListener('click', () => this.toggleSound());
    if (this.globalAudioBtn) {
      this.globalAudioBtn.addEventListener('click', () => this.toggleSound());
    }

    this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    this.btnClose.addEventListener('click', () => this.closeTheater());

    // ESC key closes modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.hostModal && this.hostModal.classList.contains('active')) {
          this.hideHostModal();
        } else if (this.helpModal.classList.contains('active')) {
          this.hideHelpModal();
        } else if (this.theaterModal.classList.contains('active')) {
          this.closeTheater();
        }
      }
    });
  }

  showHostModal() {
    if (this.hostModal) {
      this.hostModal.classList.add('active');
      this.renderHostInbox();
    }
  }

  hideHostModal() {
    if (this.hostModal) this.hostModal.classList.remove('active');
  }

  renderHostInbox() {
    const tabBtnSend = document.getElementById('tab-btn-send');
    const tabBtnInbox = document.getElementById('tab-btn-inbox');
    const viewSend = document.getElementById('host-view-send');
    const viewPin = document.getElementById('host-view-pin');
    const viewInbox = document.getElementById('host-view-inbox');
    const pinInput = document.getElementById('host-pin-input');
    const btnUnlock = document.getElementById('btn-unlock-pin');
    const pinError = document.getElementById('pin-error-msg');
    const btnLock = document.getElementById('btn-lock-inbox');
    const inboxList = document.getElementById('host-inbox-list');
    const inboxCount = document.getElementById('inbox-count');
    const btnClear = document.getElementById('btn-clear-inbox');

    const HOST_AUTH_TOKEN = 'MTIwOQ=='; // Base64 token for host PIN verification

    const showView = (viewName) => {
      if (viewSend) viewSend.style.display = viewName === 'send' ? 'block' : 'none';
      if (viewPin) viewPin.style.display = viewName === 'pin' ? 'block' : 'none';
      if (viewInbox) viewInbox.style.display = viewName === 'inbox' ? 'block' : 'none';

      if (viewName === 'send') {
        if (tabBtnSend) {
          tabBtnSend.classList.add('active');
          tabBtnSend.style.background = 'rgba(56, 189, 248, 0.15)';
          tabBtnSend.style.borderColor = '#38bdf8';
          tabBtnSend.style.color = '#fff';
        }
        if (tabBtnInbox) {
          tabBtnInbox.classList.remove('active');
          tabBtnInbox.style.background = 'rgba(255, 255, 255, 0.05)';
          tabBtnInbox.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          tabBtnInbox.style.color = '#94a3b8';
        }
      } else {
        if (tabBtnInbox) {
          tabBtnInbox.classList.add('active');
          tabBtnInbox.style.background = 'rgba(236, 72, 153, 0.2)';
          tabBtnInbox.style.borderColor = '#ec4899';
          tabBtnInbox.style.color = '#fff';
        }
        if (tabBtnSend) {
          tabBtnSend.classList.remove('active');
          tabBtnSend.style.background = 'rgba(255, 255, 255, 0.05)';
          tabBtnSend.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          tabBtnSend.style.color = '#94a3b8';
        }
      }
    };

    // Tab button: Send
    if (tabBtnSend && !tabBtnSend.dataset.bound) {
      tabBtnSend.dataset.bound = 'true';
      tabBtnSend.addEventListener('click', () => {
        showView('send');
        if (window.sound) window.sound.playClick();
      });
    }

    // Tab button: Inbox (checks if unlocked)
    if (tabBtnInbox && !tabBtnInbox.dataset.bound) {
      tabBtnInbox.dataset.bound = 'true';
      tabBtnInbox.addEventListener('click', () => {
        if (this.isHostUnlocked) {
          showView('inbox');
        } else {
          showView('pin');
          if (pinInput) {
            pinInput.value = '';
            pinInput.focus();
          }
          if (pinError) pinError.style.display = 'none';
        }
        if (window.sound) window.sound.playClick();
      });
    }

    // Quick Inbox Open button on send form
    const btnQuickInbox = document.getElementById('btn-quick-inbox');
    if (btnQuickInbox && !btnQuickInbox.dataset.bound) {
      btnQuickInbox.dataset.bound = 'true';
      btnQuickInbox.addEventListener('click', () => {
        if (tabBtnInbox) tabBtnInbox.click();
      });
    }

    // Back to Send Form button on inbox view
    const btnBackToSend = document.getElementById('btn-back-to-send');
    if (btnBackToSend && !btnBackToSend.dataset.bound) {
      btnBackToSend.dataset.bound = 'true';
      btnBackToSend.addEventListener('click', () => {
        showView('send');
        if (window.sound) window.sound.playClick();
      });
    }

    // Unlock PIN button
    const attemptUnlock = () => {
      const entered = pinInput ? pinInput.value.trim() : '';
      if (btoa(entered) === HOST_AUTH_TOKEN) {
        this.isHostUnlocked = true;
        showView('inbox');
        if (pinError) pinError.style.display = 'none';
        if (window.sound) window.sound.playVictory();
        this.renderHostInbox();
      } else {
        if (pinError) pinError.style.display = 'block';
        if (pinInput) {
          pinInput.value = '';
          pinInput.focus();
        }
        if (window.sound) window.sound.playCrash();
      }
    };

    if (btnUnlock && !btnUnlock.dataset.bound) {
      btnUnlock.dataset.bound = 'true';
      btnUnlock.addEventListener('click', attemptUnlock);
    }

    if (pinInput && !pinInput.dataset.bound) {
      pinInput.dataset.bound = 'true';
      pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') attemptUnlock();
      });
    }

    // Lock button
    if (btnLock && !btnLock.dataset.bound) {
      btnLock.dataset.bound = 'true';
      btnLock.addEventListener('click', () => {
        this.isHostUnlocked = false;
        showView('send');
        if (window.sound) window.sound.playClick();
      });
    }

    if (btnClear && !btnClear.dataset.bound) {
      btnClear.dataset.bound = 'true';
      btnClear.addEventListener('click', () => {
        localStorage.removeItem('inspire_host_inbox');
        this.renderHostInbox();
        if (window.sound) window.sound.playClick();
      });
    }

    const messages = JSON.parse(localStorage.getItem('inspire_host_inbox') || '[]');
    if (inboxCount) inboxCount.textContent = messages.length;
    const inboxCountBottom = document.getElementById('inbox-count-bottom');
    if (inboxCountBottom) inboxCountBottom.textContent = messages.length;

    if (!inboxList) return;
    inboxList.innerHTML = '';
    if (messages.length === 0) {
      inboxList.innerHTML = `
        <div style="font-size: 13px; color: #64748b; text-align: center; padding: 24px 10px; background: rgba(255,255,255,0.02); border-radius: 8px;">
          <div style="font-size: 28px; margin-bottom: 6px;">📭</div>
          No messages received yet.<br>
          <span style="font-size: 11px; color: #475569;">When players message you through the form, their messages will appear right here!</span>
        </div>
      `;
    } else {
      messages.slice().reverse().forEach((msg) => {
        const item = document.createElement('div');
        item.style.cssText = 'background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 8px; padding: 12px 14px;';
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #38bdf8; font-size: 13px;">👤 ${msg.name}</strong>
            <span style="color: #64748b; font-size: 11px;">🕒 ${msg.date}</span>
          </div>
          <div style="color: #94a3b8; font-size: 12px; margin-bottom: 6px;">Contact / Reply: <strong style="color: #cbd5e1;">${msg.playerContact}</strong></div>
          <div style="color: #f8fafc; font-size: 13px; line-height: 1.5; background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 6px;">${msg.message}</div>
        `;
        inboxList.appendChild(item);
      });
    }
  }

  initTouchControls() {
    const bindTouchKey = (elementId, key) => {
      const el = document.getElementById(elementId);
      if (!el) return;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        window.dispatchEvent(new KeyboardEvent('keydown', { key }));
      });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        window.dispatchEvent(new KeyboardEvent('keyup', { key }));
      });
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        window.dispatchEvent(new KeyboardEvent('keydown', { key }));
      });
      el.addEventListener('mouseup', (e) => {
        e.preventDefault();
        window.dispatchEvent(new KeyboardEvent('keyup', { key }));
      });
    };

    bindTouchKey('touch-up', 'ArrowUp');
    bindTouchKey('touch-down', 'ArrowDown');
    bindTouchKey('touch-left', 'ArrowLeft');
    bindTouchKey('touch-right', 'ArrowRight');
    bindTouchKey('touch-act-a', ' '); // Space / Jump / Shoot
    bindTouchKey('touch-act-b', 'e'); // Interact
  }

  renderCards() {
    this.gamesGrid.innerHTML = '';

    const filtered = this.games.filter((game) => {
      const matchesCategory =
        this.currentCategory === 'all' ||
        (this.currentCategory === 'favorites' && this.favorites.includes(game.id)) ||
        game.category === this.currentCategory;

      const matchesSearch =
        !this.searchQuery ||
        game.title.toLowerCase().includes(this.searchQuery) ||
        game.genre.toLowerCase().includes(this.searchQuery) ||
        game.desc.toLowerCase().includes(this.searchQuery);

      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      this.gamesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <div style="font-size: 48px; margin-bottom: 12px;">🔍</div>
          <h3 style="font-family: var(--font-heading); color: #fff; margin-bottom: 8px;">No Games Found</h3>
          <p>Try searching for another keyword or change your category filter.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((game) => {
      const isFav = this.favorites.includes(game.id);
      const highScore = localStorage.getItem(game.storageKey) || '0';

      const card = document.createElement('div');
      card.className = 'game-card';

      card.innerHTML = `
        <div class="card-thumbnail">
          <span class="card-badge ${game.badgeClass}">${game.badge}</span>
          <button class="card-fav-btn ${isFav ? 'favorited' : ''}" title="Favorite game" data-id="${game.id}">
            ${isFav ? '❤️' : '🤍'}
          </button>
          <span class="card-thumbnail-icon">${game.icon}</span>
        </div>
        <div class="card-content">
          <div class="card-meta">
            <span class="card-genre">${game.genre}</span>
            <span class="card-rating">★ ${game.rating.replace(' ★', '')}</span>
          </div>
          <h3 class="card-title">${game.title}</h3>
          <p class="card-desc">${game.desc}</p>
          <div class="card-footer">
            <div class="card-high-score">High: <strong>${highScore}</strong></div>
            <button class="card-play-btn" data-id="${game.id}">PLAY NOW</button>
          </div>
        </div>
      `;

      // Favorite toggle handler
      const favBtn = card.querySelector('.card-fav-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFavorite(game.id);
      });

      // Launch game on card click
      card.addEventListener('click', () => {
        this.launchGame(game.id);
      });

      this.gamesGrid.appendChild(card);
    });
  }

  toggleFavorite(gameId) {
    if (this.favorites.includes(gameId)) {
      this.favorites = this.favorites.filter((id) => id !== gameId);
    } else {
      this.favorites.push(gameId);
    }
    localStorage.setItem('inspire_favorites', JSON.stringify(this.favorites));
    if (window.sound) window.sound.playClick();
    this.renderCards();
  }

  launchGame(gameId) {
    const game = this.games.find((g) => g.id === gameId);
    if (!game) return;

    if (window.sound) {
      window.sound.init();
      window.sound.playClick();
    }

    // Clean up previous game
    if (this.activeGameInstance && this.activeGameInstance.destroy) {
      this.activeGameInstance.destroy();
    }

    this.activeGameMeta = game;
    this.isPaused = false;
    this.btnPause.innerHTML = '⏸ Pause';

    // Set Header info
    this.theaterTitle.textContent = game.title;
    this.theaterGenre.textContent = game.genre;

    // Show Theater Modal
    this.theaterModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Show Touch bar if touch device or screen small
    if (window.innerWidth <= 768 || 'ontouchstart' in window) {
      this.touchBar.style.display = 'flex';
    } else {
      this.touchBar.style.display = 'none';
    }

    // Instantiate game
    setTimeout(() => {
      this.activeGameInstance = game.create(this.gameCanvasContainer);
    }, 50);
  }

  togglePause() {
    if (!this.activeGameInstance) return;
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      if (this.activeGameInstance.pause) this.activeGameInstance.pause();
      this.btnPause.innerHTML = '▶ Resume';
    } else {
      if (this.activeGameInstance.resume) this.activeGameInstance.resume();
      this.btnPause.innerHTML = '⏸ Pause';
    }

    if (window.sound) window.sound.playClick();
  }

  toggleSound() {
    if (!window.sound) return;
    const isMuted = window.sound.toggleMute();
    const icon = isMuted ? '🔇' : '🔊';

    this.btnMute.innerHTML = `${icon} Audio`;
    if (this.globalAudioBtn) {
      this.globalAudioBtn.innerHTML = icon;
    }
  }

  toggleFullscreen() {
    const theater = document.querySelector('.game-theater');
    if (!document.fullscreenElement) {
      if (theater.requestFullscreen) theater.requestFullscreen();
      else if (theater.webkitRequestFullscreen) theater.webkitRequestFullscreen();
      theater.classList.add('fullscreen');
      this.btnFullscreen.innerHTML = '⤓ Window';
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      theater.classList.remove('fullscreen');
      this.btnFullscreen.innerHTML = '⛶ Fullscreen';
    }
  }

  closeTheater() {
    if (this.activeGameInstance && this.activeGameInstance.destroy) {
      this.activeGameInstance.destroy();
      this.activeGameInstance = null;
    }

    this.theaterModal.classList.remove('active');
    document.body.style.overflow = 'auto';

    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    // Refresh card high scores
    this.renderCards();
  }

  showHelpModal() {
    if (!this.activeGameMeta) return;
    const info = this.activeGameMeta.instructions;

    this.helpTitle.textContent = `${this.activeGameMeta.title} - How to Play`;
    this.helpGoal.textContent = info.goal;

    this.helpControlsList.innerHTML = '';
    info.controls.forEach((ctrl) => {
      const li = document.createElement('li');
      li.textContent = ctrl;
      this.helpControlsList.appendChild(li);
    });

    this.helpModal.classList.add('active');
  }

  hideHelpModal() {
    this.helpModal.classList.remove('active');
  }

  updateStats() {
    // Total games count in hero
    const countEl = document.getElementById('stat-total-games');
    if (countEl) countEl.textContent = this.games.length;
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new InspireGamesApp();
});
