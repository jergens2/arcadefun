

const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const TILE_RADIUS = 25;
const TILE_BUFFER = 1;


const config = {
    type: Phaser.AUTO,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    audio: {
        disableWebAudio: false,
    },
    // Prevent game from pausing when the browser loses focus
    autoFocus: false, // Ensures the game does not automatically pause
    input: {
        windowEvents: false // Disable default input window focus/blur behavior
    },
    backgroundColor: 0xffffff,
};

const game = new Phaser.Game(config);



function preload() {
    this.load.audio('boop1', 'assets/boop1.mp3');
    this.load.audio('bing1', 'assets/bing1.mp3');
    this.load.audio('gentle_bong1', 'assets/gentle_bong1.mp3');
    this.load.audio('gentle_bong2', 'assets/gentle_bong2.mp3');
    this.load.audio('gentle_bong3', 'assets/gentle_bong3.mp3');
    this.load.audio('bong1', 'assets/bong1.mp3');
    this.load.audio('bong2', 'assets/bong2.mp3');
    this.load.audio('bong3', 'assets/bong3.mp3');
    this.load.audio('zoop', 'assets/zoop.mp3');
    this.load.audio('explosion', 'assets/explosion3.mp3')
    this.load.image('bomb', 'assets/bomb2.png');
}

function create() {

    const button = document.getElementById('restart-button');
    button.addEventListener('click', () => {
        const gameMenu = document.getElementById('gameMenuContainer');
        gameMenu.style.display = 'none';
        location.reload(); // Reload the entire page, which resets the game
    });

    this.hexagons = [];
    const tileRadius = TILE_RADIUS;
    const tileBuffer = TILE_BUFFER;
    const canvasWidth = CANVAS_WIDTH;
    const canvasHeight = CANVAS_HEIGHT;
    const effectiveRadius = tileRadius + tileBuffer;
    const halfHeight = Math.sqrt(Math.abs(((tileRadius / 2) ** 2) - (tileRadius ** 2))) + (tileBuffer / 2);
    const effectiveHeight = (halfHeight * 2) + tileBuffer;
    // in the horizontal configuration, the first column is width of 2*radius and each subsequent column adds an additional width of 1.5 * radius
    // every second column will have minus one height, unless there is additional space at the end.
    let columnsHaveSameHeight = false;
    let currentWidth = 2 * effectiveRadius;
    let actualWidth = currentWidth;
    const additionalColWidth = 1.5 * effectiveRadius;
    let columnCount = 1;
    while (currentWidth < canvasWidth) {
        const remainingWidth = canvasWidth - currentWidth;
        if (remainingWidth >= additionalColWidth) {
            currentWidth += additionalColWidth;
            columnCount++;
            actualWidth = currentWidth;
        } else {
            currentWidth = canvasWidth + 1;
        }
    }
    let rowCount = Math.floor(canvasHeight / effectiveHeight);
    let actualHeight = rowCount * effectiveHeight;
    if ((canvasHeight - (rowCount * effectiveHeight)) > halfHeight) {
        columnsHaveSameHeight = true;
        actualHeight += (effectiveHeight / 2);
    }
    const offsetX = (canvasWidth - actualWidth) / 2;
    const offsetY = (canvasHeight - actualHeight) / 2;
    let startX = 0;
    let startY = 0;
    for (let column = 0; column < columnCount; column++) {
        for (let row = 0; row < rowCount; row++) {
            if (column % 2 == 0) {
                //if it is an even column
                startX = offsetX + effectiveRadius + (column * additionalColWidth);
                startY = offsetY + effectiveHeight / 2 + (effectiveHeight * row);

                addHexagon(this, startX, startY, row, column);
            } else {
                //if it is an odd column
                startX = offsetX + (effectiveRadius * 2) + (column * additionalColWidth) - effectiveRadius;
                startY = offsetY + effectiveHeight + (effectiveHeight * row);

                if (columnsHaveSameHeight) {
                    // hexTiles.push(new TileHexagon(startX, startY, tileRadius, column, row));
                    addHexagon(this, startX, startY, row, column);
                } else {
                    if (row != rowCount - 1) {
                        // hexTiles.push(new TileHexagon(startX, startY, tileRadius, column, row));
                        addHexagon(this, startX, startY, row, column);
                    }
                }
            }
        }
    }
}

function playRandomSounds() {
    setInterval(() => {
        playRandomSound();
    }, 1000);
}

function playRandomSound(scene) {
    const sounds = ['boop1', 'gentle_bong1', 'gentle_bong2', 'gentle_bong3', 'bong1', 'bong2', 'bong3'];
    const randomIndex = Math.floor(Math.random() * sounds.length);
    const randomSound = sounds[randomIndex];
    scene.sound.play(randomSound);
}

function addHexagon(scene, startX, startY, row, column) {
    var hexagon;
    var isExplosive = false;
    isExplosive = Math.random() < 0.15; // 20% chance to be true
    hexagon = scene.add.graphics({ x: startX, y: startY });
    hexagon.startX = startX;
    hexagon.startY = startY;
    hexagon.row = row;
    hexagon.column = column;
    hexagon.isExplosive = isExplosive;
    hexagon.recentlyChecked = false;
    drawHexagon(hexagon, TILE_RADIUS, Phaser.Display.Color.RandomRGB().color); // Draw hexagon
    hexagon.setInteractive(new Phaser.Geom.Polygon(createHexagonPoints(TILE_RADIUS)), Phaser.Geom.Polygon.Contains);
    hexagon.on('pointerdown', function () {
        if (hexagon.isExplosive) {
            scene.sound.play('explosion');
            const gameMenu = document.getElementById('gameMenuContainer');
            gameMenu.style.display = 'flex';
        } else {
            playRandomSound(scene);
        }
        clickHexagon(scene, hexagon);
        scene.hexagons.forEach(h => h.recentlyChecked = false);
    });
    scene.hexagons.push(hexagon);
}

