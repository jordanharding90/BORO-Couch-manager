import { execSync } from 'child_process';

export function run(cmd: string) {
  console.log('> ' + cmd);
  return execSync(cmd, { stdio: 'inherit' });
}
