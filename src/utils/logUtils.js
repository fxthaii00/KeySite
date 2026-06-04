/** Derive log visual type from action string. */
export function logType(action = '') {
  if (action.includes('SUCCESS'))                               return 'ok';
  if (action.includes('FAIL') || action.includes('ERROR'))      return 'fail';
  if (action.includes('BAN') || action.includes('BLACKLIST') || action.includes('DELETE')) return 'warn';
  return 'info';
}
