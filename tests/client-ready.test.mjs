import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import * as jsxRuntime from 'react/jsx-runtime';
import ts from 'typescript';
import { mapClientReady } from '../utils/client-ready.utils.ts';

const current = { id: 'me', profile: { id: 'me', displayName: 'Me' } };
const payload = { user: current, presences: ['friend'] };
const source = ts.createSourceFile('layout.tsx', fs.readFileSync(new URL('../app/(app)/layout.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const initializer = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'AppInitializer');
const compiled = ts.transpileModule(`${initializer.getText(source)}\nexports.AppInitializer = AppInitializer;`, { compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;

function mount(connected = true) {
    const states = [], requests = [], writes = [], subscriptions = [], timers = [];
    let cursor = 0, effect, cleanup;
    const socket = {
        timeout(milliseconds) { assert.equal(milliseconds, 10000); return this; },
        emitWithAck(event, ...args) { return new Promise((resolve, reject) => requests.push({ event, args, resolve, reject })); },
        emit(event, data) { subscriptions.push({ event, data }); },
    };
    const save = key => value => writes.push({ key, value });
    const stores = {
        useUserProfileStore: () => ({ setUserProfiles: save('profiles') }),
        useUserPresenceStore: () => ({ setPresenceMap: save('presences'), updatePresence: (id, online) => writes.push({ key: 'presence-update', id, online }) }),
        useChannelsStore: () => ({ setChannels: save('channels') }),
        useCurrentUserStore: () => ({ setCurrentUser: save('user') }),
        useGuildsStore: () => ({ setGuilds: save('guilds') }),
    };
    const exports = {};
    vm.runInNewContext(compiled, {
        exports, require: () => jsxRuntime, ...stores, mapClientReady,
        useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
        useEffect(callback) { effect = callback; },
        useSocket: () => ({ socket: connected ? socket : undefined, isReady: connected }),
        setTimeout(callback, milliseconds) { assert.equal(milliseconds, 10000); timers.push(callback); return timers.length; },
        clearTimeout(id) { timers[id - 1] = undefined; },
        CLIENT_READY_EVENT: 'client_ready', GET_USERS_PRESENCE_EVENT: 'get_users_presence',
        SUBSCRIBE_EVENTS: 'subscribe_events', USER_PROFILE_UPDATE_EVENT: 'profile', USER_PRESENCE_UPDATE_EVENT: 'presence',
        BsGithub: () => null,
    });
    const render = () => { cursor = 0; return exports.AppInitializer({ children: 'conversations' }); };
    const run = () => { cleanup?.(); render(); cleanup = effect(); };
    run();
    return { states, requests, writes, subscriptions, timers, render, run, unmount: () => cleanup?.() };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('ready mapping deduplicates profiles and leaves optional collections empty', () => {
    const minimal = mapClientReady(payload);
    assert.equal(minimal.currentUser, current);
    assert.equal(minimal.channels.size, 0);
    assert.equal(minimal.guilds.size, 0);
    assert.deepEqual([...minimal.userProfiles.keys()], ['me']);
    const friend = { id: 'friend' }, guildmate = { id: 'guildmate' };
    const full = mapClientReady({ ...payload,
        relationships: [{ user: friend }],
        dmChannels: [{ id: 'dm', recipients: [current.profile, friend, guildmate] }],
        guilds: [{ id: 'guild', members: [{ profile: guildmate }] }],
    });
    assert.deepEqual([...full.userProfiles.keys()], ['me', 'friend', 'guildmate']);
    assert.equal(full.userProfiles.get('me'), current.profile);
    assert.deepEqual(payload, { user: current, presences: ['friend'] });
});

test('a ready acknowledgement timeout exposes an error and a working retry', async () => {
    const app = mount();
    app.requests[0].reject(new Error('timeout'));
    await flush();
    assert.equal(app.states[0], false);
    const errorView = app.render();
    assert.equal(errorView.props.role, 'alert');
    errorView.props.children[1].props.onClick();
    app.run();
    assert.equal(app.requests.length, 2);
    assert.equal(app.states[0], true);
    assert.equal(app.states[1], null);
    app.requests[1].resolve(payload);
    await flush();
    app.requests[2].resolve(['online']);
    await flush();
    assert.equal(app.render(), 'conversations');
    assert.equal(app.writes.filter(write => write.key !== 'presence-update').length, 5);
    const presence = app.writes.find(write => write.key === 'presences').value;
    assert.equal(presence.get('friend'), true);
    assert.ok(app.writes.some(write => write.key === 'presence-update' && write.id === 'online' && write.online));
});

test('the presence acknowledgement cannot trap the loading screen', async () => {
    const app = mount();
    app.requests[0].resolve(payload);
    await flush();
    assert.equal(app.requests[1].event, 'get_users_presence');
    app.requests[1].reject(new Error('presence timeout'));
    await flush();
    assert.equal(app.states[0], false);
    assert.ok(app.states[1]);
    assert.equal(app.writes.length, 5);
});

test('cleaned-up attempts ignore late acknowledgements', async () => {
    const app = mount();
    app.unmount();
    app.requests[0].resolve(payload);
    await flush();
    assert.equal(app.writes.length, 0);
    assert.equal(app.subscriptions.length, 0);
});

test('waiting for the connection also times out and cleans up its timer', () => {
    const app = mount(false);
    app.timers[0]();
    assert.equal(app.states[0], false);
    assert.ok(app.states[1]);
    app.unmount();
    assert.equal(app.timers[0], undefined);
});
