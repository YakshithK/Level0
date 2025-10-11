const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

class BuildSystem {
    constructor() {
        this.buildDir = path.join(__dirname, 'build')
        this.frontendDir = path.join(__dirname, 'frontend')
    }

    async build() {
        try {
            console.log('🏗️  Building Game V0...')
            
            // Clean build directory
            await this.cleanBuild()
            
            // Build frontend
            await this.buildFrontend()
            
            // Copy assets
            await this.copyAssets()
            
            // Create deployment files
            await this.createDeploymentFiles()
            
            console.log('✅ Build completed successfully!')
            console.log(`📁 Build output: ${this.buildDir}`)
            
        } catch (error) {
            console.error('❌ Build failed:', error)
            throw error
        }
    }

    async cleanBuild() {
        console.log('🧹 Cleaning build directory...')
        await fs.remove(this.buildDir)
        await fs.ensureDir(this.buildDir)
    }

    async buildFrontend() {
        console.log('📦 Building frontend...')
        
        try {
            // Change to frontend directory and run Vite build
            process.chdir(this.frontendDir)
            execSync('npm run build', { stdio: 'inherit' })
            process.chdir(__dirname)
            
        } catch (error) {
            throw new Error(`Frontend build failed: ${error.message}`)
        }
    }

    async copyAssets() {
        console.log('📁 Copying assets...')
        
        const assetsSource = path.join(this.frontendDir, 'assets')
        const assetsDest = path.join(this.buildDir, 'assets')
        
        if (await fs.pathExists(assetsSource)) {
            await fs.copy(assetsSource, assetsDest)
        }
        
        // Copy any generated assets from backend
        const generatedAssets = path.join(__dirname, 'frontend', 'assets')
        if (await fs.pathExists(generatedAssets)) {
            await fs.copy(generatedAssets, assetsDest, { overwrite: true })
        }
    }

    async createDeploymentFiles() {
        console.log('📄 Creating deployment files...')
        
        // Create package.json for deployment
        const packageJson = {
            name: 'game-v0-build',
            version: '1.0.0',
            description: 'Game V0 Build Output',
            main: 'index.html',
            scripts: {
                start: 'npx serve -s . -l 3000'
            }
        }
        
        await fs.writeFile(
            path.join(this.buildDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        )
        
        // Create README for deployment
        const readme = `# Game V0 Build

This is a build output from Game V0 - AI Game Generator.

## Running Locally

\`\`\`bash
npm install
npm start
\`\`\`

## Deploying to Itch.io

1. Zip this entire folder
2. Upload to Itch.io as a web game
3. Set the main file to \`index.html\`

## Features

- AI-generated Phaser 3 games
- Hot-reload development
- Automated testing
- Asset management
`
        
        await fs.writeFile(
            path.join(this.buildDir, 'README.md'),
            readme
        )
        
        // Create .gitignore for build
        const gitignore = `node_modules/
.env
*.log
.DS_Store
`
        
        await fs.writeFile(
            path.join(this.buildDir, '.gitignore'),
            gitignore
        )
    }

    async createItchPackage() {
        try {
            console.log('🎮 Creating Itch.io package...')
            
            // Ensure build exists
            if (!await fs.pathExists(this.buildDir)) {
                await this.build()
            }
            
            // Create zip file
            const archiver = require('archiver')
            const output = fs.createWriteStream(path.join(__dirname, 'game-v0-itch.zip'))
            const archive = archiver('zip', { zlib: { level: 9 } })
            
            output.on('close', () => {
                console.log(`✅ Itch.io package created: game-v0-itch.zip (${archive.pointer()} bytes)`)
            })
            
            archive.on('error', (err) => {
                throw err
            })
            
            archive.pipe(output)
            archive.directory(this.buildDir, false)
            await archive.finalize()
            
        } catch (error) {
            console.error('❌ Failed to create Itch.io package:', error)
            throw error
        }
    }
}

// CLI interface
async function main() {
    const buildSystem = new BuildSystem()
    const command = process.argv[2]
    
    try {
        switch (command) {
            case 'build':
                await buildSystem.build()
                break
            case 'itch':
                await buildSystem.createItchPackage()
                break
            case 'clean':
                await buildSystem.cleanBuild()
                break
            default:
                console.log('Usage: node build.js [build|itch|clean]')
                console.log('  build - Build the project for deployment')
                console.log('  itch  - Create Itch.io deployment package')
                console.log('  clean - Clean build directory')
                process.exit(1)
        }
        
    } catch (error) {
        console.error('Build script error:', error)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { BuildSystem }
