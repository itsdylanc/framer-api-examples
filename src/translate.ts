import { connect } from 'framer-api';

const projectUrl = process.env.FRAMER_PROJECT_URL;
if (!projectUrl) {
    console.error('FRAMER_PROJECT_URL environment variable is required');
    process.exit(1);
}

using framer = await connect(projectUrl);

async function getLocales(groupId?: string, sourceId?: string) {
    const locales = await framer.getLocales();
    console.log(
        `Found ${locales.length} locale(s):`,
        locales.map((l) => l.name || l.id)
    );

    const groups = await framer.getLocalizationGroups();
    console.log(`Found ${groups.length} localization group(s)`);

    console.log(groups);

    // for (const group of groups) {
    //     console.log(`Processing group: ${group.id} ${group.name}`)
    //     // if (group.id === groupId) {
    //     //     const sources = group.sources || []
    //     //     if (sources.some(s => s.id === sourceId)) {
    //     //         console.log(`Source ${sourceId} found in group ${groupId}`)
    //     //         const source = sources.find(s => s.id === sourceId)
    //     //         console.log(`Source value: ${source?.value}`)
    //     //     }
    //     // }

    //     const sources = group.sources || []
    //     for (const source of sources) {
    //         console.log(`Processing source: ${source.id} ${source.value}`)
    //     }
    // }

    return locales;
}

/**
 * Gets localized content and sets translations for each item
 */
async function updateLocalizations(sourceId?: string) {
    // Get all locales
    const locales = await framer.getLocales();
    console.log(
        `Found ${locales.length} locale(s):`,
        locales.map((l) => l.name || l.id)
    );

    // Get all localization groups
    const groups = await framer.getLocalizationGroups();
    console.log(`Found ${groups.length} localization group(s)`);

    // Build the valuesBySource structure
    const setValuesBySource: Record<string, Record<string, { action: 'set'; value: string }>> = {};

    // Iterate through each group to get sources
    for (const group of groups) {
        console.log(`Processing group: ${group.name || group.id} (type: ${group.type})`);

        // Access sources directly from the group (sources is a property, not a method)
        const sources = group.sources || [];

        // For each source, set translation for all locales
        for (const source of sources) {
            // Check if this source has any readonly translations (from managed collections)
            // If any locale has a readonly value, skip this entire source
            const hasReadonlyTranslations = locales.some((locale) => {
                const localeValue = source.valueByLocale[locale.id];
                // LocalizationValueNew has status "new" and no readonly property
                // Other LocalizationValue types have readonly: boolean
                return localeValue && 'readonly' in localeValue && localeValue.readonly === true;
            });

            if (hasReadonlyTranslations) {
                console.log(
                    `Skipping source ${source.id} (has readonly translations from managed collection)`
                );
                continue;
            }

            const newValue =
                source.id === sourceId ? 'Custom Translation/Value' : 'Translated Content';

            if (!setValuesBySource[source.id]) {
                setValuesBySource[source.id] = {};
            }

            for (const locale of locales) {
                setValuesBySource[source.id][locale.id] = {
                    action: 'set',
                    value: newValue
                };
            }
        }
    }

    console.log(`\nSetting translations for ${Object.keys(setValuesBySource).length} source(s)`);
    if (Object.keys(setValuesBySource).length > 0) {
        const setResult = await framer.setLocalizationData({
            valuesBySource: setValuesBySource
        });
        console.log('Localization data updated successfully:', setResult);

        console.log(setResult.valuesBySource.errors);
    } else {
        console.log('No sources to update');
    }
}

// await updateLocalizations("774i5ys5snvbMxynZSwt74")
await getLocales();
