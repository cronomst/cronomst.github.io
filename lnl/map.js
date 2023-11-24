let Map = function(w, h) {
    this.width = w;
    this.height = h;
    this.tiles = [];

    this.getTile = function(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) { 
            return 0;
        }
        return this.tiles[y*this.width + x];
    };
    
    this.setTile = function(x, y, value) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) { 
            return;
        }
        this.tiles[y*this.width + x] = value;
    };

    this.getPos = function(x, y) {
        return y * this.width + x;
    }

    this.clear = function() {
        this.tiles = Array(this.width * this.height).fill(1);
    }

    this.decodeSolution = function(mapCode) {
        //14051041555540014555454146455004
        for (var i=0; i<mapCode.length; i++) {
            var parts = parseInt(mapCode.substr(i, 1), 16);
            var part1 = parts >> 2;
            var part2 = 3 & parts;
            this.tiles[i*2] = part1;
            this.tiles[i*2+1] = part2;
        }
    };

    this.encodeSolution = function() {
        var out = '';
        var tcount = this.width * this.height;
        for (var i=0; i<tcount; i+=2) {
            var part = this.tiles[i] << 2 | this.tiles[i+1];
            out += part.toString(16);
        }
        return out;
    };

    this.encodePuzzle = function() {
        const MAX_MAP_SIZE = 16;
        var out = '';
        var clues = this.getClues();
        out += 'C' + clues.cols.map((val) => val.toString(MAX_MAP_SIZE)).join('') + '.';
        out += 'R' + clues.rows.map((val) => val.toString(MAX_MAP_SIZE)).join('') + '.';

        out += 'M';
        this.getDeadEnds().forEach((de) => {
            out += de.x.toString(MAX_MAP_SIZE);
            out += de.y.toString(MAX_MAP_SIZE);
            out += '0'; //Placeholder for monster type
        });
        out += '.';

        out += 'T';
        this.getTreasures().forEach((t) => {
            out += t.x.toString(MAX_MAP_SIZE);
            out += t.y.toString(MAX_MAP_SIZE);
        });
        out += '.';
        
        return out;
    }

    this.getClues = function() {
        var rows = Array(this.height).fill(0);
        var cols = Array(this.width).fill(0);

        for (var x=0; x<this.width; x++) {
            for (var y=0; y<this.height; y++) {
                if (this.getTile(x, y) == 0) {
                    rows[y]++;
                    cols[x]++;
                }
            }
        }

        return {
            "cols": cols,
            "rows": rows
        }
    }

    this.getDeadEnds = function() {
        let deadEnds = [];
        for (var x=0; x<this.width; x++) {
            for (var y=0; y<this.height; y++) {
                if (this._isDeadEnd(x,y)) {
                    deadEnds.push({"x": x, "y": y});
                }
            }
        }
        return deadEnds;
    }

    this._isDeadEnd = function(x, y) {
        const WALL = 0;
        const EMPTY = 1;
        let count = 0;
        if (this.getTile(x,y) == EMPTY) {
            if (this.getTile(x-1, y) == WALL) {
                count++;
            }
            if (this.getTile(x+1, y) == WALL) {
                count++;
            }
            if (this.getTile(x, y-1) == WALL) {
                count++;
            }
            if (this.getTile(x,y+1) == WALL) {
                count++;
            }
        }
        return count == 3;
    }

    this.getTreasures = function() {
        const TREASURE = 2;
        let treasures = [];
        for (var x=0; x<this.width; x++) {
            for (var y=0; y<this.height; y++) {
                if (this.getTile(x,y) == TREASURE) {
                    treasures.push({"x": x, "y": y});
                }
            }
        }
        return treasures;
    }

}