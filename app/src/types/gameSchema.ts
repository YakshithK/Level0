export interface GameSchema {
    theme: GameTheme,
    playerAbilities: PlayerAbility[];
    enemies: EnemyType[];
    platforms: PlatformConfig;
    goal: GameGoal;
}

export type GameTheme = "lava" | "ice" | "forest" | "space" | "desert" | "underwater";

export type PlayerAbility = "jump" | "doubleJump" | "dash" | "wallJump" | "shoot";

export type EnemyType = "spike" | "slime" | "shooter" | "boss";

export interface PlatformConfig {
    count: number;
    moving?: boolean;
    type?: "solid" ;
}

export type GameGoal =  "collectible" | "boss" | "time" | "portal" | "survival";

export interface ThemeConfig {
    backgroundColor: string;
    playerColor: number;
    platformColors: number[];
    enemyColors: number[];
    effects: string[];
}

export const DEFAULT_GAME_SCHEME: GameSchema = {
    theme: "lava",
    playerAbilities: ['jump'],
    enemies: ["spike"],
    platforms: {count: 2},
    goal: "portal"
}