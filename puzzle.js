let Puzzle = function(map = new Map(8,8)) {
    this.__proto__ = map;
    this.rowHints = [];
    this.colHints = [];
    this.deadEnds = [];
    this.treasures = [];

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

        // Set treasure tiles on map
        if (this.width > 0 && this.height > 0) {
            this.clear();
            for (var i=0; i<this.treasures.length; i+=2) {
                this.setTile(this.treasures[i], this.treasures[i+1], TREASURE);
            }
        }
    };

    this._parseHints = function(type, code, pos) {
        var hints = [];
        var char = code.charAt(pos);
        do {
            hints.push(parseInt(char, MAX_MAP_SIZE));
            pos++;
            char = code.charAt(pos);
        } while (char != '.');

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


}