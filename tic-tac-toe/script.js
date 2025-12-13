document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const cells = document.querySelectorAll('.cell');
    const statusText = document.getElementById('status');
    const restartBtn = document.getElementById('restartBtn');
    const resetScoreBtn = document.getElementById('resetScoreBtn');
    
    // Settings
    const gameModeSelect = document.getElementById('gameMode');
    const difficultyGroup = document.getElementById('difficultyGroup');
    const difficultySelect = document.getElementById('difficulty');
    
    // Score elements
    const p1NameDisplay = document.getElementById('p1Name');
    const p2NameDisplay = document.getElementById('p2Name');
    const scoreXDisplay = document.getElementById('scoreX');
    const scoreODisplay = document.getElementById('scoreO');
    const scoreDrawDisplay = document.getElementById('scoreDraw');

    let currentPlayer = 'X';
    let gameState = ["", "", "", "", "", "", "", "", ""];
    let gameActive = true;
    
    // Game State
    let isVsComputer = false;
    let computerDifficulty = 'easy'; // 'easy' or 'hard'
    let scores = { X: 0, O: 0, draw: 0 };

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    const messages = {
        turn: (player) => `輪到玩家: ${player}`,
        win: (player) => `玩家 ${player} 獲勝！`,
        draw: `平手！`,
        computerTurn: `電腦思考中...`
    };

    // Initialize
    function init() {
        handleGameModeChange();
        updateScoreBoard();
    }

    function handleCellClick(clickedCellEvent) {
        const clickedCell = clickedCellEvent.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

        if (gameState[clickedCellIndex] !== "" || !gameActive) {
            return;
        }

        // If playing vs Computer and it's Computer's turn (O), ignore clicks
        if (isVsComputer && currentPlayer === 'O') {
            return;
        }

        handleCellPlayed(clickedCell, clickedCellIndex);
        handleResultValidation();
    }

    function handleCellPlayed(clickedCell, clickedCellIndex) {
        gameState[clickedCellIndex] = currentPlayer;
        clickedCell.innerText = currentPlayer;
        clickedCell.classList.add(currentPlayer.toLowerCase());
    }

    function handleResultValidation() {
        let roundWon = false;
        let winPattern = [];

        for (let i = 0; i <= 7; i++) {
            const winCondition = winningConditions[i];
            let a = gameState[winCondition[0]];
            let b = gameState[winCondition[1]];
            let c = gameState[winCondition[2]];

            if (a === '' || b === '' || c === '') {
                continue;
            }
            if (a === b && b === c) {
                roundWon = true;
                winPattern = winCondition;
                break;
            }
        }

        if (roundWon) {
            statusText.innerText = messages.win(currentPlayer);
            gameActive = false;
            highlightWinningCells(winPattern);
            updateScore(currentPlayer);
            return;
        }

        let roundDraw = !gameState.includes("");
        if (roundDraw) {
            statusText.innerText = messages.draw;
            gameActive = false;
            updateScore('draw');
            return;
        }

        handlePlayerChange();
    }

    function highlightWinningCells(pattern) {
        pattern.forEach(index => {
            cells[index].classList.add('win');
        });
    }

    function handlePlayerChange() {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        
        if (isVsComputer && currentPlayer === 'O') {
            statusText.innerText = messages.computerTurn;
            // Delay computer move slightly for better UX
            setTimeout(makeComputerMove, 500);
        } else {
            statusText.innerText = messages.turn(currentPlayer);
        }
    }

    function updateScore(winner) {
        if (winner === 'draw') {
            scores.draw++;
        } else {
            scores[winner]++;
        }
        updateScoreBoard();
    }

    function updateScoreBoard() {
        scoreXDisplay.innerText = scores.X;
        scoreODisplay.innerText = scores.O;
        scoreDrawDisplay.innerText = scores.draw;
    }

    function resetScores() {
        scores = { X: 0, O: 0, draw: 0 };
        updateScoreBoard();
    }

    function handleRestartGame() {
        gameActive = true;
        currentPlayer = "X";
        gameState = ["", "", "", "", "", "", "", "", ""];
        statusText.innerText = messages.turn(currentPlayer);
        cells.forEach(cell => {
            cell.innerText = "";
            cell.classList.remove('x', 'o', 'win');
        });
    }

    function handleGameModeChange() {
        const mode = gameModeSelect.value;
        isVsComputer = (mode === 'pvc');
        
        if (isVsComputer) {
            difficultyGroup.style.display = 'flex';
            p2NameDisplay.innerText = "電腦 (O)";
        } else {
            difficultyGroup.style.display = 'none';
            p2NameDisplay.innerText = "玩家 2 (O)";
        }
        
        // Reset game and scores when mode changes
        resetScores();
        handleRestartGame();
    }

    function handleDifficultyChange() {
        computerDifficulty = difficultySelect.value;
        // Don't necessarily need to reset game, but good practice if mid-game
        handleRestartGame();
    }

    // --- AI Logic ---

    function makeComputerMove() {
        if (!gameActive) return;

        let moveIndex;

        if (computerDifficulty === 'easy') {
            moveIndex = getRandomMove();
        } else {
            moveIndex = getBestMove();
        }

        const cell = document.querySelector(`.cell[data-index='${moveIndex}']`);
        handleCellPlayed(cell, moveIndex);
        handleResultValidation();
    }

    function getRandomMove() {
        const availableMoves = gameState.map((val, idx) => val === "" ? idx : null).filter(val => val !== null);
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
    }

    function getBestMove() {
        // Minimax Algorithm
        let bestScore = -Infinity;
        let move;

        for (let i = 0; i < 9; i++) {
            if (gameState[i] === "") {
                gameState[i] = 'O'; // Computer is O
                let score = minimax(gameState, 0, false);
                gameState[i] = ""; // Undo
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        return move;
    }

    const scoresMap = {
        O: 10,
        X: -10,
        tie: 0
    };

    function minimax(boardState, depth, isMaximizing) {
        let result = checkWinner(boardState);
        if (result !== null) {
            return scoresMap[result];
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (boardState[i] === "") {
                    boardState[i] = 'O';
                    let score = minimax(boardState, depth + 1, false);
                    boardState[i] = "";
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (boardState[i] === "") {
                    boardState[i] = 'X';
                    let score = minimax(boardState, depth + 1, true);
                    boardState[i] = "";
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    function checkWinner(boardState) {
        for (let i = 0; i <= 7; i++) {
            const [a, b, c] = winningConditions[i];
            if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
                return boardState[a];
            }
        }
        if (!boardState.includes("")) {
            return 'tie';
        }
        return null;
    }


    // Event Listeners
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    restartBtn.addEventListener('click', handleRestartGame);
    resetScoreBtn.addEventListener('click', resetScores);
    gameModeSelect.addEventListener('change', handleGameModeChange);
    difficultySelect.addEventListener('change', handleDifficultyChange);

    // Initial setup
    init();
});