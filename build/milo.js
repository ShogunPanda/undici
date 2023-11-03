#!/usr/bin/env node
'use strict'

const { execSync } = require('child_process')
const { resolve } = require('path')

const ROOT = resolve(__dirname, '../')
const SOURCE_DIRECTORY = resolve(ROOT, 'deps/milo')
const TARGET_DIRECTORY = resolve(ROOT, 'lib/milo')
const DOCKERFILE = resolve(__dirname, './Dockerfile')
const action = process.argv[2]
const miloProfile = (process.argv[3] ?? process.env.MILO_PROFILE) === 'debug' ? 'debug' : 'release'

let platform = process.env.WASM_PLATFORM

function ensurePlatform () {
  if (!platform && process.argv[2]) {
    platform = execSync('docker info -f "{{.OSType}}/{{.Architecture}}"').toString().trim()
  }
}

function execute (cmd) {
  console.log(`> ${cmd}\n`)
  execSync(cmd, { stdio: 'inherit' })
}

function copyArtifacts () {
  const artifacts = resolve(SOURCE_DIRECTORY, `parser/dist/wasm/${miloProfile}/no-copy`)

  execute(`rm -rf "${TARGET_DIRECTORY}"`)
  execute(`cp -a "${artifacts}" "${TARGET_DIRECTORY}"`)
}

function clean () {
  execute('rm -rf deps/milo/dist deps/milo/target lib/milo')
}

function download () {
  process.chdir(resolve(SOURCE_DIRECTORY, '..'))

  execute('rm -rf milo')
  execute('curl -sSL -o milo.zip https://github.com/ShogunPanda/milo/archive/refs/heads/main.zip')
  execute('unzip milo.zip')
  execute('mv milo-main milo')
  execute('rm -rf milo.zip milo/benchmarks milo/docs milo/references')
  execute('rm -rf milo/.gitignore milo/CHANGELOG.md milo/CODE_OF_CONDUCT.md milo/LICENSE.md milo/README.md milo/macros/README.md milo/parser/README.md')
}

function buildImage () {
  const cmd = `docker build --platform=${platform.toString().trim()} -t milo_builder -f ${DOCKERFILE} ${ROOT}`

  console.log(`> ${cmd}\n\n`)
  execute(cmd, { stdio: 'inherit' })
}

function runInDocker () {
  let cmd = `docker run --rm -it --platform=${platform.toString().trim()}`

  if (process.platform === 'linux') {
    cmd += ` --user ${process.getuid()}:${process.getegid()}`
  }

  cmd += ` --mount type=bind,source="${SOURCE_DIRECTORY}",target="/home/milo" --mount type=bind,source="${__filename}",target="/usr/local/bin/build-milo",readonly milo_builder /usr/local/bin/build-milo`
  execute(cmd)

  copyArtifacts()
}

function build () {
  process.chdir(resolve(SOURCE_DIRECTORY, 'parser'))
  execute(`make -B wasm-${miloProfile}-no-copy`, { stdio: 'inherit' })
}

switch (action) {
  case 'clean':
    clean()
    break
  case 'download':
    download()
    break
  case 'image':
    ensurePlatform()
    buildImage()
    break
  case 'docker':
    ensurePlatform()
    runInDocker()
    break
  case 'local':
    build()
    copyArtifacts()
    break
  default:
    build()
}
