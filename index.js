import AoLoader from '@permaweb/ao-loader'
import WeaveDrive from '@permaweb/weavedrive'
import fs from 'fs'

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
    ['Block-Height']: '1000'
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
  `), { Process })
  console.log(result)
}

main()