#!/usr/bin/env node
/**
 * TSC-Jugendportal Header Video Generator
 * Using Google Veo 3.1 API
 */

const API_KEY = process.env.VEO_API_KEY || 'REMOVED_API_KEY';
const MODEL = 'veo-3.1-generate-preview';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Video Prompts für TSC Header
const PROMPTS = {
    // Shot B: Abstract Water Patterns (Loop Score: 10/10)
    abstractWater: {
        name: 'Abstract Water Patterns',
        prompt: `Top-down abstract shot looking directly at lake water surface capturing dancing caustic light patterns created by sunlight filtering through gentle waves. The frame is filled entirely with water, no horizon or objects visible. Caustic light networks shimmer and flow across the frame in ever-changing geometric patterns of mint green, deep teal, and bright white highlights. The patterns pulse and breathe with hypnotic organic rhythm. Small bubbles occasionally rise and pop, adding texture variation. The camera maintains perfect stillness while the water performs its natural choreography. Shot with polarizing filter to enhance color saturation and reduce surface glare. Dreamy, meditative visual meditation. Seamless infinite loop.`,
        negativePrompt: 'Objects floating in water, debris, leaves, insects, fish, shadows from above, reflections of buildings or people, murky water, algae, foam, static patterns, completely still water, artificial pool water, chlorine blue tint, faces, text, logos',
        duration: 8,
        aspectRatio: '16:9',
        resolution: '1080p'
    },

    // Shot A/D: Aerial Overview (Loop Score: 8/10)
    aerialOverview: {
        name: 'Aerial Lake Overview',
        prompt: `Cinematic aerial drone shot slowly orbiting over Tegeler See Berlin lake at golden hour, revealing a fleet of small Optimist sailing dinghies with white sails and mint green hull accents dotted across deep navy blue water. Camera maintains steady altitude of 30 meters, performing gentle 180-degree arc. Sunlight sparkles on the water like scattered diamonds. Young sailors in matching life vests navigate their boats, creating elegant wake patterns. Documentary style with natural lighting, warm amber highlights, saturated teals. Seamless loop, camera returns to starting position. Shot on RED Komodo, 24mm wide angle lens.`,
        negativePrompt: 'Shaky footage, fast movements, overexposed highlights, stormy weather, motorboats, crowds, urban buildings, night scenes, rain, fog, faces close-up, text, logos, distorted audio',
        duration: 8,
        aspectRatio: '16:9',
        resolution: '1080p'
    },

    // Shot C: Sail Billowing (Loop Score: 9/10)
    sailBillowing: {
        name: 'Sail Billowing',
        prompt: `Static low-angle medium shot of white sail billowing gently against deep blue sky with slowly drifting clouds. Consistent wind direction from left, rhythmic fabric movement creating hypnotic wave pattern in sail. Warm afternoon sun creates beautiful rim lighting on sail edge. Shallow depth of field focusing on sail texture, background bokeh. Mint green rope details visible on boom. No text or logos visible on sail. Continuous ambient motion, seamless loop. Shot on 85mm portrait lens at f/1.4, cinematic color grading.`,
        negativePrompt: 'Text on sail, logos, brand names, faces, people, fast wind, stormy conditions, overcast skies, dark shadows, flat lighting, camera shake, night, rain',
        duration: 8,
        aspectRatio: '16:9',
        resolution: '1080p'
    },

    // Shot: Golden Hour Silhouette (Loop Score: 7/10)
    goldenHour: {
        name: 'Golden Hour Silhouette',
        prompt: `Wide establishing shot of a single sailing dinghy crossing frame from left to right against a spectacular golden hour sunset over a Berlin lake. The boat and sailor appear as elegant silhouettes against the gradient sky transitioning from warm amber near the horizon through coral pink to deep navy blue above. The water surface reflects the sky colors in rippling patterns of liquid gold and shadow. The sail is backlit, creating a glowing triangle of warm light. Long shadows stretch across the water. The camera remains completely static on a tripod, allowing the boat to traverse the entire frame in slow, contemplative motion. Cinematic film grain, anamorphic lens characteristics with gentle horizontal flares. Seamless loop where boat exits right and enters left.`,
        negativePrompt: 'Multiple boats, harsh lighting, overcast, neon colors, city skyline, power lines, aircraft, birds blocking sun, oversaturated, faces',
        duration: 8,
        aspectRatio: '16:9',
        resolution: '1080p'
    }
};

// Farben für Console Output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function generateVideo(promptKey) {
    const promptConfig = PROMPTS[promptKey];
    if (!promptConfig) {
        log(`❌ Unknown prompt: ${promptKey}`, 'red');
        log(`Available prompts: ${Object.keys(PROMPTS).join(', ')}`, 'yellow');
        return null;
    }

    log(`\n🎬 Starting video generation: ${promptConfig.name}`, 'bright');
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');

    const endpoint = `${BASE_URL}/models/${MODEL}:predictLongRunning?key=${API_KEY}`;

    const requestBody = {
        instances: [{
            prompt: promptConfig.prompt
        }],
        parameters: {
            aspectRatio: promptConfig.aspectRatio,
            durationSeconds: promptConfig.duration,
            resolution: promptConfig.resolution,
            negativePrompt: promptConfig.negativePrompt
        }
    };

    log(`📝 Prompt: ${promptConfig.prompt.substring(0, 100)}...`, 'blue');
    log(`⏱️  Duration: ${promptConfig.duration}s | Aspect: ${promptConfig.aspectRatio} | Resolution: ${promptConfig.resolution}`, 'cyan');

    try {
        log(`\n📤 Sending request to Veo 3.1...`, 'yellow');

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            log(`❌ API Error (${response.status}): ${errorText}`, 'red');
            return null;
        }

        const operation = await response.json();
        log(`✅ Operation started: ${operation.name}`, 'green');

        // Polling für Long-Running Operation
        return await pollOperation(operation.name);

    } catch (error) {
        log(`❌ Request failed: ${error.message}`, 'red');
        return null;
    }
}