// Function to draw hexagons
function drawHexagon(graphics, radius, fillColor, strokeColor) {
    const points = createHexagonPoints(radius);
    graphics.lineStyle(2, 0xffffff, 1)
    graphics.fillStyle(fillColor, 0.8);

    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
}

// Function to create points for a hexagon
function createHexagonPoints(radius) {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = Phaser.Math.DegToRad(60 * i);
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        points.push({ x: x, y: y });
    }
    return points;
}

// Function to explode the hexagon and then remove it
function explodeHexagon(scene, hexagon) {
    // Animate scale for explosion effect
    // console.log(hexagon.column, hexagon.row)
    scene.tweens.add({
        targets: hexagon,
        scaleX: 0.2, // Increase size to simulate explosion
        scaleY: 0.2,
        alpha: 0.5, // Fade out
        duration: 600, // Duration of explosion
        ease: 'Power2',
        onComplete: function () {
            // hexagon.destroy(); // Remove hexagon from the scene
            scene.tweens.add({
                targets: hexagon,
                scaleX: 1, // Increase size to simulate explosion
                scaleY: 1,
                alpha: 1, // Fade out
                duration: 1600, // Duration of explosion
                ease: 'Power2',
                onComplete: function () {
                    // hexagon.destroy(); // Remove hexagon from the scene
                }
            });
        }
    });
}

function countBombs(scene, clickedHexagon) {
    let bombCount = 0;
    const neighbors = getNeighbors(scene, clickedHexagon);
    neighbors.forEach(neighbor => {
        if (neighbor.isExplosive) {
            bombCount++;
        }
    });
    return bombCount;
}


function getNeighbors(scene, hexagon) {
    var neighbors = [];
    scene.hexagons.forEach(sceneHex => {
        if (sceneHex.column === hexagon.column) {
            // if they are the same column
            if (sceneHex.row === hexagon.row - 1 || sceneHex.row === hexagon.row + 1) {
                neighbors.push(sceneHex);
            }
        } else {
            if (sceneHex.column === hexagon.column - 1 || sceneHex.column === hexagon.column + 1) {
                if (sceneHex.column % 2 === 0) {
                    if (sceneHex.row >= hexagon.row && sceneHex.row <= hexagon.row + 1) {
                        neighbors.push(sceneHex);
                    }
                } else {
                    if (sceneHex.row >= hexagon.row - 1 && sceneHex.row <= hexagon.row) {
                        neighbors.push(sceneHex);
                    }
                }
            }
        }
    });
    return neighbors;
}


function clickHexagon(scene, hexagon) {
    var bombCount = countBombs(scene, hexagon);
    hexagon.recentlyChecked = true;
    scene.tweens.add({
        targets: hexagon,
        scaleX: 0.2, // Increase size to simulate explosion
        scaleY: 0.2,
        alpha: 0.5, // Fade out
        duration: 600, // Duration of explosion
        ease: 'Power2',
        onComplete: function () {
            // hexagon.destroy(); // Remove hexagon from the scene

        }
    });
    if (!hexagon.isExplosive) {

        if (bombCount === 0) {
            // bombCount = '';
            const neighbors = getNeighbors(scene, hexagon);
            neighbors.forEach(neighbor => {
                const neighborsBombs = countBombs(scene, neighbor);
                if (neighborsBombs === 0 && !neighbor.recentlyChecked) {
                    clickHexagon(scene, neighbor);
                }
            })
            console.log("neighbors", neighbors)
        }
    }
    if (bombCount > 0) {
        var text = scene.add.text(hexagon.startX, hexagon.startY, bombCount,
            {
                font: '32px Arial',
                fill: '#000000',
            });
        text.setOrigin(0.5, 0.5)
    }
    if (hexagon.isExplosive) {
        var image = scene.add.image(hexagon.startX, hexagon.startY, 'bomb');
        image.setOrigin(0.5, 0.5);
        image.setScale(0.5);
    }
}

function animateHexagon(scene, hexagon, isReversal = false) {
    const random = getRandomInRange(500, 5000);
    // const random = getRandomInRange(200,500);
    if (isReversal) {
        scene.tweens.add({
            targets: hexagon,
            scaleX: 0.5, // Increase size to simulate explosion
            scaleY: 0.5,
            alpha: 0.5, // Fade out
            duration: random, // Duration of explosion
            ease: 'Power2',
            onComplete: function () {
                animateHexagon(scene, hexagon, false);
            }
        });
    } else {
        scene.tweens.add({
            targets: hexagon,
            scaleX: 1, // Increase size to simulate explosion
            scaleY: 1,
            alpha: 1, // Fade out
            duration: random, // Duration of explosion
            ease: 'Power2',
            onComplete: function () {
                animateHexagon(scene, hexagon, true);
            }
        });
    }

}

function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

function update() { }
