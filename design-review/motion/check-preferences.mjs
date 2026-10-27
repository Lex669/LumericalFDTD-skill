// Exercise the actual motion controller's preference/cancellation paths without changing OS settings.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../../docs/motion.js', import.meta.url), 'utf8');

async function scenario(initialReduced) {
  const listeners = new Map();
  const preferenceListeners = new Map();
  const documentListeners = new Map();
  const storage = new Map();
  let started = 0, cancelled = 0;
  const element = () => ({
    hidden: true, disabled: false, textContent: '', attributes: {}, dataset: {},
    classList: { add() {} }, style: { setProperty() {} },
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, handler) { listeners.set(this, { ...listeners.get(this), [name]: handler }); },
    querySelector() { return element(); },
    animate() {
      started++;
      let reject;
      return { finished: new Promise((_, no) => { reject = no; }), cancel() { cancelled++; reject(new Error('cancelled')); } };
    },
  });
  const page = element(), control = element(), artwork = element(), theme = element();
  const preference = { matches: initialReduced, addEventListener(name, callback) { preferenceListeners.set(name, callback); } };
  const document = {
    documentElement: page, hidden: false, fonts: { ready: Promise.resolve() },
    getElementById(id) { return id === 'motion-toggle' ? control : theme; },
    querySelector(selector) { return selector === '.optics-art' ? artwork : selector === '.history' ? null : element(); },
    querySelectorAll() { return []; },
    addEventListener(name, handler) { documentListeners.set(name, handler); },
  };
  vm.runInNewContext(source, {
    document,
    window: { matchMedia() { return preference; }, addEventListener() {} },
    localStorage: { getItem(key) { return storage.get(key); }, setItem(key, value) { storage.set(key, value); } },
    requestAnimationFrame(callback) { callback(); },
  });
  await Promise.resolve();
  assert.equal(control.hidden, false);
  assert.equal(page.dataset.motion, initialReduced ? 'reduced' : 'running');
  assert.equal(control.disabled, initialReduced);
  assert.equal(started, initialReduced ? 0 : 6);
  if (!initialReduced) {
    document.hidden = true;
    documentListeners.get('visibilitychange')();
    assert.equal(page.dataset.waveActive, 'false');
    assert.equal(cancelled, started, 'Backgrounding must cancel in-flight animation');
    document.hidden = false;
    documentListeners.get('visibilitychange')();
    assert.equal(page.dataset.waveActive, 'true');
    preference.matches = true;
    preferenceListeners.get('change')();
    await Promise.resolve();
    assert.equal(page.dataset.motion, 'reduced');
    assert.equal(cancelled, started, 'Preference change must cancel in-flight JS animation');
  }
  preference.matches = false;
  preferenceListeners.get('change')();
  assert.equal(control.disabled, false);
  assert.equal(page.dataset.motion, 'running');
  listeners.get(control).click();
  assert.equal(page.dataset.motion, 'paused');
  assert.equal(storage.get('fdtd-motion'), 'paused');
  listeners.get(control).click();
  assert.equal(page.dataset.motion, 'running');
  return { initialReduced, started, cancelled, manualPause: 'passed' };
}
console.log(await scenario(true));
console.log(await scenario(false));
