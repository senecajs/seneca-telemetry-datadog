// Run by telemetry-datadog.test.js in a child process, with the dd-trace
// log exporter, which writes finished spans to standard output.

const Tracer = require('dd-trace').init()

const Seneca = require('seneca')
const TelemetryDatadog = require('../src/telemetry-datadog.js')


run().catch((err) => {
  console.error(err)
  process.exit(1)
})


async function run() {
  const seneca = Seneca({ legacy: false })
    .test('silent')
    .use(TelemetryDatadog, { getTracer: () => Tracer })

    .message('a:1', async function a1(msg) {
      return { x: 1 + msg.x }
    })

    .message('b:1', async function b1(msg) {
      const out = await this.post('a:1', { x: msg.x })
      return { x: 2 * out.x }
    })

    .message('c:1', async function c1(msg) {
      throw new Error('BAD')
    })

  await seneca.ready()

  await seneca.post('b:1', { x: 1 })

  try {
    await seneca.post('c:1', {})
  } catch (err) {
    // expected
  }

  await seneca.close()
}
