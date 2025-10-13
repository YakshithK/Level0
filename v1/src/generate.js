// kimiK2 codegen placeholder
// Replace with kimiK2Service usage as needed

import { kimiK2Service } from './services/kimiK2Service.js';

async function generateScene(promptText) {
  const result = await kimiK2Service.generatePhaserScene(promptText, true, []);
  console.log(result.code);
}

// Example usage:
// generateScene("very simple but fun snake eating apple game controlling with WASD");
