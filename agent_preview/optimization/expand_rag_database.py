#!/usr/bin/env python3
"""
Expand the FAISS RAG database with more comprehensive Phaser.js examples
focusing on UI elements, color schemes, health bars, text styling, etc.
"""

import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import os

# Enhanced Phaser.js code examples focused on UI, colors, and styling
UI_EXAMPLES = [
    {
        "description": "UIScene health bar implementation with colors",
        "chunk": """// UIScene.js - Health bar with custom colors
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // Health bar background
        this.healthBarBg = this.add.rectangle(100, 50, 200, 20, 0x8B0000); // Dark red background
        this.healthBarBg.setOrigin(0, 0.5);
        
        // Health bar fill
        this.healthBar = this.add.rectangle(100, 50, 200, 20, 0x00FF00); // Green fill
        this.healthBar.setOrigin(0, 0.5);
        
        // Health text with custom color
        this.healthText = this.add.text(100, 80, 'Health: 100', {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        });
    }

    updateHealth(health) {
        const healthPercent = health / 100;
        this.healthBar.scaleX = healthPercent;
        
        // Change color based on health
        if (health > 60) {
            this.healthBar.setFillStyle(0x00FF00); // Green
        } else if (health > 30) {
            this.healthBar.setFillStyle(0xFFFF00); // Yellow  
        } else {
            this.healthBar.setFillStyle(0xFF0000); // Red
        }
        
        this.healthText.setText(`Health: ${health}`);
    }
}"""
    },
    {
        "description": "Score display with dynamic colors",
        "chunk": """// Score and UI text with color theming
class GameUI extends Phaser.Scene {
    create() {
        // Score text with gradient effect
        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontSize: '24px',
            fill: '#FFD700', // Gold color
            stroke: '#000000',
            strokeThickness: 2,
            fontFamily: 'Arial Black'
        });
        
        // Lives display
        this.livesText = this.add.text(10, 50, 'Lives: 3', {
            fontSize: '20px',
            fill: '#FF6B6B', // Light red
            fontFamily: 'Arial'
        });
        
        // Level indicator
        this.levelText = this.add.text(10, 90, 'Level: 1', {
            fontSize: '18px',
            fill: '#4ECDC4', // Teal
            fontFamily: 'Arial'
        });
    }
    
    updateScore(score) {
        this.scoreText.setText(`Score: ${score}`);
        // Pulse effect on score update
        this.scoreText.setScale(1.2);
        this.tweens.add({
            targets: this.scoreText,
            scaleX: 1,
            scaleY: 1,
            duration: 200
        });
    }
    
    setColorTheme(theme) {
        switch(theme) {
            case 'dark':
                this.scoreText.setColor('#FFFFFF');
                this.livesText.setColor('#FF4444');
                this.levelText.setColor('#44FF44');
                break;
            case 'light':
                this.scoreText.setColor('#333333');
                this.livesText.setColor('#CC0000');
                this.levelText.setColor('#006600');
                break;
        }
    }
}"""
    },
    {
        "description": "Game configuration with background colors",
        "chunk": """// Game configuration with theme colors
const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#2c3e50', // Dark blue-gray background
    scene: [MenuScene, GameScene, UIScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    }
};

// Alternative color schemes
const colorThemes = {
    dark: {
        background: '#1a1a1a',
        primary: '#ffffff',
        secondary: '#cccccc',
        accent: '#ff6b6b'
    },
    light: {
        background: '#f8f9fa',
        primary: '#343a40',
        secondary: '#6c757d', 
        accent: '#007bff'
    },
    neon: {
        background: '#0f0f23',
        primary: '#00ff41',
        secondary: '#ff0080',
        accent: '#ffff00'
    }
};

// Apply theme to game
function applyTheme(theme) {
    const colors = colorThemes[theme];
    game.config.backgroundColor = colors.background;
}"""
    },
    {
        "description": "Progress bars and meters with colors",
        "chunk": """// Progress bars and meters implementation
class ProgressBars extends Phaser.Scene {
    create() {
        // Experience bar
        this.createProgressBar(50, 100, 300, 15, 'XP', 0x4a90e2, 0x2c3e50);
        
        // Mana bar  
        this.createProgressBar(50, 130, 300, 15, 'MP', 0x5cb3cc, 0x34495e);
        
        // Loading bar
        this.createProgressBar(50, 160, 300, 15, 'Loading', 0xe74c3c, 0x95a5a6);
    }
    
    createProgressBar(x, y, width, height, label, fillColor, bgColor) {
        // Background
        const bg = this.add.rectangle(x, y, width, height, bgColor);
        bg.setOrigin(0, 0.5);
        
        // Fill
        const fill = this.add.rectangle(x, y, width, height, fillColor);
        fill.setOrigin(0, 0.5);
        fill.scaleX = 0; // Start empty
        
        // Label
        const text = this.add.text(x, y - 25, label, {
            fontSize: '14px',
            fill: '#ffffff'
        });
        
        return { bg, fill, text };
    }
    
    updateProgressBar(bar, percentage) {
        bar.fill.scaleX = percentage / 100;
        
        // Color transition based on percentage
        if (percentage > 70) {
            bar.fill.setFillStyle(0x00ff00); // Green
        } else if (percentage > 30) {
            bar.fill.setFillStyle(0xffff00); // Yellow
        } else {
            bar.fill.setFillStyle(0xff0000); // Red
        }
    }
}"""
    },
    {
        "description": "Button styling and hover effects",
        "chunk": """// Interactive buttons with color states
class MenuScene extends Phaser.Scene {
    create() {
        this.createStyledButton(400, 200, 'Play Game', '#2ecc71', '#27ae60');
        this.createStyledButton(400, 280, 'Settings', '#3498db', '#2980b9');
        this.createStyledButton(400, 360, 'Quit', '#e74c3c', '#c0392b');
    }
    
    createStyledButton(x, y, text, normalColor, hoverColor) {
        // Button background
        const button = this.add.rectangle(x, y, 200, 50, Phaser.Display.Color.HexStringToColor(normalColor).color);
        button.setInteractive();
        
        // Button text
        const buttonText = this.add.text(x, y, text, {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Hover effects
        button.on('pointerover', () => {
            button.setFillStyle(Phaser.Display.Color.HexStringToColor(hoverColor).color);
            buttonText.setScale(1.1);
        });
        
        button.on('pointerout', () => {
            button.setFillStyle(Phaser.Display.Color.HexStringToColor(normalColor).color);
            buttonText.setScale(1);
        });
        
        button.on('pointerdown', () => {
            buttonText.setScale(0.95);
        });
        
        button.on('pointerup', () => {
            buttonText.setScale(1.1);
        });
        
        return { button, buttonText };
    }
}"""
    },
    {
        "description": "Text styling and font effects",
        "chunk": """// Advanced text styling and effects
class TextEffects extends Phaser.Scene {
    create() {
        // Title text with gradient effect
        this.titleText = this.add.text(400, 100, 'GAME TITLE', {
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            fontFamily: 'Arial Black',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 0,
                stroke: false,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Subtitle with custom color
        this.subtitleText = this.add.text(400, 150, 'Press SPACE to start', {
            fontSize: '24px',
            fill: '#ffdd44',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Animated score text
        this.scoreDisplay = this.add.text(50, 50, 'Score: 0', {
            fontSize: '20px',
            fill: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        
        // Flashing warning text
        this.warningText = this.add.text(400, 500, 'LOW HEALTH!', {
            fontSize: '32px',
            fill: '#ff0000',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);
        
        // Make warning text flash
        this.tweens.add({
            targets: this.warningText,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
    
    updateScoreColor(score) {
        if (score > 1000) {
            this.scoreDisplay.setColor('#ffd700'); // Gold
        } else if (score > 500) {
            this.scoreDisplay.setColor('#00ff00'); // Green  
        } else {
            this.scoreDisplay.setColor('#ffffff'); // White
        }
    }
}"""
    },
    {
        "description": "Scene background and color management",
        "chunk": """// Scene background and color theming
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.currentTheme = 'default';
    }
    
    create() {
        // Set initial background color
        this.cameras.main.setBackgroundColor('#2c3e50');
        
        // Create color-coded zones
        this.createZone(100, 100, 200, 150, 0xff6b6b, 'Danger Zone');
        this.createZone(400, 100, 200, 150, 0x4ecdc4, 'Safe Zone');
        this.createZone(250, 300, 200, 150, 0xffe66d, 'Bonus Zone');
    }
    
    createZone(x, y, width, height, color, label) {
        const zone = this.add.rectangle(x, y, width, height, color, 0.3);
        zone.setOrigin(0, 0);
        
        const zoneText = this.add.text(x + width/2, y + height/2, label, {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        }).setOrigin(0.5);
        
        return { zone, zoneText };
    }
    
    changeTheme(themeName) {
        const themes = {
            dark: { bg: '#1a1a1a', zones: [0x8b0000, 0x006400, 0xb8860b] },
            light: { bg: '#f0f0f0', zones: [0xff9999, 0x99ff99, 0xffff99] },
            neon: { bg: '#000000', zones: [0xff0080, 0x00ff80, 0x8000ff] }
        };
        
        const theme = themes[themeName];
        if (theme) {
            this.cameras.main.setBackgroundColor(theme.bg);
            this.currentTheme = themeName;
        }
    }
}"""
    },
    {
        "description": "HUD and overlay elements",
        "chunk": """// HUD and overlay UI elements
class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUD', active: true });
    }
    
    create() {
        // Create semi-transparent overlay
        this.hudOverlay = this.add.rectangle(0, 0, 800, 100, 0x000000, 0.5);
        this.hudOverlay.setOrigin(0, 0);
        
        // Player stats panel
        this.createStatsPanel(10, 10);
        
        // Mini-map
        this.createMiniMap(650, 10);
        
        // Item slots
        this.createItemSlots(10, 520);
    }
    
    createStatsPanel(x, y) {
        // Health
        this.healthLabel = this.add.text(x, y, 'HP:', { fontSize: '16px', fill: '#ffffff' });
        this.healthBar = this.add.rectangle(x + 30, y + 8, 100, 10, 0x00ff00);
        this.healthBar.setOrigin(0, 0.5);
        
        // Mana
        this.manaLabel = this.add.text(x, y + 25, 'MP:', { fontSize: '16px', fill: '#ffffff' });
        this.manaBar = this.add.rectangle(x + 30, y + 33, 100, 10, 0x0080ff);
        this.manaBar.setOrigin(0, 0.5);
        
        // Experience
        this.xpLabel = this.add.text(x, y + 50, 'XP:', { fontSize: '16px', fill: '#ffffff' });
        this.xpBar = this.add.rectangle(x + 30, y + 58, 100, 10, 0xffff00);
        this.xpBar.setOrigin(0, 0.5);
    }
    
    createMiniMap(x, y) {
        const miniMap = this.add.rectangle(x, y, 140, 80, 0x333333, 0.8);
        miniMap.setOrigin(0, 0);
        
        const mapLabel = this.add.text(x + 70, y + 5, 'MAP', {
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);
        
        // Player dot on minimap
        this.playerDot = this.add.circle(x + 70, y + 40, 3, 0x00ff00);
    }
    
    createItemSlots(x, y) {
        this.itemSlots = [];
        for (let i = 0; i < 6; i++) {
            const slot = this.add.rectangle(x + i * 55, y, 50, 50, 0x444444);
            slot.setStrokeStyle(2, 0x666666);
            this.itemSlots.push(slot);
        }
    }
}"""
    }
]

