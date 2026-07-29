import { loadEnvFile } from 'node:process';
try { loadEnvFile(); } catch { /* .env is optional — env vars may be set externally */ }
