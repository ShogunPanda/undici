import { spawn } from 'node:child_process'
import { cp, glob, mkdir, rm } from 'node:fs/promises'
import { basename, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

let verbose = false

function info (message) {
  console.log(`\x1b[33m--- [INFO] ${message}\x1b[0m`)
}

function execute (title, command, ...args) {
  info(`${title} (${command} ${args.join(' ')}) ...`)
  const child = spawn(command, args)

  let stdout = ''
  let stderr = ''
  return new Promise((resolve, reject) => {
    child.stdout.on('data', chunk => {
      stdout += chunk.toString('utf-8')

      if (verbose) {
        process.stdout.write(chunk.toString('utf-8'))
      }
    })

    child.stderr.on('data', chunk => {
      stderr += chunk.toString('utf-8')

      if (verbose) {
        process.stderr.write(chunk.toString('utf-8'))
      }
    })

    child.on('close', code => {
      if (verbose) {
        process.stderr.write('\n')
      }

      if (code !== 0) {
        const error = new Error(`Command failed with code ${code}. Aborting ...`)

        reject(error)
        return
      }

      resolve({ stdout, stderr })
    })
  })
}

function clean () {
  return execute('Cleaning artifacts', 'rm', '-r', '-f', 'lib/milo')
}

function image () {
  return execute(
    'Preparing build image',
    'docker',
    'build',
    '-t',
    'milo_builder',
    '-f',
    './build/milo/Dockerfile',
    './build/milo'
  )
}

async function download () {
  const target = resolve(fileURLToPath(new URL('../../lib/milo', import.meta.url)))

  await rm(target, { recursive: true, force: true })
  await mkdir(target, { recursive: true })

  const args = [
    'run',
    '--mount',
    `type=bind,source=${target},target=/home/node/undici/dist`,
    'milo_builder',
    '/usr/local/bin/build-milo'
  ]

  return execute('Downloading milo in Docker', 'docker', ...args)
}

async function local (source, profile) {
  const root = fileURLToPath(new URL('../..', import.meta.url))
  const target = resolve(root, 'lib/milo')
  source = resolve(root, source)

  await rm(target, { recursive: true, force: true })
  await mkdir(target, { recursive: true })

  for await (const from of glob(resolve(source, `parser/dist/wasm/${profile}/@perseveranza-pets/milo/*`))) {
    if (from.endsWith('.js') || from.endsWith('.ts') || from.endsWith('.wasm')) {
      const to = resolve(target, basename(from))
      info(`Copying ${relative(root, from)} to ${relative(root, to)}`)
      await cp(from, to)
    }
  }
}

async function main () {
  process.chdir(resolve(fileURLToPath(new URL('../..', import.meta.url))))

  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      profile: {
        type: 'string',
        short: 'p',
        default: 'release'
      },
      source: {
        type: 'string',
        short: 's',
        default: '../milo'
      },
      verbose: {
        type: 'boolean',
        short: 'v',
        default: false
      }
    },
    allowPositionals: true
  })

  verbose = values.verbose

  switch (positionals[0]) {
    case 'clean':
      await clean()
      break
    case 'image':
      await image()
      break
    case 'download':
      await download()
      break
    case 'local':
      await local(values.source, values.profile)
      break
    default:
      clean()
      image()
      download()
      break
  }
}

await main()
