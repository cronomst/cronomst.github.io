let Validator = function() {

    const FLAGGED = 9;
    const WALL = 0;
    const EMPTY = 1;
    const TREASURE = 2;
    this.validate = function(map) {
        var contiguous = this.isContiguous(map);
        var mapCopy = this.createValidationCopy(map);
        var treasure = this.isTreasureValid(map, mapCopy);
        var hallWidth = this.isHallWidthValid(map, mapCopy);

        return {
            "contiguous": contiguous,
            "treasure": treasure,
            "hallWidth": hallWidth
        };
    };

    this.validateSolution = function(puzzle) {
        var valdata = this.validate(puzzle);
        var deadEnds = this._validateSolutionDeadEnds(puzzle);
        var hints = this._validateSolutionRowColHints(puzzle);
        return valdata.contiguous && valdata.treasure && valdata.hallWidth && deadEnds && hints;
    };

    this._validateSolutionDeadEnds = function(puzzle) {
        var actualDeadEnds = puzzle.getDeadEnds();
        var puzzleDeadEnds = this._normalizeDeadEnds(puzzle.deadEnds);
        
        if (actualDeadEnds.length != puzzleDeadEnds.length) {
            return false;
        }
        
        for (var i=0; i<actualDeadEnds.length; i++) {
            if (puzzleDeadEnds.some(e => e.x == actualDeadEnds[i].x && e.y == actualDeadEnds[i].y) == false) {
                return false;
            }
        }
        return true;
    };

    this._normalizeDeadEnds = function(puzzleDeadEnds) {
        var out = [];
        for (var i=0; i<puzzleDeadEnds.length; i+=3) {
            out.push({'x': puzzleDeadEnds[i], 'y': puzzleDeadEnds[i+1]});
        }
        return out;
    };
    
    this._validateSolutionRowColHints = function(puzzle) {
        for (var i=0; i<puzzle.height; i++) {
            if (puzzle.getRowHintStatus(i) !== 0) {
                return false;
            }
        }
        for (var i=0; i<puzzle.width; i++) {
            if (puzzle.getColHintStatus(i) !== 0) {
                return false;
            }
        }
        return true;
    };

    /**
     * Find the index of an empty tile
     * @param {int[]} map 
     * @returns index of the first empty tile. If no tiles are empty, returns -1
     */
    this.findEmptyTile = function(map) {
        const EMPTY_TILE = 1;
        for (var i=0; i<map.tiles.length; i++) {
            if (map.tiles[i] == EMPTY_TILE) {
                return i;
            }
        }
        return -1;
    };

    /**
     * Create a copy of the map's tile array containing only walls and empty tiles
     * to be used for validation. Treasures are treated as empty for the purpose
     * of the flood fill test.
     * 
     * @param {Map} map 
     * @returns Array
     */
    this.createValidationCopy = function(map) {
        return map.tiles.map((tile) => tile == WALL ? WALL : EMPTY);
    };

    /**
     * Determines whether the given map is fully connected. If there
     * are any empty tile "island" this will return false.
     * 
     * @param {Map} map 
     * @returns 
     */
    this.isContiguous = function(map) {
        var start = this.findEmptyTile(map);
        // Create a copy of the map containing only walls
        var mapCopy = this.createValidationCopy(map);
        // Flood fill map copy
        this._floodFill(map, mapCopy, start);
        // Check if any tiles are still empty
        return this._isFilled(map, mapCopy);
    };

    /**
     * Flood fill empty tiles starting from pos
     * 
     * @param {Map} map 
     * @param {array} mapCopy 
     * @param {int} pos 
     */
    this._floodFill = function(map, mapCopy, pos) {
        if (mapCopy[pos] == 1) {
            mapCopy[pos] = FLAGGED;
            let x = pos % map.width;
            let y = Math.trunc(pos / map.width);
            if (x - 1 >= 0) {
                this._floodFill(map, mapCopy, pos-1);
            }
            if (x + 1 < map.width) {
                this._floodFill(map, mapCopy, pos+1);
            }
            if (y - 1 >= 0) {
                this._floodFill(map, mapCopy, pos-map.width);
            }
            if (y + 1 < map.height) {
                this._floodFill(map, mapCopy, pos+map.width);
            }
        }
    };

    /**
     * Check if any tiles in mapCopy have not been filled by the _floodFill method
     * 
     * @param {Map} map 
     * @param {array} mapCopy 
     * @returns 
     */
    this._isFilled = function(map, mapCopy) {
        for (var i=0; i<mapCopy.length; i++) {
            if (mapCopy[i] == EMPTY) {
                return false;
            }
        }
        return true;
    };

    this._getTreasures = function(map) {
        let treasures = [];
        for (var i=0; i<map.tiles.length; i++) {
            if (map.tiles[i] == TREASURE) {
                treasures.push(i);
            }
        }
        return treasures;
    };

    /**
     * Checks if all treasures are in correctly defined treasure rooms.
     * Assumes that contiguous check has already passed
     * 
     * @param {Map} map 
     * @param {array} mapCopy 
     */
    this.isTreasureValid = function(map, mapCopy) {
        let treasures = this._getTreasures(map);
        // For each treasure
        for (var t=0; t<treasures.length; t++) {
            var tpos = treasures[t];
            // Search for 3x3 square of EMPTY tiles around treasure
            var corner = this._getEmptyThreeByThree(map, tpos);
            // If not found, then it's invalid
            if (corner == -1) {
                return false;
            }
            // Count number of walls on border
            // If number of walls != 11, then it's invalid
            if (this._getTreasureWallCount(map, corner.top, corner.left) != 11) {
                return false;
            }
            // Flag 3x3 on mapCopy as treasure tiles
            this._flagTreasureRoom(map, mapCopy, corner.top, corner.left);
        }

        return true;
    };

    this._getEmptyThreeByThree = function(map, treasurePos) {
        for (var pos=0; pos<9; pos++) {
            var left = treasurePos % map.width - pos % 3;
            var top = Math.trunc(treasurePos / map.width) - Math.trunc(pos / 3);
            if (this._isEmptyThreeByThree(map, top, left, treasurePos)) {
                return {"left": left, "top": top};
            }
        }
        return -1;
    };

    this._isEmptyThreeByThree = function(map, top, left, treasurePos) {
        let tx = treasurePos % map.width;
        let ty = Math.trunc(treasurePos / map.width);
        for (var x=left; x<left+3; x++) {
            for (var y=top; y<top+3; y++) {
                // This can probably be simplified
                if (map.getTile(x, y) == WALL || (map.getTile(x, y) == TREASURE && !(x == tx && y == ty))) {
                    return false;
                }
            }
        }
        return true;        
    };

    this._getTreasureWallCount = function(map, top, left) {
        let wallCount = 0;
        for (var i=0; i<3; i++) {
            if (map.getTile(left+i, top-1) == WALL) { // Top wall
                wallCount++;
            }
            if (map.getTile(left-1, top+i) == WALL) { // Left wall
                wallCount++;
            }
            if (map.getTile(left+3, top+i) == WALL) { // Right wall
                wallCount++;
            }
            if (map.getTile(left+i, top+3) == WALL) { // Bottom wall
                wallCount++;
            }
        }
        return wallCount;
    };

    this._flagTreasureRoom = function(map, mapCopy, top, left) {
        for (var x=left; x<left+3; x++) {
            for (var y=top; y<top+3; y++) {
                var pos = y*map.width + x;
                mapCopy[pos] = FLAGGED;
            }
        }
    }

    /**
     * Checks whether all corridors are exactly 1 tile wide. isTreasureValid
     * must be called first and the mapCopy must be the same one used for that
     * call so it can exclude treasure rooms from the check.
     * 
     * @param {Map} map 
     * @param {array} mapCopy 
     */
    this.isHallWidthValid = function(map, mapCopy) {
        // For each tile in mapCopy
        // Check if (x,y), (x+1, y), (x,y+1), and (x+1, y+1) are all EMPTY
        // If so, it's invalid
        let tempMap = new Map();
        tempMap.tiles = mapCopy;
        tempMap.width = map.width;
        tempMap.height = map.height;
        for (var i=0; i<mapCopy.length; i++) {
            var x = i % map.width;
            var y = Math.trunc(i / map.width);
            if (  tempMap.getTile(x, y) == EMPTY &&
                  tempMap.getTile(x+1, y) == EMPTY &&
                  tempMap.getTile(x, y+1) == EMPTY &&
                  tempMap.getTile(x+1, y+1) == EMPTY) {
                return false;
            }
        }
        return true;
    };

}