<<<<<<< HEAD
//board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

//bird
let birdWidth = 70;
let birdHeight = 56;
let birdX = boardWidth / 9;
let birdY = boardHeight / 2;
let birdImg;

let bird = {
  x: birdX,
  y: birdY,
  width: birdWidth,
  height: birdHeight
};

//pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physics
let velocityX = -2; // pipes moving left speed
let velocityY = 0; // vertical speed of bird
let jumpStrength = -6; // upward impulse
let gravity = 0.25;

let gameOver = false;
let score = 0;

// audio + game over image
let bgMusic = new Audio("./asset/music.mp3");
bgMusic.loop = true;
let gameOverSound = new Audio("./asset/sound.mp3");
let gameOverImg = new Image();
gameOverImg.src = "./asset/gameover.png";

// helpers to avoid repeated sounds / autoplay issues
let bgStarted = false;
let gameOverPlayed = false;

window.onload = function () {
  board = document.getElementById("board");
  board.width = boardWidth;
  board.height = boardHeight;
  context = board.getContext("2d");

  // load bird image
  birdImg = new Image();
  birdImg.src = "./asset/flappybird.png";

  // load pipe images
  topPipeImg = new Image();
  topPipeImg.src = "./asset/toppipe.png";

  bottomPipeImg = new Image();
  bottomPipeImg.src = "./asset/bottompipe.png";

  requestAnimationFrame(update);
  setInterval(placePipes, 1500);

  // start music on first user key (to satisfy browser autoplay rules)
document.addEventListener("keydown", startMusicOnce, { once: true });
document.addEventListener("keydown", moveBird);

document.addEventListener("pointerdown", startMusicOnce, { once: true });
document.addEventListener("pointerdown", handlePhoneTap);

function handlePhoneTap() {
    startMusicOnce();

    if (gameOver) {
        resetGame();
        return;
    }

    velocityY = jumpStrength;
}

};

function startMusicOnce() {
  // try to play background music; browsers may require user gesture
  if (!bgStarted) {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {
      // play might be blocked; that's fine — music will start on next user gesture
    });
    bgStarted = true;
  }
}

function update() {
  requestAnimationFrame(update);

  // if game is over, still draw final frame (we stop advancing game)
  if (gameOver) {
    // draw final frame (so game over image & final pipes/bird are visible)
    drawFrame();
    // ensure game over actions happen once
    if (!gameOverPlayed) {
      onGameOver();
    }
    return;
  }

  // normal game frame
  drawFrame();

  // advance physics for next frame
  velocityY += gravity;
  bird.y = Math.max(bird.y + velocityY, 0);

  if (bird.y + bird.height > board.height) {
    // bird touched ground
    gameOver = true;
  }

  // move and check pipes
  for (let i = 0; i < pipeArray.length; i++) {
    let pipe = pipeArray[i];
    pipe.x += velocityX;

    // scoring: mark pipe passed once when bird crosses pipe's right edge
    if (!pipe.passed && bird.x > pipe.x + pipe.width) {
      score += 0.5; // top+bottom = 1
      pipe.passed = true;
    }

    // collision
    if (detectCollision(bird, pipe)) {
      gameOver = true;
    }
  }

  // remove pipes that moved off screen (use the actual first pipe width)
  while (pipeArray.length > 0 && pipeArray[0].x < -pipeArray[0].width) {
    pipeArray.shift();
  }

  // draw score
  context.fillStyle = "white";
  context.font = "45px sans-serif";
  context.fillText(Math.floor(score), 5, 45);
}

function drawFrame() {
  // clear
  context.clearRect(0, 0, board.width, board.height);

  // draw bird (if image not loaded yet, nothing appears but that's fine)
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  // draw pipes
  for (let i = 0; i < pipeArray.length; i++) {
    let pipe = pipeArray[i];
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);
  }

  // if game over, draw overlay + image
  if (gameOver) {
    // dim background
    context.fillStyle = "rgba(0,0,0,0.35)";
    context.fillRect(0, 0, board.width, board.height);

    // draw game over image centered (if loaded)
    if (gameOverImg.complete) {
      let imgW = Math.min(220, board.width - 40);
      let imgH = (gameOverImg.height / gameOverImg.width) * imgW;
      let imgX = (board.width - imgW) / 2;
      let imgY = (board.height - imgH) / 2 - 30;
      context.drawImage(gameOverImg, imgX, imgY, imgW, imgH);
    } else {
      // fallback text
      context.fillStyle = "white";
      context.font = "36px sans-serif";
      context.fillText("GAME OVER", board.width / 2 - 90, board.height / 2);
    }

    // draw final score under image
    context.fillStyle = "white";
    context.font = "28px sans-serif";
    context.fillText("Score: " + Math.floor(score), board.width / 2 - 60, board.height / 2 + 60);
  }
}

