// ===========================================
// BROWSER CONSOLE TEST SCRIPT
// ===========================================
// Copy and paste this into your browser console while on the app page

// Test function to check retriever with a prompt
async function testRetriever(prompt) {
    console.log(`\n🧪 Testing: "${prompt}"`);
    
    try {
        const response = await fetch('/api/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        
        const data = await response.json();
        
        if (data.relatedFiles) {
            console.log('✅ Related files found:', data.relatedFiles);
        } else {
            console.log('❌ No related files in response');
        }
        
        return data.relatedFiles || [];
        
    } catch (error) {
        console.error('❌ Error:', error);
        return [];
    }
}

// Run multiple tests
async function runQuickTests() {
    console.log('🚀 Starting Basic Retriever Tests...\n');
    
    const basicTests = [
        'shots',
        'bullets', 
        'player movement',
        'enemy health',
        'health bar',
        'collision detection'
    ];
    
    for (const prompt of basicTests) {
        await testRetriever(prompt);
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    }
    
    console.log('\n✅ Basic tests completed!');
}

// Run complex prompts test
async function runComplexTests() {
    console.log('🚀 Starting Complex Game Development Tests...\n');
    
    const complexTests = [
        // Combat & Mechanics
        'make bullets do more damage to enemies',
        'add different types of enemies with varying health',
        'implement a rapid fire mode for the player',
        'create explosive bullets that damage multiple enemies',
        'add a reload system with limited ammunition',
        
        // Player Enhancement
        'increase player movement speed when health is low',
        'add a dash ability with cooldown for the player',
        'implement player health regeneration over time',
        'create power-ups that boost player abilities',
        'add invincibility frames when player takes damage',
        
        // Enemy AI & Behavior
        'make enemies move in formation patterns',
        'add boss enemies with multiple attack phases',
        'implement enemy pathfinding around obstacles',
        'create enemies that shoot projectiles at the player',
        'add enemy spawn points that increase difficulty',
        
        // UI & Game Systems
        'add an ammunition counter to the HUD',
        'implement a high score system with local storage',
        'create a pause menu with resume functionality',
        'add visual damage indicators when enemies are hit',
        'implement screen shake effects for explosions',
        
        // Advanced Features
        'add particle effects for bullet trails',
        'implement procedural enemy wave generation',
        'create a weapon upgrade system with multiple tiers',
        'add background music and sound effects',
        'implement camera follow smoothing for player movement',
        
        // Game Balance & Polish
        'balance enemy health based on current wave number',
        'add visual feedback for low health warning',
        'implement smooth camera transitions between scenes',
        'create floating damage numbers when enemies are hit',
        'add screen edge collision for keeping entities in bounds'
    ];
    
    for (const prompt of complexTests) {
        await testRetriever(prompt);
        await new Promise(resolve => setTimeout(resolve, 800)); // Longer delay for complex tests
    }
    
    console.log('\n✅ Complex tests completed!');
}

// Run specific category tests
async function runCategoryTests() {
    console.log('🚀 Starting Category-Based Tests...\n');
    
    const categories = {
        '🎯 Combat': [
            'make bullets do more damage to enemies',
            'implement a rapid fire mode for the player',
            'create explosive bullets that damage multiple enemies'
        ],
        '🎮 Player': [
            'add a dash ability with cooldown for the player',
            'implement player health regeneration over time',
            'increase player movement speed when health is low'
        ],
        '👾 Enemy': [
            'add different types of enemies with varying health',
            'make enemies move in formation patterns',
            'create enemies that shoot projectiles at the player'
        ],
        '🎯 UI': [
            'add an ammunition counter to the HUD',
            'implement a high score system with local storage',
            'add visual feedback for low health warning'
        ],
        '⚙️ Advanced': [
            'add particle effects for bullet trails',
            'implement camera follow smoothing for player movement',
            'create floating damage numbers when enemies are hit'
        ]
    };
    
    for (const [category, prompts] of Object.entries(categories)) {
        console.log(`\n${category} Tests:`);
        console.log('='.repeat(category.length + 7));
        
        for (const prompt of prompts) {
            await testRetriever(prompt);
            await new Promise(resolve => setTimeout(resolve, 600));
        }
    }
    
    console.log('\n✅ Category tests completed!');
}

// Individual test functions for easy use
const quickTests = {
    // Basic tests
    shots: () => testRetriever('shots'),
    bullets: () => testRetriever('bullets'),
    player: () => testRetriever('player movement'),
    enemy: () => testRetriever('enemy health'),
    ui: () => testRetriever('health bar'),
    collision: () => testRetriever('collision detection'),
    
    // Complex single tests
    rapidFire: () => testRetriever('implement a rapid fire mode for the player'),
    explosiveBullets: () => testRetriever('create explosive bullets that damage multiple enemies'),
    dashAbility: () => testRetriever('add a dash ability with cooldown for the player'),
    bossEnemies: () => testRetriever('add boss enemies with multiple attack phases'),
    ammunition: () => testRetriever('add an ammunition counter to the HUD'),
    particleEffects: () => testRetriever('add particle effects for bullet trails'),
    damageNumbers: () => testRetriever('create floating damage numbers when enemies are hit'),
    
    // Test suites
    basic: runQuickTests,
    complex: runComplexTests,
    categories: runCategoryTests,
    all: async () => {
        await runQuickTests();
        console.log('\n' + '='.repeat(50));
        await runComplexTests();
    }
};

// Quick batch test function
async function testBatch(prompts) {
    console.log(`🧪 Testing ${prompts.length} prompts...\n`);
    
    for (const prompt of prompts) {
        await testRetriever(prompt);
        await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    console.log('\n✅ Batch test completed!');
}

// Make functions available globally
window.testRetriever = testRetriever;
window.runQuickTests = runQuickTests;
window.runComplexTests = runComplexTests;
window.runCategoryTests = runCategoryTests;
window.quickTests = quickTests;
window.testBatch = testBatch;

console.log('📋 Enhanced Retriever Test Suite Loaded!');
console.log('💡 Usage:');
console.log('');
console.log('📌 Basic Tests:');
console.log('  quickTests.basic()              - Run basic retriever tests');
console.log('  quickTests.shots()              - Test "shots" prompt');
console.log('  quickTests.player()             - Test player movement');
console.log('');
console.log('🎯 Complex Tests:');
console.log('  quickTests.complex()            - Run all complex prompts');
console.log('  quickTests.categories()         - Run categorized tests');
console.log('  quickTests.rapidFire()          - Test rapid fire feature');
console.log('  quickTests.explosiveBullets()   - Test explosive bullets');
console.log('  quickTests.dashAbility()        - Test dash ability');
console.log('  quickTests.bossEnemies()        - Test boss enemies');
console.log('');
console.log('🚀 Test Suites:');
console.log('  quickTests.all()                - Run basic + complex tests');
console.log('  testRetriever("your prompt")    - Test any custom prompt');
console.log('  testBatch([prompt1, prompt2])   - Test array of prompts');
console.log('');
console.log('🧪 Example Complex Prompts:');
console.log('  testRetriever("make bullets do more damage to enemies")');
console.log('  testRetriever("add a reload system with limited ammunition")');
console.log('  testRetriever("implement player health regeneration over time")');
console.log('  testRetriever("create a weapon upgrade system with multiple tiers")');
