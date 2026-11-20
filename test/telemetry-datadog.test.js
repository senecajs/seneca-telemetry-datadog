const ChildProcess = require('node:child_process')
const Path = require('node:path')

const Seneca = require('seneca')

const TelemetryDatadog = require('../src/telemetry-datadog.js')


// A tracer with the part of the dd-trace API that the plugin uses:
// tracer.trace(name, fn(span, done)) and span.addTags(tags).
function makeFakeTracer() {
  const spans = []
  return {
    spans,
    trace(name, fn) {
      const span = {
        name,
        tags: {},
        done: [],
        addTags(tags) {
          Object.assign(this.tags, tags)
          return this
        },
      }
      spans.push(span)
      return fn(span, (err) => span.done.push(err))
    },
  }
}


function makeSeneca(options) {
  return Seneca({ legacy: false })
    .test('silent')
    .use(TelemetryDatadog, options)

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

    .add('d:1', function d1(msg, reply) {
      reply({ y: msg.y })
    })

    .message('e:1', async function e0(msg) {
      return { e: msg.v }
    })

    .message('e:1', async function e1(msg) {
      return this.prior({ ...msg, v: 2 })
    })
}


describe('telemetry-datadog', () => {

  test('load', async () => {
    const tracer = makeFakeTracer()
    const seneca = Seneca({ legacy: false })
      .test()
      .use(TelemetryDatadog, { getTracer: () => tracer })
    await seneca.ready()
    expect(seneca.has_plugin('telemetry_datadog')).toBe(true)
  })


  test('span-per-action', async () => {
    const tracer = makeFakeTracer()
    const seneca = makeSeneca({ getTracer: () => tracer })
    await seneca.ready()
    const start = tracer.spans.length

    expect(await seneca.post('a:1', { x: 1 })).toEqual({ x: 2 })
    expect(await seneca.post('d:1', { y: 3 })).toEqual({ y: 3 })

    const spans = tracer.spans.slice(start)
    expect(spans.map((s) => s.name)).toEqual(['a:1', 'd:1'])
    expect({ ...spans[0].tags.pattern }).toEqual({ a: 1 })
    expect({ ...spans[1].tags.pattern }).toEqual({ d: 1 })

    // Each span ends once, without an error. The plugin passes the first
    // argument of the reply to done(), which is the result when the action
    // replies with reply(result). dd-trace records only an Error.
    spans.forEach((s) => {
      expect(s.done.length).toEqual(1)
      expect(s.done[0] instanceof Error).toBe(false)
    })
  })


  test('nested-and-prior', async () => {
    const tracer = makeFakeTracer()
    const seneca = makeSeneca({ getTracer: () => tracer })
    await seneca.ready()
    const start = tracer.spans.length

    expect(await seneca.post('b:1', { x: 1 })).toEqual({ x: 4 })
    expect(await seneca.post('e:1', {})).toEqual({ e: 2 })

    const spans = tracer.spans.slice(start)
    expect(spans.map((s) => s.name)).toEqual(['b:1', 'a:1', 'e:1', 'e:1'])
    spans.forEach((s) => expect(s.done.length).toEqual(1))
  })


  test('error', async () => {
    const tracer = makeFakeTracer()
    const seneca = makeSeneca({ getTracer: () => tracer })
    await seneca.ready()
    const start = tracer.spans.length

    await expect(seneca.post('c:1', {})).rejects.toThrow('BAD')

    const spans = tracer.spans.slice(start)
    expect(spans.map((s) => s.name)).toEqual(['c:1'])
    expect(spans[0].done.length).toEqual(1)
    expect(spans[0].done[0].message).toEqual('BAD')
  })


  test('not-found', async () => {
    const tracer = makeFakeTracer()
    const seneca = makeSeneca({ getTracer: () => tracer })
    await seneca.ready()
    const start = tracer.spans.length

    await expect(seneca.post('not:found', {}))
      .rejects.toMatchObject({ code: 'act_not_found' })
    expect(tracer.spans.length).toEqual(start)
  })


  test('invalid-getTracer', async () => {
    const errs = []
    const seneca = Seneca({ legacy: false, debug: { undead: true } })
      .test((err) => errs.push(err), 'silent')
    seneca.use(TelemetryDatadog, { getTracer: 'not-a-function' })
    await seneca.ready()
    expect(errs.map((err) => err.code)).toEqual(['plugin_define_failed'])
  })


  // Without getTracer the plugin uses the tracer that dd-trace exports,
  // which does nothing until init() is called.
  test('default-tracer', async () => {
    const seneca = makeSeneca()
    await seneca.ready()
    expect(await seneca.post('b:1', { x: 1 })).toEqual({ x: 4 })
    await expect(seneca.post('c:1', {})).rejects.toThrow('BAD')
  })


  // A real dd-trace tracer, started with init() in a child process. The
  // log exporter writes the spans to standard output, so no Datadog agent
  // is needed.
  test('dd-trace', () => {
    const out = ChildProcess.execFileSync(
      process.execPath,
      [Path.join(__dirname, 'dd-trace-log.js')],
      {
        encoding: 'utf8',
        timeout: 60000,
        env: {
          ...process.env,
          DD_TRACE_EXPERIMENTAL_EXPORTER: 'log',
          DD_TRACE_STARTUP_LOGS: 'false',
          DD_REMOTE_CONFIGURATION_ENABLED: 'false',
          DD_INSTRUMENTATION_TELEMETRY_ENABLED: 'false',
          DD_CRASHTRACKING_ENABLED: 'false',
          DD_SERVICE: 'telemetry-datadog-test',
        },
      }
    )

    const spans = out
      .split('\n')
      .filter((line) => line.startsWith('{"traces":'))
      .flatMap((line) => JSON.parse(line).traces.flat())

    const byName = (name) => spans.filter((s) => s.name === name)

    const a1 = byName('a:1')
    const b1 = byName('b:1')
    const c1 = byName('c:1')

    expect(a1.length).toEqual(1)
    expect(b1.length).toEqual(1)
    expect(c1.length).toEqual(1)

    expect(a1[0].resource).toEqual('a:1')
    expect(a1[0].service).toEqual('telemetry-datadog-test')
    expect(a1[0].error).toEqual(0)
    expect(a1[0].metrics['pattern.a']).toEqual(1)
    expect(b1[0].error).toEqual(0)

    expect(c1[0].error).toEqual(1)
    expect(c1[0].meta['error.message']).toEqual('BAD')
  })

})
