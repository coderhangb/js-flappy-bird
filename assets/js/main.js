function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// sfx
const hit = new Audio("./assets/sfx/sfx_hit.wav");
const die = new Audio("./assets/sfx/sfx_die.wav");
const point = new Audio("./assets/sfx/sfx_point.wav");
const wing = new Audio("./assets/sfx/sfx_wing.wav");

hit.volume = 0.2;
die.volume = 0.2;
point.volume = 0.2;
wing.volume = 0.2;

// board
let board;
let boardHeight;
let boardWidth;
let context;

const resizeCanvas = function () {
  boardHeight = window.innerHeight;
  boardWidth = (boardHeight / 16) * 9;
  board.height = boardHeight;
  board.width = boardWidth;
};

// bird
let birdHeight;
let birdWidth;
let birdX = 0;
let birdY = 0;
let birdImg;

let bird = {
  x: birdX,
  y: birdY,
  width: birdWidth,
  height: birdHeight,
};

birdImg = new Image();

function drawBird() {
  birdImg.addEventListener("load", function () {
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
  });
}

const resizeBird = function () {
  birdHeight = window.innerHeight * 0.0375;
  birdWidth = (birdHeight / 228) * 408;
  birdX = boardWidth / 8;
  birdY = boardHeight / 2;
  bird.height = birdHeight;
  bird.width = birdWidth;
  bird.x = birdX;
  bird.y = birdY;
  drawBird();
};

// pipes
let pipesArr = [];
let pipeHeight = window.innerHeight * 0.8;
let pipeWidth = pipeHeight * 0.125;
let pipeX = (window.innerHeight / 16) * 9;
let pipeY = 0;

let topPipeImg = new Image();
let bottomPipeImg = new Image();

function resizePipe() {
  pipeHeight = window.innerHeight * 0.8;
  pipeWidth = pipeHeight * 0.125;
  pipeX = (window.innerHeight / 16) * 9;
}

// dark mode
let binLadenMode = false;
const boardElement = document.getElementById("board");

function updateMode() {
  boardElement.style.backgroundImage = binLadenMode
    ? "url(./assets/img/dark-bg.png)"
    : "url(./assets/img/flappybirdbg.png)";

  birdImg.src = binLadenMode
    ? "./assets/img/dark-bird.png"
    : "./assets/img/flappybird.png";

  topPipeImg.src = binLadenMode
    ? "./assets/img/dark-pipe.png"
    : "./assets/img/toppipe.png";
  bottomPipeImg.src = binLadenMode
    ? "./assets/img/dark-pipe.png"
    : "./assets/img/bottompipe.png";
}
updateMode();

// turn on dark mode
function turnOnDarkMode() {
  binLadenMode = true;
  updateMode();
}

// turn off dark mode
function turnOffDarkMode() {
  binLadenMode = false;
  updateMode();
}

// physic
let velocityX = window.innerHeight / 7.4;
let velocityY = 0;
let jumpForce = 0;
let gravity = 0;
let gameStart = false;
let gameOver = false;
let score = 0;
let highScore = 0;

let godMod = false;

// resize
const debouncedResize = debounce(() => {
  resizeCanvas();
  resizeBird();
  resizePipe();
  velocityX = window.innerHeight / 7.4;
}, 1000);

window.addEventListener("resize", function () {
  debouncedResize();
});

// draw
window.addEventListener("load", function () {
  // board
  board = document.getElementById("board");
  resizeCanvas();
  context = board.getContext("2d");

  // bird
  resizeBird();

  window.requestAnimationFrame(update);
  window.addEventListener("keydown", function (e) {
    if (e.key == " " || e.code == "Space") {
      gameStart = true;
      wing.play();
      moveBird();

      if (gameOver) {
        bird.y = birdY;
        pipesArr = [];
        velocityY = 0;
        gravity = 0;
        score = 0;
        gameOver = false;
        gameStart = false;
      }
    }
  });

  document.body.addEventListener("click", function (e) {
    e.preventDefault();
    gameStart = true;
    wing.play();
    moveBird();

    if (gameOver) {
      bird.y = birdY;
      pipesArr = [];
      velocityY = 0;
      gravity = 0;
      score = 0;
      gameOver = false;
      gameStart = false;
    }
  });
});

let lastTime = 0;
let pipeSpawnTimer = 0;
let pipeSpawnInterval = 2;

function update(currentTime) {
  requestAnimationFrame(update);
  if (gameOver) return;
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  context.clearRect(0, 0, board.width, board.height);

  // bird
  velocityY += gravity * deltaTime;
  bird.y = Math.max(bird.y + velocityY * deltaTime, 0);
  if (birdImg.complete && birdImg.naturalWidth > 0) {
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
  } else {
    birdImg.onload = function () {
      context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    };
  }

  if (!gameStart) return;

  if (bird.y > board.height) {
    gameOver = true;
    die.play();
  }

  // pipes
  pipeSpawnTimer += deltaTime;

  if (pipeSpawnTimer >= pipeSpawnInterval) {
    placePipes();
    pipeSpawnTimer = 0;
  }

  for (let i = 0; i < pipesArr.length; i++) {
    let pipe = pipesArr[i];
    pipe.x -= velocityX * deltaTime;
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

    if (!pipe.passed && bird.x > pipe.x + pipe.width) {
      point.play();
      score += 0.5;
      pipe.passed = true;
      highScore = score > highScore ? score : highScore;
    }

    if (isBirdCollapse(bird, pipe)) {
      gameOver = true;
      hit.play();
    }
  }

  // clear pipes
  while (pipesArr.length > 0 && pipesArr[0].x + pipeWidth < 0) {
    pipesArr.shift();
  }

  // score
  context.fillStyle = "white";
  context.font = `${boardHeight / 20}px sans-serif`;
  context.fillText(score, boardHeight / 80, boardHeight / 20);

  // high score
  context.fillStyle = "white";
  context.font = `${boardHeight / 20}px sans-serif`;
  context.fillText(
    `Best score: ${highScore}`,
    boardHeight / 4.4,
    boardHeight / 20
  );

  // game over
  if (gameOver) {
    context.fillStyle = "white";
    context.font = `${boardHeight / 15}px sans-serif`;
    context.fillText("GAME OVER", boardHeight / 12, boardHeight / 2);
  }
}

function placePipes() {
  if (gameOver || !gameStart) return;
  let openSpace = pipeHeight / 4;
  let ramdomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);

  let topPipe = {
    img: topPipeImg,
    x: pipeX,
    y: ramdomPipeY,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  };

  pipesArr.push(topPipe);

  let bottomPipe = {
    img: bottomPipeImg,
    x: pipeX,
    y: ramdomPipeY + pipeHeight + openSpace,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  };

  pipesArr.push(bottomPipe);
}

function moveBird() {
  if (godMod) return;
  jumpForce = window.innerHeight * 0.6;
  gravity = window.innerHeight * 2;
  velocityY = -jumpForce;
}

function isBirdCollapse(bird, pipe) {
  if (godMod) return false;
  return (
    bird.x < pipe.x + pipe.width &&
    bird.x + bird.width > pipe.x &&
    bird.y < pipe.y + pipe.height &&
    bird.y + bird.height > pipe.y
  );
}
