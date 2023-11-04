let Game = function() {
    const TILE_SIZE = 16;
    const INIT_SIZE = 10;
    const ctx = document.getElementById('map-canvas').getContext('2d');

    this.currentWidth = 1;
    this.currentHeight = 1;

    this.init = function() {
        ctx.canvas.width = TILE_SIZE * INIT_SIZE;
        ctx.canvas.height = TILE_SIZE * INIT_SIZE;

        window.addEventListener('resize', () => {
            this.resize();
            this.render();
        });

        document.getElementById('map-canvas').addEventListener('mousedown', (e) => {
            var ratio = INIT_SIZE / this.currentWidth; // TODO: Only works when map width = height
            var x = Math.floor(e.offsetX * ratio);
            var y = Math.floor(e.offsetY * ratio);
            console.log(`[${x}, ${y}], [${e.offsetX}, ${e.offsetY}]`);
        });
    };

    this.render = function() {
        ctx.fillRect(TILE_SIZE, TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.fillRect(TILE_SIZE*(INIT_SIZE-2), TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.fillRect(TILE_SIZE, TILE_SIZE*(INIT_SIZE-2), TILE_SIZE, TILE_SIZE);
        ctx.fillRect(TILE_SIZE*(INIT_SIZE-2), TILE_SIZE*(INIT_SIZE-2), TILE_SIZE, TILE_SIZE);
    }

    this.resize = function() {
        nWidth = TILE_SIZE * INIT_SIZE
        nHeight = nWidth;
        cWidth = window.innerWidth;
        cHeight = window.innerHeight;

        // ratio of the native game size width to height
        const nativeRatio = nWidth / nHeight;
        const browserWindowRatio = cWidth / cHeight;

        // browser window is too wide
        if (browserWindowRatio > nativeRatio) {
            cWidth = Math.floor(cHeight * nativeRatio);
        } else {
            // browser window is too tall
            cHeight = Math.floor(cWidth / nativeRatio);
        }

        this.currentWidth = cWidth;
        this.currentHeight = cHeight;
        ctx.canvas.style.width = `${cWidth}px`;
        ctx.canvas.style.height = `${cHeight}px`;
        game.render();
    }
}

let game = new Game();
game.init();
game.resize();
