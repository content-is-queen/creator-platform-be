const { describe, it } = require("mocha");

describe("Simple Math Test", () => {
  it("should return 2 when adding 1 + 1", () => {
    const sum = 1 + 1;
    if (sum !== 2) {
      throw new Error(`Expected 1 + 1 to be 2, but got ${sum}`);
    }
  });
});
