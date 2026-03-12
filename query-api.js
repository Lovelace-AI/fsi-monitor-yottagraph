#!/usr/bin/env node
/**
 * Simple CLI tool to query the Elemental API.
 *
 * Auth: set LOVELACE_BEARER_TOKEN as an env var or in your .env file.
 * Server: set NUXT_PUBLIC_QUERY_SERVER_ADDRESS in your .env file.
 */

const fs = require('fs');
const path = require('path');

function loadEnvFile() {
    try {
        const envPath = path.join(__dirname, '.env');
        const contents = fs.readFileSync(envPath, 'utf8');
        for (const line of contents.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex === -1) continue;
            const key = trimmed.slice(0, eqIndex).trim();
            const value = trimmed.slice(eqIndex + 1).trim();
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    } catch {
        // No .env file -- that's fine, rely on shell env
    }
}

async function main() {
    loadEnvFile();

    const args = process.argv.slice(2);

    if (args.length < 2 || args[0] === '--help' || args[0] === '-h') {
        console.log(`
Elemental API Query Tool

Usage:
  node query-api.js <METHOD> <ENDPOINT> [JSON_PARAMS]

Examples:
  node query-api.js GET /entities/lookup '{"entityName":"Apple","maxResults":5,"includeNames":true}'
  node query-api.js POST /entities/search '{"queries":[{"queryId":123,"query":"United States"}]}'
  node query-api.js POST /elemental/find '{"expression":{"type":"is_type","is_type":{"fid":1}},"limit":10}'

Environment variables (required):
  LOVELACE_BEARER_TOKEN                Bearer token for API auth
  NUXT_PUBLIC_QUERY_SERVER_ADDRESS     Query server URL (e.g. https://query.news.prod.g.lovelace.ai)

Setup:
  1. Get a dev token from your team
  2. Add LOVELACE_BEARER_TOKEN to your .env file or export in your shell
     (NUXT_PUBLIC_QUERY_SERVER_ADDRESS should already be in your .env from project init)
`);
        process.exit(0);
    }

    const [method, endpoint, jsonParams] = args;

    const token = process.env.LOVELACE_BEARER_TOKEN;
    if (!token) {
        console.error('Error: LOVELACE_BEARER_TOKEN is not set.');
        console.error('Add it to your .env file or export it in your shell.');
        console.error('Run: node query-api.js --help');
        process.exit(1);
    }

    let params = {};
    if (jsonParams) {
        try {
            params = JSON.parse(jsonParams);
        } catch (err) {
            console.error('Error: Invalid JSON parameters');
            console.error(err.message);
            process.exit(1);
        }
    }

    const server = process.env.NUXT_PUBLIC_QUERY_SERVER_ADDRESS;
    if (!server) {
        console.error('Error: NUXT_PUBLIC_QUERY_SERVER_ADDRESS is not set.');
        console.error('Add it to your .env file or export it in your shell.');
        console.error('Run: node query-api.js --help');
        process.exit(1);
    }

    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    let url = `${server}${normalizedEndpoint}`;

    const fetchOptions = {
        method: method.toUpperCase(),
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    };

    if (method.toUpperCase() === 'GET' && Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        url = `${url}?${queryString}`;
    } else if (method.toUpperCase() !== 'GET' && Object.keys(params).length > 0) {
        fetchOptions.body = JSON.stringify(params);
    }

    console.error(`\n📡 ${method.toUpperCase()} ${url}\n`);

    try {
        const response = await fetch(url, fetchOptions);
        const data = await response.json();

        if (!response.ok) {
            console.error(`❌ Error ${response.status}: ${response.statusText}`);
        } else {
            console.error(`✅ Success (${response.status})\n`);
        }

        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('❌ Request failed:', err.message);
        process.exit(1);
    }
}

main();
