import { connect } from 'framer-api';
import fs from 'fs';
import path from 'path';

const projectUrl = process.env.FRAMER_PROJECT_URL;
if (!projectUrl) {
    console.error('FRAMER_PROJECT_URL environment variable is required');
    process.exit(1);
}

using framer = await connect(projectUrl);

const codefilesDir = './src/codefiles';
const files = fs.readdirSync(codefilesDir);

try {
    for (const file of files) {
        if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(path.join(codefilesDir, file), 'utf8');
            const fileName = file.replace('.tsx', '').replace('.ts', '');

            const existingFiles = await framer.getCodeFiles();
            const existingFile = existingFiles.find((f) => f.name === file);

            if (existingFile) {
                console.log(`${fileName} file found, updating...`);
                await existingFile.setFileContent(content);
            } else {
                console.log(`${fileName} file not found, creating...`);
                await framer.createCodeFile(fileName, content);
            }
        }
    }
} catch (error) {
    console.error('Error syncing scripts:', error);
} finally {
    console.log('Syncing scripts completed. Disconnecting from Framer...');
    framer.disconnect();
}
