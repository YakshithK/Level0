import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameError {
  type: 'syntax' | 'missing_import' | 'missing_asset' | 'phaser_api' | 'runtime';
  severity: 'critical' | 'warning';
  file: string;
  message: string;
  line?: number;
  suggestion?: string;
  autoFixable?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: GameError[];
  warnings: string[];
  autoFixable: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files } = await req.json();
    
    console.log('Validating game files...');
    
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      autoFixable: true
    };

    // 1. STATIC VALIDATION
    
    // Check required files
    if (!files['index.html']) {
      result.errors.push({
        type: 'missing_import',
        severity: 'critical',
        file: 'index.html',
        message: 'Missing required index.html file',
        autoFixable: false
      });
      result.valid = false;
      result.autoFixable = false;
    }

    if (!files['game.js'] && !Object.keys(files).some(k => k.endsWith('.js'))) {
      result.errors.push({
        type: 'missing_import',
        severity: 'critical',
        file: 'game.js',
        message: 'No JavaScript files found',
        autoFixable: false
      });
      result.valid = false;
      result.autoFixable = false;
    }

    // Validate JavaScript files for common issues
    const jsFiles = Object.entries(files).filter(([name]) => name.endsWith('.js'));
    
    for (const [filename, content] of jsFiles) {
      // Check for basic syntax patterns
      const contentStr = String(content);
      
      // Check for unclosed brackets
      const openBraces = (contentStr.match(/{/g) || []).length;
      const closeBraces = (contentStr.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        result.errors.push({
          type: 'syntax',
          severity: 'critical',
          file: filename,
          message: `Mismatched braces: ${openBraces} opening vs ${closeBraces} closing`,
          autoFixable: true
        });
        result.valid = false;
      }

      // Check for unclosed parentheses
      const openParens = (contentStr.match(/\(/g) || []).length;
      const closeParens = (contentStr.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        result.errors.push({
          type: 'syntax',
          severity: 'critical',
          file: filename,
          message: `Mismatched parentheses: ${openParens} opening vs ${closeParens} closing`,
          autoFixable: true
        });
        result.valid = false;
      }

      // Check for Phaser Scene structure if it's a scene file
      if (filename.includes('Scene') || filename === 'game.js') {
        const hasPreload = contentStr.includes('preload()') || contentStr.includes('preload ()');
        const hasCreate = contentStr.includes('create()') || contentStr.includes('create ()');
        
        if (!hasCreate && contentStr.includes('class') && contentStr.includes('Phaser.Scene')) {
          result.warnings.push(`${filename}: Scene class missing create() method`);
        }
      }

      // Check for common Phaser API mistakes
      if (contentStr.includes('this.load.image(') && !contentStr.includes('preload')) {
        result.warnings.push(`${filename}: Loading assets outside preload() method`);
      }

      // Check for undefined variables (basic check)
      const functionCalls = contentStr.match(/\b(\w+)\(/g) || [];
      const commonPhaserMethods = ['this.add', 'this.physics', 'this.load', 'this.scene', 'this.input'];
      
      for (const call of functionCalls) {
        const funcName = call.replace('(', '');
        if (funcName === 'undefined' || funcName === 'null') {
          result.errors.push({
            type: 'syntax',
            severity: 'critical',
            file: filename,
            message: `Calling ${funcName} as a function`,
            autoFixable: true
          });
          result.valid = false;
        }
      }
    }

    // 2. ASSET VALIDATION
    
    // Check if referenced assets exist
    if (files['assets.json']) {
      try {
        const assetsMetadata = typeof files['assets.json'] === 'string' 
          ? JSON.parse(files['assets.json']) 
          : files['assets.json'];
        
        if (assetsMetadata.sprites) {
          for (const [key, assetInfo] of Object.entries(assetsMetadata.sprites)) {
            const assetPath = `assets/sprites/${key}.png`;
            const asset = assetInfo as any;
            
            if (!files[assetPath] && !asset.generate) {
              result.warnings.push(`Missing sprite asset: ${assetPath} - will use placeholder`);
            }
            
            // Validate size format
            if (!Array.isArray(asset.size) || asset.size.length !== 2) {
              result.errors.push({
                type: 'missing_asset',
                severity: 'warning',
                file: 'assets.json',
                message: `Invalid size format for sprite '${key}'`,
                suggestion: 'Size should be [width, height] array'
              });
            }
          }
        }
      } catch (e) {
        result.errors.push({
          type: 'syntax',
          severity: 'critical',
          file: 'assets.json',
          message: 'Invalid JSON in assets.json',
          autoFixable: true
        });
        result.valid = false;
      }
    }

    // 3. HTML VALIDATION
    
    if (files['index.html']) {
      const html = String(files['index.html']);
      
      // Check for Phaser CDN
      if (!html.includes('phaser')) {
        result.errors.push({
          type: 'missing_import',
          severity: 'critical',
          file: 'index.html',
          message: 'Phaser library not loaded',
          suggestion: 'Add Phaser CDN: <script src="https://cdn.jsdelivr.net/npm/phaser@3.87.0/dist/phaser.min.js"></script>',
          autoFixable: true
        });
        result.valid = false;
      }

      // Check for game container
      if (!html.includes('game-container') && !html.includes('id="game"')) {
        result.warnings.push('No game container div found - Phaser might not render properly');
      }
    }

    // Determine overall validity
    const criticalErrors = result.errors.filter(e => e.severity === 'critical');
    result.valid = criticalErrors.length === 0;
    result.autoFixable = criticalErrors.every(e => e.autoFixable !== false);

    console.log(`Validation complete: ${result.valid ? 'PASSED' : 'FAILED'}`);
    console.log(`Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);
    console.log(`Auto-fixable: ${result.autoFixable}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in validate-game function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
