document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // UI Elements
    const scoreEl = document.getElementById('currentScore');
    const highScoreEl = document.getElementById('highScore');
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const finalScoreEl = document.getElementById('finalScore');
    const restartBtn = document.getElementById('restartBtn');
    const difficultySelect = document.getElementById('difficulty');

    // Game State
    let gameRunning = false;
    let animationId;
    let score = 0;
    let gameSpeed = 0;
    let frameCount = 0;
    let currentDifficulty = 'easy';

    // Physics & Config
    const GRAVITY = 0.6;
    const GAME_WIDTH = 800;
    const GAME_HEIGHT = 300;

    const CONFIG = {
        easy: {
            speed: 6,
            acceleration: 0.001,
            spawnRate: 100 // Frames between potential spawns (base)
        },
        hard: {
            speed: 9,
            acceleration: 0.002,
            spawnRate: 70
        }
    };

    // Key storage
    const keys = {};

    // --- Classes ---

    class Dino {
        constructor() {
            this.w = 50;
            this.h = 50;
            this.x = 50;
            this.y = GAME_HEIGHT - this.h;
            this.dy = 0; // Vertical Velocity
            this.jumpForce = 12;
            this.originalHeight = 50;
            this.grounded = true;
            this.color = '#555'; // Dark Grey
        }

        jump() {
            if (this.grounded) {
                this.dy = -this.jumpForce;
                this.grounded = false;
            }
        }

        update() {
            // Apply Velocity first
            this.y += this.dy;

            // Apply Gravity / Ground Collision
            if (this.y < GAME_HEIGHT - this.h) {
                this.dy += GRAVITY;
                this.grounded = false;
            } else {
                this.dy = 0;
                this.grounded = true;
                this.y = GAME_HEIGHT - this.h;
            }

            this.draw();
        }

        draw() {
            ctx.fillStyle = this.color;
            // Simple geometric dino
            ctx.fillRect(this.x, this.y, this.w, this.h);
            
            // Add an eye to make it look like a creature
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 35, this.y + 10, 5, 5);
        }
    }

    class Obstacle {
        constructor(x, w, h, speed) {
            this.x = x;
            this.w = w;
            this.h = h;
            this.color = '#e74c3c'; // Red-ish Cactus
            this.markedForDeletion = false;
        }

        update() {
            this.x -= gameSpeed;
            if (this.x + this.w < 0) {
                this.markedForDeletion = true;
            }
            this.draw();
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        
        // Y position is calculated based on height (always on ground)
        get y() {
            return GAME_HEIGHT - this.h;
        }
    }

    // --- Game Variables ---
    let dino;
    let obstacles = [];
    let spawnTimer = 0;

    // --- Functions ---

    function init() {
        // Load high score for current difficulty
        loadHighScore();
        
        startScreen.style.display = 'flex';
        gameOverScreen.style.display = 'none';
        
        // Draw initial state
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Ground line
        ctx.beginPath();
        ctx.moveTo(0, GAME_HEIGHT);
        ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
        ctx.stroke();
    }

    function startGame() {
        if (gameRunning) return;
        
        // Reset variables
        gameRunning = true;
        score = 0;
        obstacles = [];
        spawnTimer = 0;
        
        const settings = CONFIG[currentDifficulty];
        gameSpeed = settings.speed;
        
        dino = new Dino();
        
        startScreen.style.display = 'none';
        gameOverScreen.style.display = 'none';
        
        animate();
    }

    function spawnObstacle() {
        const settings = CONFIG[currentDifficulty];
        
        // Decrease spawn interval as speed increases
        spawnTimer--;
        
        if (spawnTimer <= 0) {
            // Randomize size
            const width = 30 + Math.random() * 20;
            const height = 40 + Math.random() * 30; // Random height
            
            obstacles.push(new Obstacle(GAME_WIDTH, width, height, gameSpeed));
            
            // Reset timer with randomness
            // Harder difficulty has lower minimum gap
            const minGap = currentDifficulty === 'hard' ? 40 : 60;
            spawnTimer = minGap + Math.random() * settings.spawnRate; 
        }
    }

    function animate() {
        if (!gameRunning) return;
        
        animationId = requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 1. Update Game Speed (Acceleration)
        gameSpeed += CONFIG[currentDifficulty].acceleration;
        
        // 2. Spawn & Update Obstacles
        spawnObstacle();
        
        obstacles.forEach(obstacle => {
            obstacle.update();
        });
        
        // Remove off-screen obstacles
        obstacles = obstacles.filter(o => !o.markedForDeletion);
        
        // 3. Update Dino
        dino.update();
        
        // 4. Update Score
        score++;
        scoreEl.innerText = Math.floor(score / 10);
        
        // 5. Collision Detection
        checkCollisions();
        
        // Draw Ground
        ctx.strokeStyle = '#ccc';
        ctx.beginPath();
        ctx.moveTo(0, GAME_HEIGHT);
        ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
        ctx.stroke();
    }

    function checkCollisions() {
        for (let i = 0; i < obstacles.length; i++) {
            let obs = obstacles[i];
            
            // AABB Collision
            if (
                dino.x < obs.x + obs.w &&
                dino.x + dino.w > obs.x &&
                dino.y < obs.y + obs.h &&
                dino.y + dino.h > obs.y
            ) {
                gameOver();
                break; // Stop checking
            }
        }
    }

    function gameOver() {
        gameRunning = false;
        cancelAnimationFrame(animationId);
        
        const finalScore = Math.floor(score / 10);
        finalScoreEl.innerText = finalScore;
        
        saveHighScore(finalScore);
        
        gameOverScreen.style.display = 'flex';
    }

    // --- Storage ---
    function getStorageKey() {
        return `trex_highscore_${currentDifficulty}`;
    }

    function loadHighScore() {
        const key = getStorageKey();
        const stored = localStorage.getItem(key);
        highScoreEl.innerText = stored ? stored : 0;
    }

    function saveHighScore(currentScore) {
        const key = getStorageKey();
        const stored = localStorage.getItem(key);
        const high = stored ? parseInt(stored) : 0;
        
        if (currentScore > high) {
            localStorage.setItem(key, currentScore);
            highScoreEl.innerText = currentScore;
        }
    }

    // --- Event Listeners ---

    // Keyboard
    window.addEventListener('keydown', function(e) {
        keys[e.code] = true;
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            // If focusing on a button or select, let the browser handle it (e.g. restart game with enter/space)
            // BUT, if game is running, we usually want to jump.
            // Let's only prevent default if we are actually going to jump or start game.
            
            if (!gameRunning) {
                e.preventDefault();
                startGame();
            } else if (gameRunning && dino) {
                e.preventDefault();
                dino.jump();
            }
        }
    });

    window.addEventListener('keyup', function(e) {
        keys[e.code] = false;
    });

    // Touch / Click for mobile support
    const gameContainer = document.querySelector('.game-container');
    gameContainer.addEventListener('touchstart', handleTap);
    gameContainer.addEventListener('mousedown', handleTap);

    function handleTap(e) {
        // Avoid double firing (mousedown + touchstart)
        if (e.type === 'touchstart') e.preventDefault(); 
        
        // Don't prevent default on buttons or selects
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') return;
        
        // If clicking on overlay text/h2, etc.
        e.preventDefault();

        if (!gameRunning) {
            startGame();
        } else if (gameRunning && dino) {
            dino.jump();
        }
    }

    // Controls
    difficultySelect.addEventListener('change', (e) => {
        currentDifficulty = e.target.value;
        loadHighScore();
        // Blur to prevent spacebar from reopening the dropdown instead of jumping
        e.target.blur(); 
        
        if (!gameRunning) {
            // Just reset score display if game not running
            scoreEl.innerText = '0';
        } else {
            // If they change difficulty mid-game (cheeky!), restart
            gameOver();
        }
    });

    restartBtn.addEventListener('click', startGame);

    // Start
    init();
});