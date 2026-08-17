import { connect } from 'framer-api';
import { withRetry } from './with-retry';

// Name of the managed collection
const COLLECTION_NAME = 'ManagedCollection';

const projectUrl = process.env.FRAMER_PROJECT_URL;
if (!projectUrl) {
    throw new Error('FRAMER_PROJECT_URL environment variable is required');
}

using framer = await withRetry(() => connect(projectUrl));

const collections = await framer.getManagedCollections();
const collection =
    collections.find((c) => c.name === COLLECTION_NAME) ??
    (await framer.createManagedCollection(COLLECTION_NAME));

await collection.setFields([{ type: 'string', name: 'Title', id: 'title' }]);

// Example item payload
const itemPayload = [
    {
        id: 'minimal-1',
        slug: 'minimal-1',
        draft: false,
        fieldData: {
            title: { type: 'string', value: 'Minimal item 1' },
        },
    },
    {
        id: 'minimal-2',
        slug: 'minimal-2',
        draft: false,
        fieldData: {
            title: { type: 'string', value: 'Minimal item 2' },
        },
    },
];

await collection.addItems(JSON.parse(JSON.stringify(itemPayload)));

const ids = await collection.getItemIds();
console.log(`${COLLECTION_NAME}: ${ids.length} item(s)`);