async function pollOperation(operationName) {
    const pollEndpoint = `${BASE_URL}/${operationName}?key=${API_KEY}`;
    const maxAttempts = 60; // Max 10 Minuten (60 * 10s)

    log(`\n⏳ Polling operation status...`, 'yellow');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await sleep(10000); // 10 Sekunden warten

        try {
            const response = await fetch(pollEndpoint);
            const operation = await response.json();

            if (operation.done) {
                if (operation.error) {
                    log(`❌ Generation failed: ${JSON.stringify(operation.error)}`, 'red');
                    return null;
                }

                log(`\n✅ Video generation complete!`, 'green');

                // Video URL extrahieren
                if (operation.response && operation.response.predictions) {
                    const prediction = operation.response.predictions[0];
                    if (prediction.video) {
                        const videoUrl = prediction.video.uri || prediction.video.url;
                        log(`🎥 Video URL: ${videoUrl}`, 'bright');
                        return { url: videoUrl, operation };
                    }
                }

                log(`📦 Full response:`, 'cyan');
                console.log(JSON.stringify(operation, null, 2));
                return operation;
            }

            // Progress anzeigen
            const progress = operation.metadata?.progress || 'processing';
            process.stdout.write(`\r⏳ Attempt ${attempt}/${maxAttempts} - Status: ${progress}    `);

        } catch (error) {
            log(`\n⚠️  Poll error (attempt ${attempt}): ${error.message}`, 'yellow');
        }
    }

    log(`\n❌ Operation timed out after ${maxAttempts * 10} seconds`, 'red');
    return null;
}

async function downloadVideo(url, filename) {
    log(`\n📥 Downloading video to ${filename}...`, 'cyan');

    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();

        const fs = await import('fs');
        fs.writeFileSync(filename, Buffer.from(buffer));

        log(`✅ Video saved: ${filename}`, 'green');
        return filename;
    } catch (error) {
        log(`❌ Download failed: ${error.message}`, 'red');
        return null;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function listModels() {
    log(`\n📋 Listing available Veo models...`, 'cyan');

    try {
        const response = await fetch(`${BASE_URL}/models?key=${API_KEY}`);
        const data = await response.json();

        const veoModels = data.models?.filter(m =>
            m.name.includes('veo') || m.supportedGenerationMethods?.includes('generateVideo')
        ) || [];

        if (veoModels.length === 0) {
            log(`⚠️  No Veo models found. Available models:`, 'yellow');
            data.models?.forEach(m => log(`  - ${m.name}`, 'blue'));
        } else {
            log(`✅ Found ${veoModels.length} Veo models:`, 'green');
            veoModels.forEach(m => {
                log(`  - ${m.name}`, 'green');
                log(`    Methods: ${m.supportedGenerationMethods?.join(', ')}`, 'blue');
            });
        }

        return data;
    } catch (error) {
        log(`❌ Failed to list models: ${error.message}`, 'red');
        return null;
    }
}

// CLI
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    log(`\n🌊 TSC-Jugendportal Video Generator`, 'bright');
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');

    switch (command) {
        case 'list-models':
            await listModels();
            break;

        case 'generate':
            const promptKey = args[1] || 'abstractWater';
            const result = await generateVideo(promptKey);

            if (result?.url) {
                const filename = `tsc-header-${promptKey}-${Date.now()}.mp4`;
                await downloadVideo(result.url, filename);
            }
            break;

        case 'test':
            // Test API connectivity
            log(`🔍 Testing API connectivity...`, 'yellow');
            await listModels();
            break;

        case 'prompts':
            log(`\n📝 Available prompts:`, 'bright');
            Object.entries(PROMPTS).forEach(([key, config]) => {
                log(`\n  ${key}:`, 'green');
                log(`    Name: ${config.name}`, 'cyan');
                log(`    Duration: ${config.duration}s`, 'blue');
                log(`    Prompt: ${config.prompt.substring(0, 80)}...`, 'blue');
            });
            break;

        case 'help':
        default:
            log(`\nUsage:`, 'bright');
            log(`  node generate-header.js <command> [options]`, 'cyan');
            log(`\nCommands:`, 'bright');
            log(`  test          - Test API connectivity`, 'blue');
            log(`  list-models   - List available Veo models`, 'blue');
            log(`  prompts       - Show available prompts`, 'blue');
            log(`  generate <prompt> - Generate video`, 'blue');
            log(`\nPrompt options: ${Object.keys(PROMPTS).join(', ')}`, 'yellow');
            log(`\nExamples:`, 'bright');
            log(`  node generate-header.js test`, 'cyan');
            log(`  node generate-header.js generate abstractWater`, 'cyan');
            log(`  node generate-header.js generate aerialOverview`, 'cyan');
            break;
    }
}

main().catch(console.error);
