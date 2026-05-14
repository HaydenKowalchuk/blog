class AppStore extends EventTarget {
  #state = {};
  #listeners = new Map();

  #getByPath(obj, parts) {
    let cur = obj;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[p];
    }
    return cur;
  }

  #setByPath(obj, parts, value) {
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') {
        cur[parts[i]] = {};
      }
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  get(path, fallback) {
    const val = this.#getByPath(this.#state, path.split('.'));
    return val !== undefined ? val : fallback;
  }

  set(path, value) {
    this.#setByPath(this.#state, path.split('.'), value);
    // Notify exact path listeners
    const exact = this.#listeners.get(path);
    if (exact) exact.forEach(fn => fn(value));
    // Notify wildcard listeners (parent paths)
    for (const [key, fns] of this.#listeners) {
      if (key !== path && (path.startsWith(key + '.') || key.startsWith(path + '.'))) {
        fns.forEach(fn => fn(this.get(key)));
      }
    }
  }

  subscribe(path, fn) {
    if (!this.#listeners.has(path)) this.#listeners.set(path, new Set());
    this.#listeners.get(path).add(fn);
    return () => {
      const s = this.#listeners.get(path);
      if (s) s.delete(fn);
    };
  }
}

export const store = new AppStore();
