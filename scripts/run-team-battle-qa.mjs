const scripts = [
  './qa-team-battle-flow.mjs',
  './qa-team-battle-ui.mjs',
  './qa-team-battle-target-freshness.mjs',
];

for (const script of scripts) {
  try {
    // Run deterministic QA modules in this Node process. This avoids the
    // Windows-host elevation failure that occurs when node.exe launches a
    // child process, while preserving sequential fail-fast behavior.
    await import(new URL(script, import.meta.url));
  } catch (error) {
    console.error(`Team Battle QA failed at ${script}: ${error?.stack || error}`);
    process.exitCode = 1;
    break;
  }
}

if (process.exitCode !== 1) {
  console.log('Team Battle QA chain passed: flow, UI, and target freshness.');
}

