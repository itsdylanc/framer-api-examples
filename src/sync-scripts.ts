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

/** Normalize for comparison with Framer's code file names (e.g. leading slash or path sep) */
function normalizeCodeFileName(name: string): string {
    return name.replace(/^\/+|\/+$/g, '').replace(/\\/g, '/');
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
    const existingFiles = await framer.getCodeFiles();
    for (const file of files) {
        const content = fs.readFileSync(path.join(codefilesDir, file), 'utf8');
        const fileName = file.replace(/\.(tsx|ts)$/, '');

        const normalizedFile = normalizeCodeFileName(file);
        const normalizedFileName = normalizeCodeFileName(fileName);
        const ourBasename = path.basename(fileName);
        const existingFile = existingFiles.find((f) => {
            const n = normalizeCodeFileName(f.name);
            const nNoExt = n.replace(/\.(tsx|ts)$/, '');
            const theirBasename = path.basename(nNoExt);
            return (
                n === normalizedFile ||
                n === normalizedFileName ||
                nNoExt === normalizedFileName ||
                (theirBasename === ourBasename && (n.includes('/') || normalizedFileName.includes('/')))
            );
        });

        if (existingFile) {
            console.log(`${fileName} found, updating...`);
            await existingFile.setFileContent(content);
        } else {
            console.log(`${fileName} not found, creating...`);
            await framer.createCodeFile(fileName, content);
        }
    }
} catch (error) {
    console.error('Error syncing scripts:', error);
} finally {
    console.log('Syncing scripts completed. Disconnecting from Framer...');
    framer.disconnect();
}
