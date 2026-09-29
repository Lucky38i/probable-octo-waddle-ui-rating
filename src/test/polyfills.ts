import { clearImmediate, setImmediate } from 'node:timers'

// jsdom omits these Node globals, but MSW's Node interceptors rely on them.
Object.assign(globalThis, { setImmediate, clearImmediate })
