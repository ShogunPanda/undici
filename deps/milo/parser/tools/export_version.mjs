import { readFile, writeFile } from 'node:fs/promises'

const buildInfoPath = new URL('../target/buildinfo.json', import.meta.url)
const profile = process.argv[2] === 'debug' ? 'debug' : 'release'
const headerPath = new URL(`../dist/${profile}/milo.h`, import.meta.url)
const toReplace = `namespace milo {\n\n`
const matcher = new RegExp(`^(?:${toReplace})$`, 'm')

const {
  version: { major, minor, patch },
  constants
} = JSON.parse(await readFile(buildInfoPath, 'utf-8'))

// The methods map is required by Node
const methods = Object.entries(constants)
  .filter(p => p[0].startsWith('METHOD_'))
  .map(([k, v]) => [k.replace('METHOD_', ''), v])

const code = `
#define MILO_VERSION "${major}.${minor}.${patch}"
#define MILO_VERSION_MAJOR ${major}
#define MILO_VERSION_MINOR ${minor}
#define MILO_VERSION_PATCH ${patch}

#define MILO_METHODS_MAP(EACH) \\
${methods.map(([v, i]) => `  EACH(${i}, ${v}, ${v}) \\`).join('\n')}

namespace milo {

struct Parser;
`.trim()

const header = await readFile(headerPath, 'utf-8')
await writeFile(headerPath, header.replace(matcher, code), 'utf-8')
