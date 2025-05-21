#!/usr/bin/env node

/**
 * Script to run load tests for Team Polls application
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure the results directory exists
const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

// Generate a timestamp for the results file
const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const resultsFile = path.join(resultsDir, `load-test-results-${timestamp}.json`);

console.log('Starting load tests...');
console.log(`Results will be saved to: ${resultsFile}`);

// Run Artillery with the scenarios file
const artillery = spawn('npx', [
  'artillery',
  'run',
  '--output',
  resultsFile,
  path.join(__dirname, 'scenarios.yml')
]);

// Forward output to console
artillery.stdout.on('data', (data) => {
  process.stdout.write(data);
});

artillery.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle completion
artillery.on('close', (code) => {
  if (code === 0) {
    console.log('\nLoad tests completed successfully!');
    console.log('Generating HTML report...');
    
    // Generate HTML report
    const reportFile = resultsFile.replace('.json', '.html');
    const report = spawn('npx', [
      'artillery',
      'report',
      '--output',
      reportFile,
      resultsFile
    ]);
    
    report.on('close', (reportCode) => {
      if (reportCode === 0) {
        console.log(`HTML report generated: ${reportFile}`);
        console.log('\nLoad test summary:');
        console.log('==================');
        console.log('1. Simulated up to 500 concurrent users');
        console.log('2. Tested anonymous authentication, poll viewing, and voting');
        console.log('3. Tested poll creation and immediate voting');
        console.log(`4. Full results available in ${reportFile}`);
      } else {
        console.error(`Failed to generate HTML report (exit code: ${reportCode})`);
      }
    });
  } else {
    console.error(`Load tests failed with exit code: ${code}`);
  }
});
