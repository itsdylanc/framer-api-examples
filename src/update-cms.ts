import { type ManagedCollection, connect } from 'framer-api';

const projectUrl = process.env.FRAMER_PROJECT_URL;
if (!projectUrl) {
    throw new Error('FRAMER_PROJECT_URL environment variable is required');
}

using framer = await connect(projectUrl as string);

async function findOrCreateCollection(name: string) {
    const existingCollections = await framer.getManagedCollections();
    const existing = existingCollections.find((c) => c.name === name);

    if (existing) {
        console.log(`Found existing collection [id: ${existing.id}]`);
        return existing;
    }

    const collection = await framer.createManagedCollection(name);
    console.log(`Created collection [id: ${collection.id}]`);
    return collection;
}

async function setupFields(collection: ManagedCollection) {
    console.log('Setting up fields...');
    await collection.setFields([
        { type: 'string', name: 'Name', id: 'name' },
        { type: 'string', name: 'Title', id: 'title' },
        { type: 'string', name: 'Email', id: 'email' },
        { type: 'string', name: 'Phone', id: 'phone' },
        { type: 'date', name: 'DOB', id: 'dob' },
        { type: 'number', name: 'Age', id: 'age' },
        { type: 'image', name: 'Profile Picture', id: 'profilePicture' }
    ]);

    const fields = await collection.getFields();
    console.log(`Set ${fields.length} fields`);
}

interface RandomUser {
    name: { title: string; first: string; last: string };
    email: string;
    phone: string;
    login: { uuid: string };
    dob: { date: string; age: number };
    picture: { large: string };
}

async function populateCollection(collection: ManagedCollection) {
    console.log('Populating collection...');
    const response = await fetch('https://randomuser.me/api/?results=5');
    const { results } = (await response.json()) as { results: RandomUser[] };

    const usersData = results.map((user) => ({
        id: user.login.uuid,
        slug: user.login.uuid,
        draft: Math.random() > 0.5,
        fieldData: {
            name: { type: 'string', value: `${user.name.first} ${user.name.last}` },
            title: { type: 'string', value: user.name.title },
            email: { type: 'string', value: user.email },
            phone: { type: 'string', value: user.phone },
            dob: { type: 'date', value: user.dob.date },
            age: { type: 'number', value: user.dob.age },
            profilePicture: { type: 'image', value: user.picture.large },
        },
    }));

    await collection.addItems(JSON.parse(JSON.stringify(usersData)));

    const itemIds = await collection.getItemIds();
    console.log(`Added items [total: ${itemIds.length}]`);
}

const collection = await findOrCreateCollection('Users');
await setupFields(collection);
await populateCollection(collection);

const { deployment } = await framer.publish();
console.log(`Published deployment [id: ${deployment.id}]`);

const hostnames = await framer.deploy(deployment.id);
console.log(
    `Deployed deployment [id: ${deployment.id}] to production to hostname: ${hostnames[0].hostname}`
);
