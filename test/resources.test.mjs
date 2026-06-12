import test from "node:test";
import assert from "node:assert/strict";
import { RESOURCES } from "../dist/resources.js";
import { NANKAI_FACTS } from "../dist/data/nankai.js";

test("all four reference resources are present with nankai:// URIs", () => {
  const names = RESOURCES.map((r) => r.name).sort();
  assert.deepEqual(names, ["building-standards", "headline-figures", "shindo-scale", "sources"]);
  for (const r of RESOURCES) {
    assert.match(r.uri, /^nankai:\/\//, `${r.name} must use a nankai:// URI`);
    assert.ok(r.description.length > 20, `${r.name} must carry a real description`);
  }
});

test("every resource renders non-trivial markdown that cites an official source", () => {
  for (const r of RESOURCES) {
    const md = r.render();
    assert.ok(md.length > 200, `${r.name} render must be substantive`);
    assert.ok(md.startsWith("# "), `${r.name} must render a markdown H1`);
    assert.match(md, /https:\/\/[^\s)]+\.go\.jp/, `${r.name} must cite a .go.jp source`);
  }
});

test("headline-figures resource stays in sync with NANKAI_FACTS (rendered from the same data)", () => {
  const md = RESOURCES.find((r) => r.name === "headline-figures").render();
  for (const f of NANKAI_FACTS) {
    assert.ok(md.includes(f.value), `resource must include the live value for "${f.key}"`);
  }
  assert.doesNotMatch(md, /\b80%\s*程度\b|single 80%/, "must not resurrect the retired single 80%");
});
