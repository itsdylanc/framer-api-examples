import { connect } from 'framer-api';

const framer = await connect(process.env.FRAMER_PROJECT_URL as string, process.env.FRAMER_API_KEY);

const projectInfo = await framer.getProjectInfo();

console.log(`Project: ${projectInfo.name}`);

// Closes down the server API.
// If you don't do this, your script won't finish executing.
await framer.disconnect();
