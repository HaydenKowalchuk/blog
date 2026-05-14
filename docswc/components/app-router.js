export const router = {
  get path() {
    return location.hash.slice(1) || '/';
  },
  navigate(path) {
    location.hash = '#' + path;
  },
  listen(fn) {
    window.addEventListener('hashchange', () => fn(this.path));
    // Call immediately when listen is registered
    fn(this.path);
  }
};
