import fs from 'fs';
import path from 'path';

const searchDirs = [
  'src/modules/product',
  'src/modules/node',
  'src/modules/bom',
  'src/modules/execution',
  'src/modules/traceability',
  'src/modules/work-order'
];

let violations = [];

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p, callback);
    } else {
      callback(p);
    }
  }
}

for (const dir of searchDirs) {
  walk(dir, (file) => {
    if (!file.endsWith('.ts')) return;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let hasPolicy = false;
    
    // Check for specific file issues
    if (file.endsWith('.controller.ts')) {
      for (let i = 0; i < lines.length; i++) {
        // Find return ok() missing .message
        // simplistic regex, might miss some multiline cases
        if (lines[i].match(/return ok\(/) && !lines[i].includes('.message') && !lines[i+1]?.includes('.message')) {
          violations.push({ file, line: i + 1, issue: 'ok() missing .message(...)' });
        }
      }
    }

    if (file.endsWith('.service.ts') || file.endsWith('.controller.ts')) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('throw new Error(')) {
          violations.push({ file, line: i + 1, issue: 'raw throw new Error()' });
        }
        if (lines[i].includes('process.env')) {
          violations.push({ file, line: i + 1, issue: 'direct process.env usage' });
        }
      }
    }

    const anyRegex = /[^a-zA-Z0-9_$]any[^a-zA-Z0-9_$]/;
    for (let i = 0; i < lines.length; i++) {
      if (anyRegex.test(lines[i]) && !lines[i].includes('// eslint') && !lines[i].includes('/*')) {
        // filter out many false positives with simple check
        if (lines[i].includes(': any') || lines[i].includes('<any>') || lines[i].includes('as any')) {
          violations.push({ file, line: i + 1, issue: 'found `any` type usage' });
        }
      }
    }
  });
}

// Check if each module has a policy file
for (const dir of searchDirs) {
  const moduleName = path.basename(dir);
  const policyFile = path.join(dir, `${moduleName}.policy.ts`);
  if (!fs.existsSync(policyFile)) {
    violations.push({ file: dir, line: 0, issue: `Missing ${moduleName}.policy.ts` });
  } else {
    const policyContent = fs.readFileSync(policyFile, 'utf8');
    if (!policyContent.includes('extends BasePolicy')) {
      violations.push({ file: policyFile, line: 0, issue: 'Does not extend BasePolicy' });
    }
  }
}

console.log(JSON.stringify(violations, null, 2));