function placePipes() {
  if (gameOver) return;

  // GAP size (easy/medium/hard) — pick one
  let openingSpace = 250; // change to 110 (hard) or 180 (easy)

  // pick top pipe Y in a reasonable range (so pipes are visible)
  let topPipeY = -350 + Math.random() * 250; // between -350 and -100

  // top pipe
  let topPipe = {
    img: topPipeImg,
    x: pipeX,
    y: topPipeY,
    width: pipeWidth,
    height: pipeHeight,
    passed: false
  };
  pipeArray.push(topPipe);

  // bottom pipe
  let bottomPipe = {
    img: bottomPipeImg,
    x: pipeX,
    y: topPipeY + pipeHeight + openingSpace,
    width: pipeWidth,
    height: pipeHeight,
    passed: false
  };
  pipeArray.push(bottomPipe);
}

function moveBird(e) {
  // allowed keys: Space, ArrowUp, X
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyX") {
    // start bg music on first real press (some browsers require)
    startMusicOnce();

    // if game over, reset state
    if (gameOver) {
      resetGame();
      return;
    }

    // normal jump
    velocityY = jumpStrength;
  }
}

function resetGame() {
  bird.y = birdY;
  velocityY = 0;
  pipeArray = [];
  score = 0;
  gameOver = false;
  gameOverPlayed = false;

  // restart bg music
  try {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
  } catch (e) {}

  // stop game over sound if it's still playing
  try {
    gameOverSound.pause();
    gameOverSound.currentTime = 0;
  } catch (e) {}
}

function onGameOver() {
  // play game over effects once
  gameOverPlayed = true;

  // stop background music
  try {
    bgMusic.pause();
  } catch (e) {}

  // play game over sound (play once)
  try {
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(() => {});
  } catch (e) {}
}

function detectCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
=======
//board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

//bird
let birdWidth = 70;
let birdHeight = 56;
let birdX = boardWidth / 9;
let birdY = boardHeight / 2;
let birdImg;

let bird = {
  x: birdX,
  y: birdY,
  width: birdWidth,
  height: birdHeight
};

//pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physics
let velocityX = -2; // pipes moving left speed
let velocityY = 0; // vertical speed of bird
let jumpStrength = -6; // upward impulse
let gravity = 0.25;

let gameOver = false;
let score = 0;

// audio + game over image
let bgMusic = new Audio("./asset/music.mp3");
bgMusic.loop = true;
let gameOverSound = new Audio("./asset/sound.mp3");
let gameOverImg = new Image();
gameOverImg.src = "./asset/gameover.png";

// helpers to avoid repeated sounds / autoplay issues
let bgStarted = false;
let gameOverPlayed = false;

window.onload = function () {
  board = document.getElementById("board");
  board.width = boardWidth;
  board.height = boardHeight;
  context = board.getContext("2d");

  // load bird image
  birdImg = new Image();
  birdImg.src = "./asset/flappybird.png";

  // load pipe images
  topPipeImg = new Image();
  topPipeImg.src = "./asset/toppipe.png";

  bottomPipeImg = new Image();
  bottomPipeImg.src = "./asset/bottompipe.png";

  requestAnimationFrame(update);
  setInterval(placePipes, 1500);

  // start music on first user key (to satisfy browser autoplay rules)
  document.addEventListener("keydown", startMusicOnce, { once: true });
  document.addEventListener("keydown", moveBird);
  document.addEventListener("pointerdown", startMusicOnce, { once: true });
};

function startMusicOnce() {
  // try to play background music; browsers may require user gesture
  if (!bgStarted) {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {
      // play might be blocked; that's fine — music will start on next user gesture
    });
    bgStarted = true;
  }
}

