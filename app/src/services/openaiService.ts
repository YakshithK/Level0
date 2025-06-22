import { GameSchema, GameTheme, PlayerAbility, EnemyType, GameGoal } from "../types/gameSchema";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a game design assistant that creates platformer game schemes. 
Convert user descriptions into structured game schemes with the following guidelines:

- Themes: Choose appropriate themes (lava, ice, forest, space, desert, underwater)
- Player Abilities: Include basic abilities like "jump" and add advanced ones based on description
- Enemies: Select enemies that fit the theme and difficulty
- Platforms: Determine appropriate platform count (2-8) and properties
- Goals: Choose win conditions that match the game type

Examples:
- "A simple lava platformer" → lava theme, jump ability, spike enemies, 4 platforms, portal goal
- "An ice world with double jump" → ice theme, [jump, doubleJump], spike enemies, 5 platforms, portal goal
- "Space shooter with moving platforms" → space theme, [jump, shoot], shooter enemies, {count: 6, moving: true}, survival goal

Always return valid JSON using the create_game_schema function.`;

export interface OpenAIResponse {
    success: boolean;
    gameSchema?: GameSchema;
    error?: string;
}

export class OpenAIService {
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || OPENAI_API_KEY;
    }

    async generateGameSchema(userPrompt: string): Promise<OpenAIResponse> {
        if (!this.apiKey) {
            return {
                success: false,
                error: "OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your environment variables."
            };
        }

        try {
            const response = await fetch(OPENAI_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: SYSTEM_PROMPT
                        },
                        {
                            role: "user",
                            content: userPrompt
                        }
                    ],
                    tools: [
                        {
                            type: "function",
                            function: {
                                name: "create_game_schema",
                                description: "Create a game schema based on the user's description",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        theme: {
                                            type: "string",
                                            enum: ["lava", "ice", "forest", "space", "desert", "underwater"],
                                            description: "The visual theme of the game"
                                        },
                                        playerAbilities: {
                                            type: "array",
                                            items: {
                                                type: "string",
                                                enum: ["jump", "doubleJump", "dash", "wallJump", "shoot", "grapple"]
                                            },
                                            description: "Abilities the player can use"
                                        },
                                        enemies: {
                                            type: "array",
                                            items: {
                                                type: "string",
                                                enum: ["spike", "slime", "shooter", "patrol", "boss"]
                                            },
                                            description: "Types of enemies in the game"
                                        },
                                        platforms: {
                                            type: "object",
                                            properties: {
                                                count: {
                                                    type: "number",
                                                    minimum: 1,
                                                    maximum: 10,
                                                    description: "Number of platforms in the game"
                                                },
                                                moving: {
                                                    type: "boolean",
                                                    description: "Whether platforms move"
                                                },
                                                type: {
                                                    type: "string",
                                                    enum: ["floating", "solid", "breakable"],
                                                    description: "Type of platforms"
                                                }
                                            },
                                            required: ["count"]
                                        },
                                        goal: {
                                            type: "string",
                                            enum: ["portal", "survival", "collectible", "boss", "time"],
                                            description: "The win condition for the game"
                                        }
                                    },
                                    required: ["theme", "playerAbilities", "enemies", "platforms", "goal"]
                                }
                            }
                        }
                    ],
                    tool_choice: { type: "function", function: { name: "create_game_schema" } },
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.choices && data.choices[0]?.message?.tool_calls) {
                const toolCall = data.choices[0].message.tool_calls[0];
                if (toolCall.function.name === 'create_game_schema') {
                    const gameSchema = JSON.parse(toolCall.function.arguments);
                    
                    // Validate the game schema
                    const validation = this.validateGameSchema(gameSchema);
                    if (!validation.isValid) {
                      return {
                        success: false,
                        error: `Invalid game schema: ${validation.errors.join(', ')}`
                      };
                    }
          
                    return {
                      success: true,
                      gameSchema: gameSchema as GameSchema
                    };
                  }
                }
          
                return {
                  success: false,
                  error: 'Failed to generate game schema from OpenAI response'
                };
          
              } catch (error) {
                console.error('OpenAI API error:', error);
                return {
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error occurred'
                };
              }
            }
          
            private validateGameSchema(schema: any): { isValid: boolean; errors: string[] } {
              const errors: string[] = [];
          
              // Check required fields
              if (!schema.theme) errors.push('Missing theme');
              if (!schema.playerAbilities || !Array.isArray(schema.playerAbilities)) errors.push('Missing or invalid playerAbilities');
              if (!schema.enemies || !Array.isArray(schema.enemies)) errors.push('Missing or invalid enemies');
              if (!schema.platforms || typeof schema.platforms !== 'object') errors.push('Missing or invalid platforms');
              if (!schema.goal) errors.push('Missing goal');
          
              // Validate theme
              const validThemes: GameTheme[] = ['lava', 'ice', 'forest', 'space', 'desert', 'underwater'];
              if (!validThemes.includes(schema.theme)) {
                errors.push(`Invalid theme: ${schema.theme}. Must be one of: ${validThemes.join(', ')}`);
              }
          
              // Validate player abilities
              const validAbilities: PlayerAbility[] = ['jump', 'doubleJump', 'dash', 'wallJump', 'shoot', 'grapple'];
              if (schema.playerAbilities) {
                schema.playerAbilities.forEach((ability: string) => {
                  if (!validAbilities.includes(ability as PlayerAbility)) {
                    errors.push(`Invalid player ability: ${ability}. Must be one of: ${validAbilities.join(', ')}`);
                  }
                });
              }
          
              // Validate enemies
              const validEnemies: EnemyType[] = ['spike', 'slime', 'shooter', 'patrol', 'boss'];
              if (schema.enemies) {
                schema.enemies.forEach((enemy: string) => {
                  if (!validEnemies.includes(enemy as EnemyType)) {
                    errors.push(`Invalid enemy: ${enemy}. Must be one of: ${validEnemies.join(', ')}`);
                  }
                });
              }
          
              // Validate platforms
              if (schema.platforms) {
                if (typeof schema.platforms.count !== 'number' || schema.platforms.count < 1 || schema.platforms.count > 10) {
                  errors.push('Platform count must be a number between 1 and 10');
                }
              }
          
              // Validate goal
              const validGoals: GameGoal[] = ['portal', 'survival', 'collectible', 'boss', 'time'];
              if (!validGoals.includes(schema.goal)) {
                errors.push(`Invalid goal: ${schema.goal}. Must be one of: ${validGoals.join(', ')}`);
              }
          
              return {
                isValid: errors.length === 0,
                errors
              };
            }
}

// Export a default instance
export const openAIService = new OpenAIService();