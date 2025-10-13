const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Supabase client (optional - if you want to download from Supabase)
const supabase = createClient(
  "https://kbtmsshhvirauikympiy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidG1zc2hodmlyYXVpa3ltcGl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDgwMDAxMSwiZXhwIjoyMDY2Mzc2MDExfQ.7YOv42OLXjAHtof6LL17Gq-0pvhlWQDdxdMCXlvqoXc"
);

// Download file from URL
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

// Execute butler command
function execButler(cmd, env) {
  return new Promise((resolve, reject) => {
    exec(cmd, { env: { ...process.env, ...env } }, (err, stdout, stderr) => {
      if (err) reject(stderr || err.message);
      else resolve(stdout);
    });
  });
}

// Main publish endpoint
app.post('/publish', async (req, res) => {
  const { api_key, username, game_slug, zip_url } = req.body;

  if (!api_key || !username || !game_slug || !zip_url) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: api_key, username, game_slug, zip_url' 
    });
  }

  const tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'butler-'));
  const zipPath = path.join(tempDir, 'game.zip');
  const extractDir = path.join(tempDir, 'extracted');

  try {
    // Send progress updates
    const sendProgress = (message, success = false) => {
      res.write(JSON.stringify({ message, success }) + '\n');
    };

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Download the zip
    sendProgress('📥 Downloading game from storage...');
    await downloadFile(zip_url, zipPath);

    // Verify download
    const stats = fs.statSync(zipPath);
    if (stats.size === 0) throw new Error('Downloaded file is empty');

    // Create extraction directory
    fs.mkdirSync(extractDir);
    
    // Extract zip
    sendProgress('📦 Extracting game files...');
    await execButler(`unzip -q ${zipPath} -d ${extractDir}`);

    // Find game directory
    const files = fs.readdirSync(extractDir);
    let gameDir = extractDir;
    
    if (files.length === 1) {
      const potentialDir = path.join(extractDir, files[0]);
      if (fs.statSync(potentialDir).isDirectory()) {
        gameDir = potentialDir;
        sendProgress(`📁 Found game directory: ${files[0]}`);
      }
    }

    // Push to itch.io
    sendProgress(`🚀 Publishing to ${username}/${game_slug}:html5`);
    const output = await execButler(
      `butler push "${gameDir}" ${username}/${game_slug}:html5`,
      { BUTLER_API_KEY: api_key }
    );
    
    sendProgress(output);

    // Logout (cleanup)
    await execButler('butler logout');

    sendProgress('✅ Game published successfully!', true);
    
  } catch (error) {
    res.write(JSON.stringify({ 
      message: `❌ Error: ${error.message}`, 
      success: false 
    }) + '\n');
  } finally {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    res.end();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple Butler HTTP service running on port ${PORT}`);
});
