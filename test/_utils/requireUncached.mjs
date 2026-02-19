//
// Because require'ing config creates and caches a global singleton,
// We have to invalidate the cache to build new object based on the environment variables above
import Path from 'path';

let count = 0;

export async function requireUncached(moduleName) {
  let path = Path.resolve(process.cwd(), moduleName);
  let module = await import(`${path}?c=${count++}`);
  return module.default;
}
