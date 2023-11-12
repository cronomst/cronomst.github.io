let Game = function() {
    const TILE_SIZE = 16;
    const INIT_SIZE = 10;
    const ctx = document.getElementById('map-canvas').getContext('2d');

    this.currentWidth = 1;
    this.currentHeight = 1;
    this.puzzle = null;

    this.selectedTool = 0;
    this.drawing = false;

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
            this.touchStart(e.clientX, e.clientY);
            this.drawing = true;
        });
        document.getElementById('map-canvas').addEventListener('mousemove', (e) => {
            if (this.drawing) {
                this.touch(e.clientX, e.clientY);
            }
        });
        document.getElementById('map-canvas').addEventListener('mouseup', (e) => {
            this.drawing = false;
        });

        document.getElementById('map-canvas').addEventListener('touchstart', (e) => {
            var touch = e.touches[0];
            this.touchStart(touch.clientX, touch.clientY);
            e.preventDefault();
        });
        document.getElementById('map-canvas').addEventListener('touchmove', (e) => {
            var touch = e.touches[0];
            this.touch(touch.clientX, touch.clientY);
            e.preventDefault();
        });
        
    };

    this.getTouchPos = function(clientX, clientY) {
        var ratio = INIT_SIZE / this.currentWidth; // TODO: Only works when map width = height
        var rect = document.getElementById('map-canvas').getBoundingClientRect();
        var mx = clientX - rect.left;
        var my = clientY - rect.top;
        var x = Math.floor(mx * ratio) - 1;
        var y = Math.floor(my * ratio) - 1;
        return {'x': x, 'y': y};
    };

    this.touchStart = function(clientX, clientY) {
        var pos = this.getTouchPos(clientX, clientY);
        if (this.puzzle.getTile(pos.x, pos.y) == 0) {
            this.selectedTool = 1;
        } else if (this.puzzle.getTile(pos.x, pos.y) == 1) {
            this.selectedTool = 0;
        }
        this.touch(clientX, clientY);

    };

    this.touch = function(clientX, clientY) {
        var ratio = INIT_SIZE / this.currentWidth; // TODO: Only works when map width = height
        var rect = document.getElementById('map-canvas').getBoundingClientRect();
        var mx = clientX - rect.left;
        var my = clientY - rect.top;
        var x = Math.floor(mx * ratio) - 1;
        var y = Math.floor(my * ratio) - 1;
        if ((this.puzzle.getTile(x, y) == 0
                || this.puzzle.getTile(x, y) == 1)
                && this.isDeadEnd(x, y) == false) {
            this.puzzle.setTile(x, y, this.selectedTool);
        }
        this.render();
    }

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
        var cols = this.puzzle.colHints;
        var rows = this.puzzle.rowHints;
        
        for (var i=0; i<cols.length; i++) {
            ctx.translate(TILE_SIZE, 0);
            this._drawHint(cols[i], this.puzzle.getColHintStatus(i));
        }
        ctx.setTransform();
        for (var i=0; i<rows.length; i++) {
            ctx.translate(0, TILE_SIZE);
            this._drawHint(rows[i], this.puzzle.getRowHintStatus(i));
        }
        ctx.setTransform();
    };

    this._drawHint = function(value, status) {
        const BPADDING = TILE_SIZE/6;
        const LPADDING = TILE_SIZE/4;
        const BELOW_COLOR = "rgb(0,0,0)";
        const EQUAL_COLOR = "rgb(128,128,128)";
        const ABOVE_COLOR = "rgb(255,0,0)";
        ctx.font = TILE_SIZE + "px Monospace";
        if (status < 0) {
            ctx.fillStyle = BELOW_COLOR;
        } else if (status == 0) {
            ctx.fillStyle = EQUAL_COLOR;
        } else {
            ctx.fillStyle = ABOVE_COLOR;
        }
        ctx.fillText(value, LPADDING, TILE_SIZE - BPADDING);
    }

    this._drawMap = function() {
        for (let x=0; x<this.puzzle.width; x++) {
            for (let y=0; y<this.puzzle.height; y++) {
                let tile = this.puzzle.getTile(x,y);
                let style = "rgb(0,0,0)";
                let tf = ctx.getTransform();
                ctx.translate(x*TILE_SIZE, y*TILE_SIZE);
                if (tile == 0) {
                    ctx.drawImage(document.getElementById('img_tiles'), 0, 0, TILE_SIZE, TILE_SIZE);
                } else if (tile == 1) {
                    this._drawWallTile(x,y);
                } else if (tile == 2) {
                    ctx.drawImage(document.getElementById('img_treasure'), 0, 0, TILE_SIZE, TILE_SIZE);
                }
                 
                // Draw grid
                // ctx.beginPath();
                // ctx.strokeStyle="rgb(128,128,128)";
                // ctx.rect(0, 0, TILE_SIZE, TILE_SIZE);
                // ctx.stroke();
                ctx.setTransform(tf);
            }
        }
    };

    this._drawWallTile = function(x, y) {
        const LEFT = 8;
        const RIGHT = 4;
        const TOP = 2;
        const BOTTOM = 1;
        const WALL = 1;
        var tilemapPos = 0;

        if (this.puzzle.getTile(x+1,y) == WALL) {
            tilemapPos |= RIGHT;
        }
        if (this.puzzle.getTile(x-1,y) == WALL) {
            tilemapPos |= LEFT;
        }
        if (this.puzzle.getTile(x,y+1) == WALL) {
            tilemapPos |= BOTTOM;
        }
        if (this.puzzle.getTile(x,y-1) == WALL) {
            tilemapPos |= TOP;
        }

        var tilemapX = tilemapPos % 4 * TILE_SIZE;
        var tilemapY = Math.trunc(tilemapPos / 4) * TILE_SIZE;
        ctx.drawImage(document.getElementById('img_wallmap'), tilemapX, tilemapY, TILE_SIZE, TILE_SIZE,
                                                            0, 0, TILE_SIZE, TILE_SIZE);

/*
[left][right][top][bottom]
0000 = o
0001 = n
0010 = U
0011 = ||

0100 = [
0101 = |'
0110 = |_
0111 = |X

1000 = ]
1001 = '|
1010 = _|
1011 = X|

1100 = =
1101 = '
1110 = _
1111 = X
*/
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

    this.isDeadEnd = function(x, y) {
        let deadEnds = this.puzzle.deadEnds;
        for (var i=0; i<deadEnds.length; i+=2) {
            var dex = deadEnds[i];
            var dey = deadEnds[i+1];
            if (dex == x && dey == y) {
                return true;
            }
        }
        return false;
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
