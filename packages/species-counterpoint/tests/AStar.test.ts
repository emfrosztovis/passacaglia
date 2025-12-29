import { describe, test, expect } from "vitest";
import { aStar } from "../src/AStar";

// ------------------------------
// GridNode with diagonal movement
// ------------------------------

class GridNode {
    x: number;
    y: number;
    grid: string[];
    goalX: number;
    goalY: number;

    constructor(x: number, y: number, grid: string[], goalX: number, goalY: number) {
        this.x = x;
        this.y = y;
        this.grid = grid;
        this.goalX = goalX;
        this.goalY = goalY;
    }

    get isGoal(): boolean {
        return this.x === this.goalX && this.y === this.goalY;
    }

    getHeuristicCost(): number {
        const dx = this.x - this.goalX;
        const dy = this.y - this.goalY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    hash(): string {
        return `${this.x},${this.y}`;
    }

    getNeighbors() {
        const dirs = [
            [1, 0], [-1, 0], [0, 1], [0,-1],   // cardinal
            [1, 1], [1,-1], [-1, 1], [-1,-1]   // diagonal
        ];

        const result: { node: GridNode; cost: number }[] = [];

        for (const [dx, dy] of dirs) {
            const nx = this.x + dx;
            const ny = this.y + dy;

            if (ny < 0 || ny >= this.grid.length) continue;
            if (nx < 0 || nx >= this.grid[0].length) continue;
            if (this.grid[ny][nx] === "#") continue; // wall

            const isDiagonal = dx !== 0 && dy !== 0;
            result.push({
                node: new GridNode(nx, ny, this.grid, this.goalX, this.goalY),
                cost: isDiagonal ? Math.SQRT2 : 1
            });
        }

        return result;
    }
}

function makeNode(x: number, y: number, grid: string[], goalX: number, goalY: number) {
    return new GridNode(x, y, grid, goalX, goalY);
}

// ------------------------------
// Tests
// ------------------------------

test("straight diagonal path", () => {
    const grid = [
        ".....",
        ".....",
        ".....",
        ".....",
        ".....",
    ];

    const start = makeNode(0, 0, grid, 4, 4);
    const path = aStar(start)?.path;

    expect(path).not.toBeNull();

    // Perfect diagonal: (0,0) → (4,4)
    const coords = path!.map(n => n.hash());
    expect(coords).toEqual([
        "0,0",
        "1,1",
        "2,2",
        "3,3",
        "4,4"
    ]);
});

test("avoids a block requiring non-diagonal detour", () => {
    const grid = [
        ".....",
        "..#..",
        "..#..",
        "..#..",
        ".....",
    ];

    // From (0,0) to (4,4), a vertical barrier blocks straight diagonal
    const start = makeNode(0, 0, grid, 4, 4);
    const path = aStar(start)?.path;

    expect(path).not.toBeNull();

    // It must go around the vertical wall at x=2
    const coords = path!.map(n => n.hash());

    // There are two shortest valid routes: around the top or around the bottom
    const topRoute = ["0,0","1,1","1,2","1,3","2,4","3,4","4,4"];
    const bottomRoute = ["0,0","1,1","2,0","3,1","3,2","4,3","4,4"];

    const asJSON = JSON.stringify(coords);
    expect(asJSON === JSON.stringify(topRoute) ||
            asJSON === JSON.stringify(bottomRoute)).toBe(true);
});

test("returns null when no path exists", () => {
    const grid = [
        ".#.",
        "###",
        ".#."
    ];

    const start = makeNode(0, 0, grid, 2, 2);
    const path = aStar(start);

    expect(path).toBeNull();
});

test("optimal path length with diagonal moves", () => {
    const grid = [
        ".......",
        ".......",
        "......."
    ];

    const start = makeNode(0, 0, grid, 6, 2);
    const result = aStar(start);
    expect(result).not.toBeNull();

    const expectedCost = 2 * Math.SQRT2 + 4;
    expect(result?.cost).toBeCloseTo(expectedCost);
});
