let App = function() {
    this.map = new Map(8, 8);
    this.selected = 1;
    this.showWalls = true;
    this.drawing = false;
    this.validator = new Validator();
    const TILE_SIZE=64;
    const OFFSET_TOP = TILE_SIZE;
    const OFFSET_LEFT = TILE_SIZE;

    this.init = function() {

        this.clearMap();
        this.decode("14051041555540014555454146455004");
        this.validate();
        const canvas = document.getElementById("map-canvas");
        canvas.addEventListener("mousedown", (e) => {
            var x = Math.floor((e.offsetX - OFFSET_LEFT) / TILE_SIZE);
            var y = Math.floor((e.offsetY - OFFSET_TOP) / TILE_SIZE);
            this.drawing = true;
            this.updateMap(x, y);
        });

        window.addEventListener("mouseup", (e) => {this.drawing = false;});

        canvas.addEventListener("mousemove", (e) => {
            if (this.drawing) {
                var x = Math.floor((e.offsetX - OFFSET_LEFT) / TILE_SIZE);
                var y = Math.floor((e.offsetY - OFFSET_TOP) / TILE_SIZE);
                this.updateMap(x, y);
            }
        });

        document.getElementById("tool_0").addEventListener("click", (e) => { this.selected = 0; });
        document.getElementById("tool_1").addEventListener("click", (e) => { this.selected = 1; });
        document.getElementById("tool_2").addEventListener("click", (e) => { this.selected = 2; });

        document.getElementById("toggle_walls").addEventListener("click", (e) => {
            this.showWalls = !this.showWalls;
            this.draw();
        })
    };

    this.clearMap = function() {
        this.map.clear();
    };

    this.updateMap = function(x, y) {
        if (x >= 0 && y >= 0 && x < this.map.width && y < this.map.height) {
            this.map.setTile(x, y, this.selected);
            this.draw();
            this.encode();
            this.validate();
        }
    };

    this.draw = function() {
        const canvas = document.getElementById("map-canvas");
        if (canvas.getContext) {
            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "rgb(255,255,255)";
            ctx.fillRect(0,0,TILE_SIZE*this.map.width + OFFSET_LEFT, TILE_SIZE*this.map.height + OFFSET_TOP);

            this.drawTiles(ctx);
            this.drawDeadEnds(ctx);

            // Draw border
            ctx.fillStyle = "rgb(0,0,0)";
            ctx.beginPath();
            ctx.moveTo(OFFSET_LEFT, TILE_SIZE*this.map.height + OFFSET_TOP);
            ctx.lineTo(OFFSET_LEFT, OFFSET_TOP);
            ctx.lineTo(TILE_SIZE*this.map.width + OFFSET_LEFT, OFFSET_TOP);
            ctx.stroke();
            
            this.drawClues(ctx);
            
        }
    };

    this.drawClues = function(ctx) {
        ctx.font = TILE_SIZE + "px Monospace";
        ctx.fillStyle = "rgb(0,0,0)";
        const BPADDING = TILE_SIZE/6;
        const LPADDING = TILE_SIZE/4;
        var clues = this.map.getClues();
        for (x=0; x<clues.cols.length; x++) {
            ctx.fillText(clues.cols[x], x*TILE_SIZE + OFFSET_LEFT + LPADDING, OFFSET_TOP - BPADDING);
        }
        for (y=0; y<clues.rows.length; y++) {
            ctx.fillText(clues.rows[y], LPADDING, y*TILE_SIZE + OFFSET_TOP*2 - BPADDING);
        }
    }

    this.drawTiles = function(ctx) {
        for (let x=0; x<this.map.width; x++) {
            for (let y=0; y<this.map.height; y++) {
                let tile = this.map.getTile(x,y);
                let style = "rgb(0,0,0)";
                if (tile == 0 && this.showWalls == false) {
                    style = "rgb(255,255,255)";
                } else if (tile == 1) {
                    style = "rgb(255,255,255)";
                } else if (tile == 2) {
                    style = "rgb(255,255,0)";
                }
                ctx.fillStyle = style;
                ctx.fillRect(x*TILE_SIZE + OFFSET_LEFT, y*TILE_SIZE + OFFSET_TOP,
                                TILE_SIZE, TILE_SIZE);
                // Draw grid
                ctx.beginPath();
                ctx.strokeStyle="rgb(128,128,128)";
                ctx.rect(x*TILE_SIZE + OFFSET_LEFT, y*TILE_SIZE + OFFSET_TOP,
                    TILE_SIZE, TILE_SIZE);
                ctx.stroke();
            }
        }
    }

    this.drawDeadEnds = function(ctx) {
        let deadEnds = this.map.getDeadEnds();
        for (var i=0; i<deadEnds.length; i++) {
            ctx.fillStyle = "rgb(255,0,0)";
            var x = deadEnds[i].x;
            var y = deadEnds[i].y;
            ctx.beginPath();
            ctx.arc(x * TILE_SIZE + TILE_SIZE / 2 + OFFSET_LEFT, y*TILE_SIZE + TILE_SIZE / 2 + OFFSET_TOP, TILE_SIZE/2, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    this.decode = function(mapCode) {
        this.map.decodeSolution(mapCode)
    };

    this.encode = function() {
        var puzzleCode = this.map.encodePuzzle();
        document.getElementById("code").innerHTML = "<p>" +  this.map.encodeSolution() + "</p>" +
                `<p><a href="https://cronomst.github.io/?puzzle=${puzzleCode}">${puzzleCode}</a></p>`;
    };

    this.validate = function() {
        let result = this.validator.validate(this.map);
        let valid = result.continguous && result.treasure && result.hallWidth;
        let out = result.continguous == false ? "<p>One or more tiles cannot be reached.</p>" : "";
        out += result.treasure == false ? "<p>A treasure is not within a 3x3 room with exactly one exit and one treasure.</p>" : "";
        out += result.hallWidth == false ? "<p>A corridor is wider than 1 tile.</p>" : "";

        if (valid === false) {
            document.getElementById("code").innerHTML = out;
        } else {
            this.encode();
        }
    }

}

let app = new App();
app.init();
app.draw();