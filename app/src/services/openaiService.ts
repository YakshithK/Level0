import { GameSchema, GameTheme, PlayerAbility, EnemyType, GameGoal } from "../types/gameSchema";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Type definitions for OpenAI messages
interface OpenAIMessage {
    role: "system" | "user" | "assistant";
    content: string | null;
    tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
            name: string;
            arguments: string;
        };
    }>;
}

// Few-shot examples for different game types and complexity levels
const FEW_SHOT_EXAMPLES = [
    {
        user: "A simple lava platformer",
        assistant: {
            theme: "lava",
            playerAbilities: ["jump"],
            enemies: ["spike"],
            platforms: { count: 4, moving: false, type: "solid" },
            goal: "portal"
        }
    },
    {
        user: "An ice world with double jump",
        assistant: {
            theme: "ice",
            playerAbilities: ["jump", "doubleJump"],
            enemies: ["spike"],
            platforms: { count: 5, moving: false, type: "solid" },
            goal: "portal"
        }
    },
    {
        user: "Space shooter with moving platforms",
        assistant: {
            theme: "space",
            playerAbilities: ["jump", "shoot"],
            enemies: ["shooter"],
            platforms: { count: 6, moving: true, type: "floating" },
            goal: "survival"
        }
    },
    {
        user: "Forest adventure with dash and collectibles",
        assistant: {
            theme: "forest",
            playerAbilities: ["jump", "dash"],
            enemies: ["slime", "patrol"],
            platforms: { count: 7, moving: false, type: "solid" },
            goal: "collectible"
        }
    },
    {
        user: "Underwater maze with wall jump",
        assistant: {
            theme: "underwater",
            playerAbilities: ["jump", "wallJump"],
            enemies: ["slime"],
            platforms: { count: 8, moving: false, type: "solid" },
            goal: "portal"
        }
    },
    {
        user: "Desert boss battle with grapple hook",
        assistant: {
            theme: "desert",
            playerAbilities: ["jump", "grapple"],
            enemies: ["boss"],
            platforms: { count: 3, moving: true, type: "floating" },
            goal: "boss"
        }
    },
    {
        user: "Hardcore lava challenge with all abilities",
        assistant: {
            theme: "lava",
            playerAbilities: ["jump", "doubleJump", "dash", "wallJump", "shoot", "grapple"],
            enemies: ["spike", "shooter", "boss"],
            platforms: { count: 10, moving: true, type: "breakable" },
            goal: "time"
        }
    }
];

const SYSTEM_PROMPT = `You are a game design assistant that creates platformer game schemes. 
Convert user descriptions into structured game schemes with the following guidelines:

- Themes: Choose appropriate themes (lava, ice, forest, space, desert, underwater)
- Player Abilities: Include basic abilities like "jump" and add advanced ones based on description
- Enemies: Select enemies that fit the theme and difficulty
- Platforms: Determine appropriate platform count (2-8) and properties
- Goals: Choose win conditions that match the game type

Study the provided examples carefully. Each example shows:
1. A user description (input)
2. A structured game schema (output) with all required fields

Follow the exact same pattern and structure as the examples. Always return valid JSON using the create_game_schema function.`;

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

    private selectRelevantExamples(userPrompt: string, maxExamples: number = 3): typeof FEW_SHOT_EXAMPLES {
        const promptLower = userPrompt.toLowerCase();
        
        // Score examples based on relevance to the user prompt
        const scoredExamples = FEW_SHOT_EXAMPLES.map(example => {
            let score = 0;
            
            // Check for theme matches
            if (promptLower.includes('lava') && example.assistant.theme === 'lava') score += 3;
            if (promptLower.includes('ice') && example.assistant.theme === 'ice') score += 3;
            if (promptLower.includes('forest') && example.assistant.theme === 'forest') score += 3;
            if (promptLower.includes('space') && example.assistant.theme === 'space') score += 3;
            if (promptLower.includes('desert') && example.assistant.theme === 'desert') score += 3;
            if (promptLower.includes('underwater') && example.assistant.theme === 'underwater') score += 3;
            
            // Check for ability matches
            if (promptLower.includes('double jump') && example.assistant.playerAbilities.includes('doubleJump')) score += 2;
            if (promptLower.includes('dash') && example.assistant.playerAbilities.includes('dash')) score += 2;
            if (promptLower.includes('wall jump') && example.assistant.playerAbilities.includes('wallJump')) score += 2;
            if (promptLower.includes('shoot') && example.assistant.playerAbilities.includes('shoot')) score += 2;
            if (promptLower.includes('grapple') && example.assistant.playerAbilities.includes('grapple')) score += 2;
            
            // Check for goal matches
            if (promptLower.includes('collect') && example.assistant.goal === 'collectible') score += 2;
            if (promptLower.includes('boss') && example.assistant.goal === 'boss') score += 2;
            if (promptLower.includes('survival') && example.assistant.goal === 'survival') score += 2;
            if (promptLower.includes('time') && example.assistant.goal === 'time') score += 2;
            
            // Check for platform properties
            if (promptLower.includes('moving') && example.assistant.platforms.moving) score += 1;
            if (promptLower.includes('breakable') && example.assistant.platforms.type === 'breakable') score += 1;
            
            // Always include at least one simple example
            if (example.assistant.playerAbilities.length === 1 && example.assistant.playerAbilities[0] === 'jump') {
                score += 1;
            }
            
            return { ...example, score };
        });
        
        // Sort by score and return top examples
        return scoredExamples
            .sort((a, b) => b.score - a.score)
            .slice(0, maxExamples)
            .map(({ score, ...example }) => example);
    }

    async generateGameSchema(userPrompt: string): Promise<OpenAIResponse> {
        if (!this.apiKey) {
            return {
                success: false,
                error: "OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your environment variables."
            };
        }
        try {
            // Select relevant few-shot examples
            const relevantExamples = this.selectRelevantExamples(userPrompt);
            
            // Build conversation messages with few-shot examples
            const messages: OpenAIMessage[] = [
                {
                    role: "system",
                    content: SYSTEM_PROMPT
                }
            ];

            // Add relevant few-shot examples
            relevantExamples.forEach(example => {
                messages.push({
                    role: "user",
                    content: example.user
                });
                messages.push({
                    role: "assistant",
                    content: null,
                    tool_calls: [
                        {
                            id: `example_${Math.random()}`,
                            type: "function",
                            function: {
                                name: "create_game_schema",
                                arguments: JSON.stringify(example.assistant)
                            }
                        }
                    ]
                });
            });

            // Add the actual user prompt
            messages.push({
                role: "user",
                content: userPrompt
            });

            const response = await fetch(OPENAI_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: messages,
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

    /**
     * Get statistics about the few-shot prompting system
     */
    getFewShotStats() {
        return {
            totalExamples: FEW_SHOT_EXAMPLES.length,
            themes: [...new Set(FEW_SHOT_EXAMPLES.map(ex => ex.assistant.theme))],
            abilities: [...new Set(FEW_SHOT_EXAMPLES.flatMap(ex => ex.assistant.playerAbilities))],
            goals: [...new Set(FEW_SHOT_EXAMPLES.map(ex => ex.assistant.goal))],
            complexityLevels: FEW_SHOT_EXAMPLES.map(ex => ({
                description: ex.user,
                abilityCount: ex.assistant.playerAbilities.length,
                enemyCount: ex.assistant.enemies.length,
                platformCount: ex.assistant.platforms.count
            }))
        };
    }
}

// Export a default instance
export const openAIService = new OpenAIService();