import AoLoader from '@permaweb/ao-loader'
import WeaveDrive from '@permaweb/weavedrive'
import fs from 'fs'

const FIVE_GB = 5 * 1024 * 1024 * 1024
const TWO_GB = 2 * 1024 * 1024 * 1024

export function splitArrayBuffer(ab, chunkSize) {
  const chunks = []
  const totalBytes = ab.byteLength

  for (let i = 0; i < totalBytes; i += chunkSize) {
    const end = Math.min(i + chunkSize, totalBytes)
    chunks.push(ab.slice(i, end))
  }

  return chunks
}

export function concatArrayBuffers(abs) {
  const totalLength = abs.reduce((sum, ab) => sum + ab.byteLength, 0)

  const newGuy = new ArrayBuffer(totalLength)
  const view = new Uint8Array(newGuy)

  let offset = 0
  abs.forEach((cur) => {
    view.set(new Uint8Array(cur), offset)
    offset += cur.byteLength
  })

  return newGuy
}

const wasm = fs.readFileSync('./llama.wasm')
/**
 * `
ModelID = ModelID or "Pr2YVrxd7VwNdg6ekC0NXWNKXxJbfTlHhhlrKbAd1dA"
Llama = Llama or nil

function Init()
  Llama = require("llama")
  Llama.logLevel = 4
  Llama.load("/data/" .. ModelID)
end

Init()
return "Loaded Llama"
  `
*/

const createMsg = function (data) {
  return ({
    Id: 'Foo',
    Target: 'Process',
    Owner: 'Test',
    Tags: [
      { name: 'Data-Protocol', value: 'ao' },
      { name: 'Type', value: 'Message' },
      { name: 'Action', value: 'Eval' }
    ],
    Data: data,
    Module: '1234',
    ['Block-Height']: '1000',
    Timestamp: Date.now()
  })
}

const Process = {
  Owner: "Test",
  Id: "Test2",
  Tags: [
    { name: 'Data-Protocol', value: 'ao' },
    { name: 'Type', value: 'Process' },
    { name: 'Extension', value: 'Weave-Drive' }
  ]
}

const Module = {
  Owner: 'Test',
  Id: 'BlucTh6AJQvcbhNPa1t1UpNgHTM7UEmR0czYdAdCxXg',
  Tags: []
}

async function main() {
  const handle = await AoLoader((imports, cb) =>
    WebAssembly.instantiate(wasm, imports).then((result) => cb(result.instance)), {
    format: 'wasm64-unknown-emscripten-draft_2024_02_15',
    WeaveDrive: WeaveDrive,
    ARWEAVE: 'https://arweave.net',
    mode: "test",
    blockHeight: 100,
    spawn: {
      "Scheduler": "TEST_SCHED_ADDR"
    },
    process: {
      id: "TEST_PROCESS_ID",
      owner: "TEST_PROCESS_OWNER",
      tags: [
        { name: "Extension", value: "Weave-Drive" }
      ]
    }
  })

  const result = await handle(null, createMsg(`
ModelID = ModelID or "Pr2YVrxd7VwNdg6ekC0NXWNKXxJbfTlHhhlrKbAd1dA"
Llama = Llama or nil

function Init()
  Llama = require("llama")
  Llama.logLevel = 4
  Llama.load("/data/" .. ModelID)
end

Init()
return "Loaded Llama"
  `), { Process })
  // console.log(result)
  console.log('splitting into chunks')
  const buffArray = splitArrayBuffer(result.Memory, TWO_GB)
  console.log('combining chunks')
  const newMemory = concatArrayBuffers(buffArray)
  console.log('running new memory')
  const result2 = await handle(newMemory, createMsg(`
Llama.setPrompt("Tell a Dad Joke")
return Llama.run(30)
`), { Process })
  console.log(result2.Output)
}

main()