function update() {
  requestAnimationFrame(update);

  // if game is over, still draw final frame (we stop advancing game)
  if (gameOver) {
    // draw final frame (so game over image & final pipes/bird are visible)
    drawFrame();
    // ensure game over actions happen once
    if (!gameOverPlayed) {
      onGameOver();
    }
    return;
  }

  // normal game frame
  drawFrame();

  // advance physics for next frame
  velocityY += gravity;
  bird.y = Math.max(bird.y + velocityY, 0);

  if (bird.y + bird.height > board.height) {
    // bird touched ground
    gameOver = true;
  }

  // move and check pipes
  for (let i = 0; i < pipeArray.length; i++) {
    let pipe = pipeArray[i];
    pipe.x += velocityX;

    // scoring: mark pipe passed once when bird crosses pipe's right edge
    if (!pipe.passed && bird.x > pipe.x + pipe.width) {
      score += 0.5; // top+bottom = 1
      pipe.passed = true;
    }

    // collision
    if (detectCollision(bird, pipe)) {
      gameOver = true;
    }
  }

  // remove pipes that moved off screen (use the actual first pipe width)
  while (pipeArray.length > 0 && pipeArray[0].x < -pipeArray[0].width) {
    pipeArray.shift();
  }

  // draw score
  context.fillStyle = "white";
  context.font = "45px sans-serif";
  context.fillText(Math.floor(score), 5, 45);
}

function drawFrame() {
  // clear
  context.clearRect(0, 0, board.width, board.height);

  // draw bird (if image not loaded yet, nothing appears but that's fine)
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  // draw pipes
  for (let i = 0; i < pipeArray.length; i++) {
    let pipe = pipeArray[i];
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);
  }

  // if game over, draw overlay + image
  if (gameOver) {
    // dim background
    context.fillStyle = "rgba(0,0,0,0.35)";
    context.fillRect(0, 0, board.width, board.height);

    // draw game over image centered (if loaded)
    if (gameOverImg.complete) {
      let imgW = Math.min(220, board.width - 40);
      let imgH = (gameOverImg.height / gameOverImg.width) * imgW;
      let imgX = (board.width - imgW) / 2;
      let imgY = (board.height - imgH) / 2 - 30;
      context.drawImage(gameOverImg, imgX, imgY, imgW, imgH);
    } else {
      // fallback text
      context.fillStyle = "white";
      context.font = "36px sans-serif";
      context.fillText("GAME OVER", board.width / 2 - 90, board.height / 2);
    }

    // draw final score under image
    context.fillStyle = "white";
    context.font = "28px sans-serif";
    context.fillText("Score: " + Math.floor(score), board.width / 2 - 60, board.height / 2 + 60);
  }
}

function placePipes() {
  if (gameOver) return;

  // GAP size (easy/medium/hard) — pick one
  let openingSpace = 200; // change to 110 (hard) or 180 (easy)

  // pick top pipe Y in a reasonable range (so pipes are visible)
  let topPipeY = -350 + Math.random() * 250; // between -350 and -100

  // top pipe
  let topPipe = {
    img: topPipeImg,
    x: pipeX,
    y: topPipeY,
    width: pipeWidth,
    height: pipeHeight,
    passed: false
  };
  pipeArray.push(topPipe);

  // bottom pipe
  let bottomPipe = {
    img: bottomPipeImg,
    x: pipeX,
    y: topPipeY + pipeHeight + openingSpace,
    width: pipeWidth,
    height: pipeHeight,
    passed: false
  };
  pipeArray.push(bottomPipe);
}

function moveBird(e) {
  // allowed keys: Space, ArrowUp, X
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyX") {
    // start bg music on first real press (some browsers require)
    startMusicOnce();

    // if game over, reset state
    if (gameOver) {
      resetGame();
      return;
    }

    // normal jump
    velocityY = jumpStrength;
  }
}

function resetGame() {
  bird.y = birdY;
  velocityY = 0;
  pipeArray = [];
  score = 0;
  gameOver = false;
  gameOverPlayed = false;

  // restart bg music
  try {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
  } catch (e) {}

  // stop game over sound if it's still playing
  try {
    gameOverSound.pause();
    gameOverSound.currentTime = 0;
  } catch (e) {}
}

function onGameOver() {
  // play game over effects once
  gameOverPlayed = true;

  // stop background music
  try {
    bgMusic.pause();
  } catch (e) {}

  // play game over sound (play once)
  try {
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(() => {});
  } catch (e) {}
}

function detectCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
>>>>>>> dab71d61783e0582f5f901e7b2aea751db2a5d1c
