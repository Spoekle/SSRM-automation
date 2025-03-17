const fs = require('fs');
const path = require('path');

// Check if the clean.js script exists
const cleanScriptPath = path.join(__dirname, 'clean.js');
if (!fs.existsSync(cleanScriptPath)) {
  console.error(`ERROR: Clean script not found at ${cleanScriptPath}`);
  process.exit(1);
}

console.log('All build scripts found successfully!');
