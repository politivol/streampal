export const $ = (q) => document.querySelector(q);
export const el = (tag, props = {}) => Object.assign(document.createElement(tag), props);
