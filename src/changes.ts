import { connect } from 'framer-api';

const projectUrl = process.env.FRAMER_PROJECT_URL;
const apiKey = process.env.FRAMER_API_KEY;

const main = async (fromVersion?: number, toVersion?: number) => {
    if (!projectUrl) {
        console.error('FRAMER_PROJECT_URL environment variable is required');
        process.exit(1);
    }
    if (!apiKey) {
        console.error('FRAMER_API_KEY environment variable is required');
        process.exit(1);
    }

    using framer = await connect(projectUrl, apiKey);

    console.log('Fetching changes since last deployment...\n');

    const [projectInfo, changes, contributors] = await Promise.all([
        framer.getProjectInfo(),
        framer.getChangedPaths(),
        framer.getChangeContributors(fromVersion, toVersion)
    ]);

    console.log(contributors, contributors.length);

    const totalCount = changes.added.length + changes.removed.length + changes.modified.length;

    function formatPaths(paths: string[], prefix = '  '): string {
        if (paths.length === 0) return `${prefix}(none)`;
        return paths.map((p) => `${prefix}• ${p}`).join('\n');
    }

    console.log(`Project: ${projectInfo.name}`);
    console.log(
        `Summary: ${changes.added.length} added, ${changes.modified.length} modified, ${changes.removed.length} removed`
    );

    if (totalCount === 0) {
        console.log('\nNo changes since last deployment.');
    } else {
        console.log('\nAdded:\n' + formatPaths(changes.added));
        console.log('\nModified:\n' + formatPaths(changes.modified));
        console.log('\nRemoved:\n' + formatPaths(changes.removed) + '\n');
    }

    console.log(`Contributors: ${contributors}`);
};

main();
