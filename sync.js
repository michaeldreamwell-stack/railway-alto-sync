import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALTO_USER = process.env.ALTO_API_USERNAME;
const ALTO_PASS = process.env.ALTO_API_PASSWORD;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let cachedToken = null;
let tokenExpiry = 0;

function base64(str) {
  return Buffer.from(str).toString('base64');
}

async function getToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiry) {
    console.log('Using cached token');
    return cachedToken;
  }

  console.log('Requesting new token');

  const res = await fetch('https://webservices.vebra.com/export/DreamwellAPI/v10/branch', {
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + base64(`${ALTO_USER}:${ALTO_PASS}`)
    }
  });

  if (!res.ok) {
    throw new Error('Token request failed');
  }

  const token = res.headers.get('token');

  if (!token) {
    throw new Error('No token returned');
  }

  cachedToken = base64(token.trim());
  tokenExpiry = now + (55 * 60 * 1000);

  return cachedToken;
}

async function fetchProperties() {
  const token = await getToken();

  const res = await fetch('https://webservices.vebra.com/export/DreamwellAPI/v10/branch/45636/property', {
    headers: {
      'Authorization': 'Basic ' + token
    }
  });

  const text = await res.text();

  console.log('Fetched property list');
  return text;
}

async function run() {
  try {
    const xml = await fetchProperties();

    console.log('Sync complete');

    // TODO: parse XML + upsert into Supabase (Lovable likely already gave this part)

  } catch (err) {
    console.error(err);
  }
}

run();