document.addEventListener('DOMContentLoaded', function () {
    const startButton = document.getElementById('start-btn');
    const overlay = document.getElementById('overlay');
    const countdownElement = document.getElementById('countdown');
    const gameInfo = document.getElementById('game-info');
    const gameOverElement = document.getElementById('game-over');
    const timeLivedElement = document.getElementById('time-lived');
    const applesCollectedElement = document.getElementById('apples-collected');
    const restartButton = document.getElementById('restart-btn');
    const spawnBlocks = document.querySelectorAll('.spawn-zone-blocks');
    const startMessage = document.querySelector('.start-message');

    let gameTimeText = "";
    let lastUpdate = performance.now();
    let gameTime = 0;
    let applesCollected = 0;
    let firstMoveMade = false;
    let snake = [];
    let snakeDirection = { x: 1, y: 0 };
    let nextDirection = null;
    const segmentWidth = 25;
    const segmentHeight = 25;
    let gameOver = false;
    let gameInterval;
    let currentAppleBlock = null;

    countdownElement.style.visibility = 'hidden';

    startButton.addEventListener('click', function () {
        timeLivedElement.innerText = '0';
        startButton.disabled = true;
        resetGame();
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 500);
        setTimeout(startCountdown, 500);
    });

    restartButton.addEventListener('click', function () {
        timeLivedElement.innerText = '0';
        restartButton.disabled = true;
        startButton.click();
    });

    function startCountdown() {
        let countdown = 3;
        countdownElement.innerText = countdown;
        countdownElement.style.visibility = 'visible';
        countdownElement.style.opacity = '1';

        const interval = setInterval(() => {
            countdownElement.style.opacity = '0';

            setTimeout(() => {
                countdown--;
                if (countdown >= 0) {
                    countdownElement.innerText = countdown;
                    countdownElement.style.opacity = '1';
                } else {
                    clearInterval(interval);
                    setTimeout(() => {
                        countdownElement.style.opacity = '0';
                        countdownElement.style.visibility = 'hidden';
                        startGame();
                    }, 100);
                }
            }, 200);
        }, 400);
    }

    function startGame() {
        startMessage.style.visibility = 'visible';
        gameInfo.style.visibility = 'visible';
        createSnake();
        createApple();
        document.addEventListener('keydown', handleKeydown);
        lastUpdate = performance.now();
        gameOver = false;

        // Запускаем игровой цикл с таймером, а не с requestAnimationFrame
        gameInterval = setInterval(gameLoop, 100); // Игровой цикл будет выполняться каждые 100 мс
    }

    function gameLoop() {
        if (gameOver) {
            clearInterval(gameInterval); // Останавливаем игру, когда она завершена
            return;
        }

        const timestamp = performance.now();
        const elapsed = (timestamp - lastUpdate) / 1000; // Конвертируем в секунды
        if (elapsed >= 0.15) { // Проверяем интервал в 150 мс (0.15 секунд)
            if (firstMoveMade) {
                startMessage.style.visibility = 'hidden';
                gameTime += elapsed; // Увеличиваем общее время
                moveSnake();
            }
            lastUpdate = timestamp;
        }

        if (firstMoveMade) {
            updateTimer();
        }

        // Проверяем столкновение головы змеи с яблоком
        checkAppleCollision();
    }

    function updateTimer() {
        const totalSeconds = Math.floor(gameTime); // Получаем целое количество секунд

        if (totalSeconds >= 69 * 3600) {
            timeLivedElement.innerText = '∞';
            return;
        }

        const hours = Math.floor(totalSeconds / 3600); // Часы
        const minutes = Math.floor((totalSeconds % 3600) / 60); // Минуты
        const seconds = totalSeconds % 60; // Секунды

        gameTimeText = "";

        if (hours > 0) { // Если есть часы
            gameTimeText += `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else if (minutes > 0) { // Если есть минуты
            gameTimeText += `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else { // Если только секунды
            gameTimeText += `${seconds}`;
        }

        timeLivedElement.innerText = gameTimeText; // Устанавливаем текст таймера
    }

    function checkAppleCollision() {
        const head = snake[0]; // Голова змеи
        const headRect = head.getBoundingClientRect();

        if (!currentAppleBlock) return; // Если яблока нет, ничего не делаем

        const appleBlockRect = currentAppleBlock.getBoundingClientRect();

        if (headRect.left === appleBlockRect.left && headRect.top === appleBlockRect.top) {
            // Если координаты головы совпадают с блоком, где яблоко
            applesCollected++; // Увеличиваем счётчик яблок
            applesCollectedElement.innerText = applesCollected; // Обновляем UI
            const apple = currentAppleBlock.querySelector('.apple');
            if (apple) apple.remove(); // Удаляем съеденное яблоко
            createApple(); // Создаём новое яблоко
            addSnakeSegment(); // Добавляем сегмент змейки
        }
    }

    function createApple() {
        let validBlock = null;

        // Получаем координаты сегментов змеи
        const snakeSegments = snake.map(segment => ({
            left: parseInt(segment.style.left),
            top: parseInt(segment.style.top)
        }));

        // Ищем подходящий блок, который не пересекается с змеёй
        while (!validBlock) {
            const randomIndex = Math.floor(Math.random() * spawnBlocks.length);
            const randomBlock = spawnBlocks[randomIndex];

            // Получаем координаты блока
            const blockRect = randomBlock.getBoundingClientRect();
            const gameMapRect = document.querySelector('.game-map').getBoundingClientRect();

            const blockPosition = {
                left: Math.round(blockRect.left - gameMapRect.left),
                top: Math.round(blockRect.top - gameMapRect.top)
            };

            // Проверяем, не пересекается ли блок с любым сегментом змеи
            const isOccupied = snakeSegments.some(segment =>
                segment.left === blockPosition.left && segment.top === blockPosition.top
            );

            if (!isOccupied) {
                validBlock = randomBlock;
            }
        }

        const apple = document.createElement('div');
        apple.classList.add('apple');
        apple.style.width = '28px';
        apple.style.height = '28px';
        apple.style.backgroundImage = "url('../static/images/apple.png')";
        apple.style.backgroundSize = 'cover';
        apple.style.position = 'absolute';
        apple.style.top = '-3px';
        apple.style.left = '-1px';

        validBlock.appendChild(apple);
        currentAppleBlock = validBlock; // Сохраняем блок с яблоком
    }

    function addSnakeSegment() {
        // Берём последний сегмент змейки
        const lastSegment = snake[snake.length - 1];
        const lastSegmentX = parseInt(lastSegment.style.left);
        const lastSegmentY = parseInt(lastSegment.style.top);

        // Определяем новое положение сегмента в зависимости от направления змейки
        const newSegmentX = lastSegmentX - snakeDirection.x * segmentWidth;
        const newSegmentY = lastSegmentY - snakeDirection.y * segmentHeight;

        // Создаём новый сегмент
        const newSegment = createBodySegment(newSegmentX, newSegmentY);
        document.querySelector('.game-map').appendChild(newSegment);

        // Добавляем сегмент в массив змейки
        snake.push(newSegment);
    }

    function createSnake() {
        snake.forEach(segment => segment.remove());
        snake = [];

        const head = createHeadSegment(200, 300);
        document.querySelector('.game-map').appendChild(head);
        snake.push(head);

        for (let i = 1; i <= 2; i++) {
            const bodySegment = createBodySegment(200 - i * segmentWidth, 300);
            document.querySelector('.game-map').appendChild(bodySegment);
            snake.push(bodySegment);
        }
    }

    function createHeadSegment(x, y) {
        const head = document.createElement('div');
        head.classList.add('snake', 'snake-head');
        head.style.width = `${segmentWidth}px`;
        head.style.height = `${segmentHeight}px`;
        head.style.left = `${x}px`;
        head.style.top = `${y}px`;

        const leftEye = document.createElement('div');
        leftEye.classList.add('eye', 'left');
        head.appendChild(leftEye);

        const rightEye = document.createElement('div');
        rightEye.classList.add('eye', 'right');
        head.appendChild(rightEye);

        return head;
    }

    function createBodySegment(x, y) {
        const segment = document.createElement('div');
        segment.classList.add('snake', 'snake-body');
        segment.style.width = `${segmentWidth}px`;
        segment.style.height = `${segmentHeight}px`;
        segment.style.left = `${x}px`;
        segment.style.top = `${y}px`;
        return segment;
    }

    function handleKeydown(event) {
        if (!firstMoveMade) {
            firstMoveMade = true;
        }

        const newDirection = getDirectionFromKey(event.key);
        if (newDirection && !isOppositeDirection(newDirection, snakeDirection)) {
            nextDirection = newDirection;
        }
    }

    function getDirectionFromKey(key) {
        switch (key) {
            case 'ArrowUp':
                return { x: 0, y: -1 };
            case 'ArrowDown':
                return { x: 0, y: 1 };
            case 'ArrowLeft':
                return { x: -1, y: 0 };
            case 'ArrowRight':
                return { x: 1, y: 0 };
            default:
                return null;
        }
    }

    function isOppositeDirection(newDir, currentDir) {
        return newDir.x === -currentDir.x && newDir.y === -currentDir.y;
    }

    function moveSnake() {
        if (nextDirection) {
            snakeDirection = nextDirection;
            nextDirection = null;
        }

        const head = snake[0];
        const newHeadX = parseInt(head.style.left) + snakeDirection.x * segmentWidth;
        const newHeadY = parseInt(head.style.top) + snakeDirection.y * segmentHeight;

        // Проверяем столкновение с границами карты
        if (newHeadX < 0 || newHeadX >= document.querySelector('.game-map').clientWidth ||
            newHeadY < 0 || newHeadY >= document.querySelector('.game-map').clientHeight) {
            endGame();
            return;
        }

        // Проверяем столкновение с телом змейки
        for (let i = 1; i < snake.length; i++) { // Начинаем с 1, чтобы исключить голову
            const bodySegment = snake[i];
            const bodyX = parseInt(bodySegment.style.left);
            const bodyY = parseInt(bodySegment.style.top);

            if (newHeadX === bodyX && newHeadY === bodyY) {
                endGame();
                return;
            }
        }

        // Перемещаем тело змейки
        for (let i = snake.length - 1; i > 0; i--) {
            snake[i].style.left = snake[i - 1].style.left;
            snake[i].style.top = snake[i - 1].style.top;
        }

        // Перемещаем голову змейки
        head.style.left = `${newHeadX}px`;
        head.style.top = `${newHeadY}px`;
    }

    async function endGame() {
        startButton.disabled = false;
        gameOver = true;
        const sendData = await fetch('/sendData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ time: gameTimeText, apples: applesCollected })
            });
        const data = await sendData.json();
        gameOverElement.style.visibility = 'visible';
        document.getElementById('time-lived-text').innerText = timeLivedElement.innerText;
        document.getElementById('apples-collected-text').innerText = `${applesCollected}`;
        document.removeEventListener('keydown', handleKeydown);
    }

    function resetGame() {
        snake.forEach(segment => segment.remove());
        snake = [];
        if (currentAppleBlock) {
            const apple = currentAppleBlock.querySelector('.apple');
            if (apple) {
                apple.remove();
            }
            currentAppleBlock = null;
        }
        overlay.style.display = 'flex';
        gameOverElement.style.visibility = 'hidden';
        snakeDirection = { x: 1, y: 0 };
        nextDirection = null;
        firstMoveMade = false;
        gameTime = 0;
        applesCollected = 0;
        applesCollectedElement.innerText = applesCollected;
    }
});
