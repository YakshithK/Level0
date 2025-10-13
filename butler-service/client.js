const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const axios = require('axios');

// Initialize Supabase client
const supabase = createClient(
  "https://kbtmsshhvirauikympiy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidG1zc2hodmlyYXVpa3ltcGl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDgwMDAxMSwiZXhwIjoyMDY2Mzc2MDExfQ.7YOv42OLXjAHtof6LL17Gq-0pvhlWQDdxdMCXlvqoXc"
);

// Your HTTP service endpoint (change this to your simple HTTP server if you switch)
const SERVICE_URL = "https://level0-production.up.railway.app"; // or your gRPC proxy

async function testPublish() {
  try {
    console.log("🚀 Starting test publish...");

    // 1. Upload zip to Supabase
    const fileBuffer = fs.readFileSync("snake.zip");
    const fileName = `test-game-${Date.now()}.zip`;
    
    console.log("📤 Uploading to Supabase...");
    const { error: uploadError } = await supabase.storage
      .from('games')
      .upload(fileName, fileBuffer);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from('games')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log(`✅ File uploaded to: ${publicUrl}`);

    // 3. Test health endpoint first
    console.log("🏥 Testing health endpoint...");
    try {
      const healthResponse = await axios.get(`${SERVICE_URL}/health`);
      console.log("✅ Health check:", healthResponse.data);
    } catch (healthError) {
      console.log("❌ Health check failed - service might be down");
    }

    // 4. Make publish request
    console.log("📨 Sending publish request...");
    const response = await axios.post(`${SERVICE_URL}/publish`, {
      api_key: "NEvGHOvxiov4wu40jG99m9SBqE77QEpyxpM5Rx15",
      username: "YakshithK",
      game_slug: "snake",
      zip_url: publicUrl
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("✅ Publish response:", response.data);

  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testPublish();