import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import axios from 'axios';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import ts from 'typescript';

function mountAuth() {
    const effects = [];
    const refreshes = [];
    const replays = [];
    const redirects = [];
    const authorization = [];
    let rejectResponse;
    let cleanup;
    const api = {
        interceptors: { response: {
            use(_success, failure) { rejectResponse = failure; return 1; },
            eject() { cleanup = true; },
        } },
        request(config) { replays.push(config); return Promise.resolve({ data: 'replayed' }); },
    };
    const useCurrentUserStore = () => ({ isAuthorized: false });
    useCurrentUserStore.getState = () => ({ setIsAuthorized(value) { authorization.push(value); } });
    const modules = {
        '@/app/stores/current-user-store': { useCurrentUserStore },
        '@/services/api': { api },
        '@/services/auth/auth.service': { refreshToken: () => new Promise(resolve => refreshes.push(resolve)) },
        'next/navigation': { useRouter: () => ({ push: value => redirects.push(value) }) },
        react: { ...React, useRef: value => ({ current: value }), useEffect: effect => effects.push(effect) },
        axios,
        'react/jsx-runtime': jsxRuntime,
    };
    const source = fs.readFileSync(new URL('../contexts/auth.context.tsx', import.meta.url), 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: {
        module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    const exports = {};
    vm.runInNewContext(output, { exports, require(name) {
        assert.ok(Object.hasOwn(modules, name), `Unexpected dependency: ${name}`);
        return modules[name];
    } });
    exports.AuthProvider({ children: null });
    const unmount = effects[0]();
    return { refreshes, replays, redirects, authorization, reject: error => rejectResponse(error), unmount, cleaned: () => cleanup };
}

function unauthorized(config = {}) {
    return new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, { status: 401 });
}

test('network, cancellation, non-401 and missing-config errors retain their identity', async () => {
    const auth = mountAuth();
    auth.refreshes[0]({ success: true });
    await new Promise(resolve => setImmediate(resolve));
    const noConfig = unauthorized();
    delete noConfig.config;
    for (const error of [
        new axios.AxiosError('Offline', 'ERR_NETWORK'),
        new axios.CanceledError('Cancelled'),
        new axios.AxiosError('Server failed', undefined, {}, undefined, { status: 500 }),
        new Error('Non-Axios failure'), noConfig, unauthorized({ _retry: true }),
    ]) {
        await assert.rejects(auth.reject(error), received => received === error);
    }
    assert.equal(auth.refreshes.length, 1);
    assert.equal(auth.replays.length, 0);
    auth.unmount();
    assert.equal(auth.cleaned(), true);
});

test('concurrent 401s share startup refresh, replay once, and can start a later refresh', async () => {
    const auth = mountAuth();
    const errors = [unauthorized({ url: '/a' }), unauthorized({ url: '/b' }), unauthorized({ url: '/c' })];
    const requests = errors.map(error => auth.reject(error));
    assert.equal(auth.refreshes.length, 1);
    auth.refreshes[0]({ success: true });
    await Promise.all(requests);
    assert.deepEqual(auth.replays, errors.map(error => error.config));
    assert.ok(errors.every(error => error.config._retry));
    const later = auth.reject(unauthorized({ url: '/later' }));
    assert.equal(auth.refreshes.length, 2);
    auth.refreshes[1]({ success: true });
    await later;
    assert.equal(auth.replays.length, 4);
});

test('a failed shared refresh rejects each original request and redirects once', async () => {
    const auth = mountAuth();
    const first = unauthorized({ url: '/first' });
    const second = unauthorized({ url: '/second' });
    const failures = [
        assert.rejects(auth.reject(first), error => error === first),
        assert.rejects(auth.reject(second), error => error === second),
    ];
    assert.equal(auth.refreshes.length, 1);
    auth.refreshes[0]({ success: false });
    await Promise.all(failures);
    assert.deepEqual(auth.redirects, ['/login']);
    assert.deepEqual(auth.authorization, [false]);
    assert.equal(auth.replays.length, 0);
    const retry = auth.reject(unauthorized({ url: '/retry' }));
    assert.equal(auth.refreshes.length, 2);
    auth.refreshes[1]({ success: true });
    await retry;
});
