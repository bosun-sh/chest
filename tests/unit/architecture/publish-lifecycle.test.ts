import { expect, test } from "bun:test";
import { scripts } from "../../../package.json";

test("npm publishing keeps its preflight gate without a recursive publish lifecycle", () => {
  // npm runs publish hooks after uploading, when the version is already immutable.
  expect(scripts).not.toHaveProperty("publish");
  expect(scripts).not.toHaveProperty("postpublish");
  expect(scripts.prepublishOnly).toBe("bun run ci:premerge");
  expect(scripts["publish:npm"]).toBe("npm publish --access public");
});
