let Game = function() {
    const TILE_SIZE = 16;
    const INIT_SIZE = 10;
    const TOOL_WALL = 0;
    const TOOL_EMPTY = 1;
    const TOOL_MARKER = 2;
    const MONSTER_TYPES = 4;
    const COLOR2 = "rgb(151,198,117)";
    const COLOR3 = "rgb(82,122,52)";
    const ctx = document.getElementById('map-canvas').getContext('2d');

    this.currentWidth = 1;
    this.currentHeight = 1;
    this.puzzle = null;
    this.validator = new Validator();

    this.selectedTool = 0;
    this.toolMode = 0; // 0 = Wall, 1 = Marker
    this.drawing = false;
    this.solved = false;

    this.undoStack = [];
    this.redoStack = [];


    this.init = function() {
        ctx.canvas.width = TILE_SIZE * INIT_SIZE;
        ctx.canvas.height = TILE_SIZE * INIT_SIZE;

        this.puzzle = new Puzzle();
        this.puzzle.clear();
        this.readDataFromUrl();

        window.addEventListener('resize', () => {
            this.resize();
            this.render();
        });

        document.getElementById('map-canvas').addEventListener('mousedown', (e) => {
            this.pushUndoRedo(false);
            this.redoStack = [];

            var pos = this.getTouchPos(e.clientX, e.clientY);
            if (e.button == 0) {
                if (this.puzzle.getTile(pos.x, pos.y) == 0) {
                    this.selectedTool = TOOL_EMPTY;
                } else if (this.puzzle.getTile(pos.x, pos.y) == 1) {
                    this.selectedTool = TOOL_WALL;
                } 
            } else if (e.button == 2) {
                if (this.puzzle.getMarked(pos.x, pos.y) == true) {
                    this.selectedTool = TOOL_EMPTY;
                } else {
                    this.selectedTool = TOOL_MARKER;
                } 
            }
            this.touch(e.clientX, e.clientY);
            this.drawing = true;
            e.preventDefault();
        });
        document.getElementById('map-canvas').addEventListener('mousemove', (e) => {
            if (this.drawing) {
                this.touch(e.clientX, e.clientY);
            }
        });
        document.getElementById('map-canvas').addEventListener('mouseup', (e) => {
            this.drawing = false;
            e.preventDefault();
        });
        document.getElementById('map-canvas').addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        document.getElementById('map-canvas').addEventListener('touchstart', (e) => {
            this.pushUndoRedo(false);
            this.redoStack = [];

            var touch = e.touches[0];
            this.touchStart(touch.clientX, touch.clientY);
            e.preventDefault();
        });
        document.getElementById('map-canvas').addEventListener('touchmove', (e) => {
            var touch = e.touches[0];
            this.touch(touch.clientX, touch.clientY);
            e.preventDefault();
        });
        document.getElementById('undo').addEventListener('mousedown', (e) => { this.undo(); e.target.classList.add('clicked');});
        document.getElementById('undo').addEventListener('mouseup', (e) => { e.target.classList.remove('clicked');});
        document.getElementById('undo').addEventListener('touchstart', (e) => { this.undo(); e.target.classList.add('clicked'); e.preventDefault();});
        document.getElementById('undo').addEventListener('touchend', (e) => { e.target.classList.remove('clicked');});
        document.getElementById('redo').addEventListener('mousedown', (e) => { this.redo(); e.target.classList.add('clicked');});
        document.getElementById('redo').addEventListener('mouseup', (e) => { e.target.classList.remove('clicked');});
        document.getElementById('redo').addEventListener('touchstart', (e) => { this.redo(); e.target.classList.add('clicked'); e.preventDefault();});
        document.getElementById('redo').addEventListener('touchend', (e) => { e.target.classList.remove('clicked');});
        document.getElementById('tool_mode').addEventListener('mousedown', (e) => { this._toggleToolMode(); e.target.classList.add('clicked');});
        document.getElementById('tool_mode').addEventListener('mouseup', (e) => { e.target.classList.remove('clicked');});
        document.getElementById('tool_mode').addEventListener('touchstart', (e) => { this._toggleToolMode(); e.target.classList.add('clicked'); e.preventDefault(); });
        document.getElementById('tool_mode').addEventListener('touchend', (e) => { e.target.classList.remove('clicked');});

        document.addEventListener('keydown',  (e) => {
            var key = e.key.toUpperCase();
            if (e.ctrlKey && e.shiftKey == false && key == 'Z') {
                this.undo();
            } else if ((e.ctrlKey && e.shiftKey && key == 'Z')
                   || (e.ctrlKey && key == 'Y')) {
                this.redo();
            }
        });

        // ====
        // TODO: Handle this in a more controllable way
        var game = this;
        setInterval(function() {game.render();}, 500);
        // ====
        
    };

    this._toggleToolMode = function() {
        if (this.toolMode == 0) {
            this.toolMode = 1;
        } else {
            this.toolMode = 0;
        }
        this.render();
    };

    this.readDataFromUrl = function() {
        var url = new URL(window.location.href);
        var puzzleData = url.searchParams.get("puzzle");
        var puzzleName = url.searchParams.get("name");
        if (puzzleName) {
            this.puzzle.name = puzzleName;
        }
        document.getElementById('puzzle_name').innerText =this.puzzle.name;
        if (puzzleData) {
            this.puzzle.decodePuzzle(puzzleData);
        } else {
            this.puzzle.decodePuzzle('C24343631.R45061325.M170200410600670.T36.');
        }
    }

    this.getTouchPos = function(clientX, clientY) {
        var ratio = (this.puzzle.width + 2) / this.currentWidth;
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
            this.selectedTool = TOOL_EMPTY;
        } else if (this.puzzle.getMarked(pos.x, pos.y) == true) {
            if (this.toolMode == 0) {
                this.selectedTool = TOOL_WALL;
            } else {
                this.selectedTool = TOOL_EMPTY;
            }
        } else if (this.puzzle.getTile(pos.x, pos.y) == 1) {
            if (this.toolMode == 0) {
                this.selectedTool = TOOL_WALL;
            } else {
                this.selectedTool = TOOL_MARKER;
            }
        } 
        this.touch(clientX, clientY);
    };

    this.touch = function(clientX, clientY) {
        if (this.solved == true) {
            return;
        }
        var pos = this.getTouchPos(clientX, clientY);
        var x = pos.x;
        var y = pos.y;

        var currentTile = this.puzzle.getTile(x, y);

        if (this.isDeadEnd(x, y) == false) {
            if ((this.selectedTool == TOOL_WALL || this.selectedTool == TOOL_EMPTY)
                    && (currentTile == 0 || currentTile == 1)) {
                this.puzzle.setTile(x, y, this.selectedTool);
                this.puzzle.setMarked(x, y, false);
            } else if (this.selectedTool == TOOL_MARKER && currentTile == 1) {
                this.puzzle.setTile(x, y, 1);
                this.puzzle.setMarked(x, y, true);
            }
        }
        this.render();
        this.checkIfSolved();
    }

    this.render = function() {
        ctx.fillStyle = COLOR2;
        ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
    
        if (this.puzzle != null) {
            if (this.solved == false) {
                this._drawColAndRowHints();
            }
            ctx.translate(TILE_SIZE, TILE_SIZE);
            this._drawMap();
            this._drawDeadEnds();
            if (this.solved == false) {
                this._drawGrid();
            }
            ctx.setTransform();
            this._drawToolMode();
        }
    };

    this._drawToolMode = function() {
        // Don't draw this if solved or in desktop mode (determined based on whether the mobile controls are displayed. There's probably a nicer way to do this)
        if (this.solved == true || window.getComputedStyle(document.getElementById('controls'), null).display == 'none') {
            return;
        }

        const BPADDING = TILE_SIZE/6;
        const LPADDING = TILE_SIZE/4;
        const TS2 = TILE_SIZE*2;

        ctx.translate(ctx.canvas.width/2 - TILE_SIZE, ctx.canvas.height - TILE_SIZE);
        // ctx.fillStyle = COLOR3;
        // ctx.fillText('A-', -(TILE_SIZE*1.5) + LPADDING, TILE_SIZE - BPADDING);
        
        if (this.toolMode == 0) {
            ctx.drawImage(document.getElementById('img_mode'), 0, 0, TS2, TILE_SIZE,
                                                               0, 0, TS2, TILE_SIZE);
        } else {
            ctx.drawImage(document.getElementById('img_mode'), TS2, 0, TS2, TILE_SIZE,
                                                               0, 0, TS2, TILE_SIZE);
        }
        ctx.setTransform();
    };

    this._drawColAndRowHints = function() {
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
        const NUM_WIDTH = TILE_SIZE/2;
        const NUM_HEIGHT = TILE_SIZE;

        var style = 0;
        var ones = value % 10;
        var tens = Math.floor(value / 10);

        if (status == 0) {
            style = 1;
        } else if (status > 0) {
            style = 2;
        }
        if (tens == 0) {
            ctx.drawImage(document.getElementById('img_numbermap'), ones * NUM_WIDTH, NUM_HEIGHT * style, NUM_WIDTH, NUM_HEIGHT,
                                                               NUM_WIDTH/2, 0, NUM_WIDTH, NUM_HEIGHT);
        } else {
            ctx.drawImage(document.getElementById('img_numbermap'), tens * NUM_WIDTH, NUM_HEIGHT * style, NUM_WIDTH, NUM_HEIGHT,
                                                               0, 0, NUM_WIDTH, NUM_HEIGHT);
            ctx.drawImage(document.getElementById('img_numbermap'), ones * NUM_WIDTH, NUM_HEIGHT * style, NUM_WIDTH, NUM_HEIGHT,
                                                               NUM_WIDTH, 0, NUM_WIDTH, NUM_HEIGHT);
        }
    };

    this._drawMap = function() {
        let startx = 0;
        let endx = this.puzzle.width;
        let starty = 0;
        let endy = this.puzzle.height;
        // Once solved, this will turn the puzzle border into regular wall tiles
        if (this.solved) {
            startx--;
            starty--;
            endx++;
            endy++;
        }
        for (let x=startx; x<endx; x++) {
            for (let y=starty; y<endy; y++) {
                let tile = this.puzzle.getTile(x,y);
                let style = "rgb(0,0,0)";
                let tf = ctx.getTransform();
                ctx.translate(x*TILE_SIZE, y*TILE_SIZE);
                if (tile == 1) {
                    ctx.drawImage(document.getElementById('img_tiles'), 0, 0, TILE_SIZE, TILE_SIZE);
                } else if (tile == 0) {
                    this._drawWallTile(x,y);
                } else if (tile == 2) {
                    ctx.drawImage(document.getElementById('img_treasure'), 0, 0, TILE_SIZE, TILE_SIZE);
                }

                // Draw markers
                if (this.puzzle.getMarked(x,y) == true && this.solved == false) {
                    ctx.drawImage(document.getElementById('img_marker'), 0, 0, TILE_SIZE, TILE_SIZE);
                }
                ctx.setTransform(tf);
            }
        }
    };

    this._drawGrid = function() {
        for (let x=0; x<this.puzzle.width; x++) {
            for (let y=0; y<this.puzzle.height; y++) {
                let tf = ctx.getTransform();
                ctx.translate(x*TILE_SIZE, y*TILE_SIZE);
                // Draw grid
                ctx.strokeStyle=COLOR2;
                ctx.strokeRect(0.5, 0.5, TILE_SIZE, TILE_SIZE);
                ctx.setTransform(tf);
            }
        }
    };

    this._drawWallTile = function(x, y) {
        const LEFT = 8;
        const RIGHT = 4;
        const TOP = 2;
        const BOTTOM = 1;
        const WALL = 0;
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
        for (var i=0; i<deadEnds.length; i+=3) {
            var x = deadEnds[i];
            var y = deadEnds[i+1];
            var type = deadEnds[i+2];
            var frame = 0;
            if (type < 0 || type > MONSTER_TYPES) {
                type = 0;
            }
            var tf = ctx.getTransform();
            ctx.translate(x*TILE_SIZE, y*TILE_SIZE);
            if (Math.floor(Date.now() / 500) % 2 == 0) {
                frame = 1;
            }
            ctx.drawImage(document.getElementById('img_monster'), frame*TILE_SIZE, type*TILE_SIZE, TILE_SIZE, TILE_SIZE,
                                                            0, 0, TILE_SIZE, TILE_SIZE);
            ctx.setTransform(tf);
        }
    };

    this.isDeadEnd = function(x, y) {
        let deadEnds = this.puzzle.deadEnds;
        for (var i=0; i<deadEnds.length; i+=3) {
            var dex = deadEnds[i];
            var dey = deadEnds[i+1];
            if (dex == x && dey == y) {
                return true;
            }
        }
        return false;
    };

    this.undo = function() {
        if (this.solved == true) {
            return;
        }
        if (this.undoStack.length > 0) {
            var mapdata = this.undoStack.pop();
            this.pushUndoRedo(true);
            this.undoToMap(mapdata);
            this.render();
        }
    };

    this.redo = function() {
        if (this.solved == true) {
            return;
        }
        if (this.redoStack.length > 0) {
            var mapdata = this.redoStack.pop();
            this.pushUndoRedo(false);
            this.undoToMap(mapdata);
            this.render();
        }
    };

    /**
     * Convert map data from undo/redo stacks to tile/marker data for puzzle
     * @param {Array} mapdata 
     */
    this.undoToMap = function(mapdata) {
        for (var i=0; i<mapdata.length; i++) {
            if (mapdata[i] == 9) {
                this.puzzle.tiles[i] = 1;
                this.puzzle.marked[i] = true;
            } else {
                this.puzzle.tiles[i] = mapdata[i];
                this.puzzle.marked[i] = false;
            }
        }
    };

    /**
     * Push the current map data to either to undo or redo stack
     * @param {boolean} updateRedo 
     */
    this.pushUndoRedo = function(updateRedo=false) {
        var mapdata = [];
        for (var i=0; i<this.puzzle.tiles.length; i++) {
            if (this.puzzle.marked[i] == true) {
                mapdata.push(9);
            } else {
                mapdata.push(this.puzzle.tiles[i]);
            }
        };
        if (updateRedo) {
            this.redoStack.push(mapdata);
        } else {
            this.undoStack.push(mapdata);
        }
    };

    this.checkIfSolved = function() {
        if (this.validator.validateSolution(this.puzzle)) {
            this.solved = true;
            navigator.vibrate([100, 50, 100, 50, 200]);
        }
    };

    this.resize = function() {
        const MAX_CANVAS_WIDTH = 1440;
        const MAX_CANVAS_HEIGHT = Math.floor(window.innerHeight/2);
        nWidth = TILE_SIZE * (this.puzzle.width+2)
        nHeight = TILE_SIZE * (this.puzzle.height+2);
        cWidth = window.innerWidth;
        cHeight = window.innerHeight;

        ctx.canvas.width = nWidth;
        ctx.canvas.height = nHeight;

        // ratio of the native game size width to height
        const nativeRatio = nWidth / nHeight;
        const browserWindowRatio = cWidth / cHeight;

        // browser window is wider
        if (browserWindowRatio > nativeRatio) {
            cWidth = Math.floor(cHeight * nativeRatio);
        } else {
            // browser window is taller
            cHeight = Math.floor(cWidth / nativeRatio);
        }

        if (cWidth > MAX_CANVAS_WIDTH) {
            cWidth = MAX_CANVAS_WIDTH;
            cHeight = Math.floor(cWidth / nativeRatio);
        }

        if (cHeight > MAX_CANVAS_HEIGHT) {
            cHeight = MAX_CANVAS_HEIGHT;
            cWidth = Math.floor(cHeight * nativeRatio);
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
