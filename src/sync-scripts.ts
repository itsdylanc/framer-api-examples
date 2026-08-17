import { connect } from 'framer-api';
import fs from 'fs';
import path from 'path';

const projectUrl = process.env.FRAMER_PROJECT_URL;
if (!projectUrl) {
    console.error('FRAMER_PROJECT_URL environment variable is required');
    process.exit(1);
}

using framer = await connect(projectUrl);

const codefilesDir = './src/codeFiles';

function normalizeCodeFilePath(value: string): string {
    return value.replace(/^\/+|\/+$/g, '').replace(/\\/g, '/');
}

function stripCodeExt(value: string): string {
    return value.replace(/\.(tsx|ts)$/, '');
}

/** `components/CTAButton_2.tsx` → `{ dir: "components", stem: "CTAButton" }` */
function pathStem(value: string): { dir: string; stem: string } {
    const noExt = stripCodeExt(normalizeCodeFilePath(value));
    const sep = noExt.lastIndexOf('/');
    const base = sep === -1 ? noExt : noExt.slice(sep + 1);
    return {
        dir: sep === -1 ? '' : noExt.slice(0, sep),
        stem: base.replace(/_\d+$/, '')
    };
}

function suffixNumber(value: string): number {
    const base = stripCodeExt(normalizeCodeFilePath(value)).split('/').pop() ?? '';
    const match = base.match(/_(\d+)$/);
    return match ? Number(match[1]) : 0;
}

function findExistingFile<T extends { name: string; path: string }>(
    existingFiles: readonly T[],
    localPath: string
): T | undefined {
    const local = normalizeCodeFilePath(localPath);
    const localNoExt = stripCodeExt(local);
    const localParts = pathStem(local);

    const exact = existingFiles.find((f) => {
        const p = normalizeCodeFilePath(f.path);
        const n = normalizeCodeFilePath(f.name);
        return p === local || n === local || stripCodeExt(p) === localNoExt || stripCodeExt(n) === localNoExt;
    });
    if (exact) return exact;

    const sameDir = existingFiles.filter((f) => {
        const parts = pathStem(f.path || f.name);
        return parts.dir === localParts.dir && parts.stem === localParts.stem;
    });
    if (sameDir.length > 0) {
        return [...sameDir].sort((a, b) => suffixNumber(a.path) - suffixNumber(b.path))[0];
    }

    const sameStem = existingFiles.filter((f) => pathStem(f.path || f.name).stem === localParts.stem);
    if (sameStem.length === 0) return undefined;
    return [...sameStem].sort((a, b) => suffixNumber(a.path || a.name) - suffixNumber(b.path || b.name))[0];
}

/** get all .ts/.tsx files relative to codefilesDir */
function getCodeFilePaths(dir: string, baseDir: string = dir): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const paths: string[] = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);
        if (entry.isDirectory()) {
            paths.push(...getCodeFilePaths(fullPath, baseDir));
        } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
            paths.push(relativePath);
        }
    }
    return paths;
}

const files = getCodeFilePaths(codefilesDir);

try {
    const existingFiles = [...(await framer.getCodeFiles())];
    for (const file of files) {
        const content = fs.readFileSync(path.join(codefilesDir, file), 'utf8');
        const localPath = normalizeCodeFilePath(file);
        const existingFile = findExistingFile(existingFiles, localPath);

        if (existingFile) {
            console.log(`${localPath} found as ${existingFile.path}, updating...`);
            await existingFile.setFileContent(content);
        } else {
            console.log(`${localPath} not found, creating...`);
            // Include the extension. A path like "components/CTAButton" (no ext)
            // is unique-ified to components/CTAButton_1.tsx.
            const created = await framer.createCodeFile(localPath, content);
            console.log(`  created ${created.path}`);
            existingFiles.push(created);
        }
    }
} catch (error) {
    console.error('Error syncing scripts:', error);
} finally {
    console.log('Syncing scripts completed. Disconnecting from Framer...');
    framer.disconnect();
}
