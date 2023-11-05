let Game = function() {
    const TILE_SIZE = 16;
    const INIT_SIZE = 10;
    const ctx = document.getElementById('map-canvas').getContext('2d');

    this.currentWidth = 1;
    this.currentHeight = 1;
    this.puzzle = null;

    this.init = function() {
        ctx.canvas.width = TILE_SIZE * INIT_SIZE;
        ctx.canvas.height = TILE_SIZE * INIT_SIZE;

        this.puzzle = new Puzzle();
        this.puzzle.clear();
        this.puzzle.decodePuzzle('C24343631.R45061325.M1720416067.T36.');

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
        ctx.fillStyle = "rgb(255,255,255)";
        ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
    
        if (this.puzzle != null) {
            this._drawColAndRowHints();
            ctx.translate(TILE_SIZE, TILE_SIZE);
            this._drawMap();
            this._drawDeadEnds();
            ctx.setTransform();
        }
    };

    this._drawColAndRowHints = function() {
        const BPADDING = TILE_SIZE/6;
        const LPADDING = TILE_SIZE/4;
        ctx.font = TILE_SIZE + "px Monospace";
        ctx.fillStyle = "rgb(0,0,0)";
        var cols = this.puzzle.colHints;
        var rows = this.puzzle.rowHints;
        
        cols.forEach((val) => {
            ctx.translate(TILE_SIZE, 0);
            ctx.fillText(val, LPADDING, TILE_SIZE - BPADDING);
        });
        ctx.setTransform();
        rows.forEach((val) => {
            ctx.translate(0, TILE_SIZE);
            ctx.fillText(val, LPADDING, TILE_SIZE - BPADDING);
        });
        ctx.setTransform();
    };

    this._drawMap = function() {
        for (let x=0; x<this.puzzle.width; x++) {
            for (let y=0; y<this.puzzle.height; y++) {
                let tile = this.puzzle.getTile(x,y);
                let style = "rgb(0,0,0)";
                let tf = ctx.getTransform();
                if (tile == 0) {
                    style = "rgb(255,255,255)";
                } else if (tile == 1) {
                    style = "rgb(255,255,255)";
                } else if (tile == 2) {
                    style = "rgb(255,255,0)";
                }
                ctx.fillStyle = style;
                ctx.translate(x*TILE_SIZE, y*TILE_SIZE);
                ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
                // Draw grid
                ctx.beginPath();
                ctx.strokeStyle="rgb(128,128,128)";
                ctx.rect(0, 0, TILE_SIZE, TILE_SIZE);
                ctx.stroke();
                ctx.setTransform(tf);
            }
        }
    };

    this._drawDeadEnds = function() {
        let deadEnds = this.puzzle.deadEnds;
        for (var i=0; i<deadEnds.length; i+=2) {
            ctx.fillStyle = "rgb(255,0,0)";
            var x = deadEnds[i];
            var y = deadEnds[i+1];
            var tf = ctx.getTransform();
            ctx.beginPath();
            ctx.translate(x*TILE_SIZE + TILE_SIZE/2, y*TILE_SIZE + TILE_SIZE/2);
            ctx.arc(0,  0, TILE_SIZE/2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.setTransform(tf);
        }
    };

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
