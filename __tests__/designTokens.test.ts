import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

const styledSourceRoots = ["components", "screens"];

function listSourceFiles(root: string): string[] {
  const absoluteRoot = path.join(process.cwd(), root);

  return readdirSync(absoluteRoot).flatMap((entry) => {
    const absolutePath = path.join(absoluteRoot, entry);
    const relativePath = path.relative(process.cwd(), absolutePath);
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      return listSourceFiles(relativePath);
    }

    if (/\.(ts|tsx)$/.test(entry)) {
      return [relativePath];
    }

    return [];
  });
}

describe("design token usage", () => {
  it("does not hardcode colors in screens or components", () => {
    for (const filePath of styledSourceRoots.flatMap(listSourceFiles)) {
      const source = readFileSync(path.join(process.cwd(), filePath), "utf8");

      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}|rgba?\([0-9]/);
    }
  });
});
