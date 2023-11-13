let Puzzle = function(map = new Map(8,8)) {
    this.__proto__ = map;
    this.rowHints = [];
    this.colHints = [];
    this.deadEnds = []; // array of triples containing x,y,monster_type
    this.treasures = []; // array of doubles containging x,y
    this.marked = [];
    this.name = 'Nameless Depths';

    const MAX_MAP_SIZE = 16;

    this.decodePuzzle = function(code) {
        const TREASURE = 2;
        var pos = 0;
        while (pos < code.length) {
            var c = code.charAt(pos);
            switch (c) {
                case 'C':
                case 'R':
                case 'M':
                case 'T':
                    pos = this._parseHints(c, code, pos+1);
                    break;
                default:
                    // Invalid code
                    pos = code.length;
            }
        }

        
        if (this.width > 0 && this.height > 0) {
            this.clear();
            this.marked = Array(this.width * this.height).fill(0);
            // Set treasure tiles on map
            for (var i=0; i<this.treasures.length; i+=2) {
                this.setTile(this.treasures[i], this.treasures[i+1], TREASURE);
            }
        }
    };

    this._parseHints = function(type, code, pos) {
        var hints = [];
        var char = code.charAt(pos);
        while (char != '.') {
            hints.push(parseInt(char, MAX_MAP_SIZE));
            pos++;
            char = code.charAt(pos);
        }

        if (type == 'C') {
            this.colHints = hints;
            this.width = hints.length;
        } else if (type == 'R') {
            this.rowHints = hints;
            this.height = hints.length;
        } else if (type == 'M') {
            this.deadEnds = hints;
        } else if (type == 'T') {
            this.treasures = hints;
        }
        return pos+1;
    }

    this.getRowHintStatus = function(row) {
        return this._getHintStatus(row, true);

    };
    this.getColHintStatus = function(col) {
        return this._getHintStatus(col, false);
    };
    this._getHintStatus = function(n, isRow) {
        const WALL = 0;
        var max;
        var hints;
        if (isRow) {
            max = this.height;
            hints = this.rowHints;
        } else {
            max = this.width;
            hints = this.colHints;
        }
        var target = hints[n];
        var total = 0;

        for (var i=0; i<max; i++) {
            var tileVal;
            if (isRow) {
                tileVal = this.getTile(i, n);
            } else {
                tileVal = this.getTile(n, i);
            }
            if (tileVal == WALL) {
                total++;
            }
        }

        return total - target;
    };

    this.getMarked = function(x, y) {
        if (x<0 || x>=this.width || y<0 || y>=this.height) {
            return 0;
        }
        return this.marked[this.getPos(x,y)];
    };

    this.setMarked = function(x, y, val) {
        if (x<0 || x>=this.width || y<0 || y>=this.height) {
            return;
        }
        this.marked[this.getPos(x,y)] = val;
    }


}