def expand_database():
    """Expand the existing FAISS database with new UI-focused examples"""
    
    print("Loading existing database...")
    
    # Load existing model and index
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    # Read existing chunks
    existing_chunks = []
    if os.path.exists("phaser_chunks.jsonl"):
        with open("phaser_chunks.jsonl", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    existing_chunks.append(json.loads(line)["chunk"])
    
    print(f"Found {len(existing_chunks)} existing chunks")
    
    # Add new UI examples
    new_chunks = [example["chunk"] for example in UI_EXAMPLES]
    all_chunks = existing_chunks + new_chunks
    
    print(f"Adding {len(new_chunks)} new UI-focused examples")
    print(f"Total chunks: {len(all_chunks)}")
    
    # Generate embeddings for all chunks
    print("Generating embeddings...")
    embeddings = model.encode(all_chunks, show_progress_bar=True)
    
    # Normalize embeddings for cosine similarity
    faiss.normalize_L2(embeddings.astype('float32'))
    
    # Create new FAISS index
    print("Building FAISS index...")
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
    index.add(embeddings.astype('float32'))
    
    # Save updated index
    faiss.write_index(index, "phaser_index.faiss")
    print("Saved updated FAISS index")
    
    # Save updated chunks
    with open("phaser_chunks.jsonl", "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps({"chunk": chunk}) + "\n")
    
    print(f"Saved {len(all_chunks)} chunks to phaser_chunks.jsonl")
    print("Database expansion complete!")
    
    # Test the expanded database
    print("\nTesting expanded database...")
    test_queries = [
        "health bar colors UIScene",
        "text color score display",
        "background color theme",
        "progress bar implementation"
    ]
    
    for query in test_queries:
        query_embedding = model.encode([query])
        faiss.normalize_L2(query_embedding.astype('float32'))
        
        distances, indices = index.search(query_embedding.astype('float32'), 3)
        
        print(f"\nQuery: '{query}'")
        for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < len(all_chunks):
                print(f"  Result {i+1} (similarity: {dist:.3f}): {all_chunks[idx][:100]}...")

if __name__ == "__main__":
    expand_database()
