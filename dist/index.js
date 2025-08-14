"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const os = __importStar(require("os"));
const https = __importStar(require("https"));
const fs_1 = require("fs");
const stream_1 = require("stream");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const streamPipeline = (0, util_1.promisify)(stream_1.pipeline);
async function run() {
    try {
        const entry = core.getInput('entry') || '.';
        const output = core.getInput('output') || 'dist/app';
        const versionInput = core.getInput('version');
        const platformMap = {
            win32: 'x86_64-pc-windows-msvc.exe',
            linux: 'x86_64-unknown-linux-gnu',
            darwin: 'x86_64-apple-darwin',
        };
        const platform = os.platform();
        const asset = platformMap[platform];
        if (!asset)
            throw new Error(`Unsupported platform: ${platform}`);
        const version = versionInput || await getLatestRelease();
        const binUrl = `https://github.com/razorblade23/PyCrucible/releases/download/${version}/pycrucible_${version}_${asset}`;
        const binDir = path_1.default.join(process.cwd(), 'pycrucible_bin');
        const binPath = path_1.default.join(binDir, platform === 'win32' ? 'pycrucible.exe' : 'pycrucible');
        (0, fs_1.mkdirSync)(binDir, { recursive: true });
        await download(binUrl, binPath);
        (0, fs_1.chmodSync)(binPath, 0o755);
        await exec.exec(binPath, ['-e', entry, '-o', output]);
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
async function getLatestRelease() {
    return new Promise((resolve, reject) => {
        https.get('https://api.github.com/repos/razorblade23/PyCrucible/releases/latest', { headers: { 'User-Agent': 'pycrucible-action' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.tag_name);
                }
                catch (e) {
                    reject('Failed to parse GitHub API response.');
                }
            });
        }).on('error', reject);
    });
}
async function download(url, dest) {
    const file = (0, fs_1.createWriteStream)(dest);
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }
            streamPipeline(response, file).then(resolve).catch(reject);
        }).on('error', reject);
    });
}
run();
