import { reporterLabel } from "../server/api/busArchive";

describe("reporterLabel", () => {
  // The module emits a one-time console.warn when called with an empty salt.
  // That is deliberate production behavior but pure noise in test output, so
  // we silence it here. The warning logic itself is covered indirectly by
  // the "empty salt" assertion below: if the warning ever became a throw,
  // that assertion would fail loudly.
  let warnSpy: jest.SpyInstance;
  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("returns the literal 'deleted' for a null reporter id", () => {
    expect(reporterLabel(null, "anything")).toBe("deleted");
    expect(reporterLabel(null, "")).toBe("deleted");
  });

  it("emits a 6-character hex string for a present reporter", () => {
    const label = reporterLabel("user-123", "salt-v1");
    expect(label).toHaveLength(6);
    expect(label).toMatch(/^[0-9a-f]{6}$/);
  });

  it("is stable for the same reporter id under the same salt", () => {
    const a = reporterLabel("user-123", "salt-v1");
    const b = reporterLabel("user-123", "salt-v1");
    expect(a).toBe(b);
  });

  it("produces different labels for different reporters under the same salt", () => {
    const a = reporterLabel("user-123", "salt-v1");
    const b = reporterLabel("user-456", "salt-v1");
    expect(a).not.toBe(b);
  });

  it("produces a different label for the same reporter after a salt rotation", () => {
    const before = reporterLabel("user-123", "salt-v1");
    const after = reporterLabel("user-123", "salt-v2");
    expect(before).not.toBe(after);
  });

  it("treats an empty salt as a salt (deterministic but not protective)", () => {
    const a = reporterLabel("user-123", "");
    const b = reporterLabel("user-123", "");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{6}$/);
  });
});
