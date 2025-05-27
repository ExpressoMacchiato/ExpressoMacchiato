#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

const GIT_REPO = "https://github.com/alessioVelluso/CreateExpressoMacchiato.git";
const projectName = process.argv[2];
const targetPath = projectName
    ? path.resolve(process.cwd(), projectName)
    : process.cwd();

function prompt(question)
{
    return new Promise((resolve) =>
    {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(question, (answer) =>
        {
            rl.close();
            resolve(answer);
        });
    });
}

(async () =>
{
    console.log("➡️  Downloading template...");

    if (fs.existsSync(targetPath) && projectName) {
        console.error(`❌  Directory "${projectName}" already exists.`);
        process.exit(1);
    }

    if (projectName) {
        execSync(`git clone ${GIT_REPO} "${projectName}"`, { stdio: "inherit" });
    } else {
        const answer = await prompt("⚠️  No project name specified, install in the current directory? (y/n): ");
        if (answer.toLowerCase() !== "y") {
            console.log("❌ Abort.");
            process.exit(1);
        }
        execSync(`git clone ${GIT_REPO} .`, { stdio: "inherit" });
    }

    // Rimuove la .git originale
    const gitDir = path.join(targetPath, ".git");
    if (fs.existsSync(gitDir)) {
        fs.rmSync(gitDir, { recursive: true, force: true });
    }

    // Reinizializza git
    execSync("git init", { cwd: targetPath, stdio: "ignore" });

    // Crea .env mock
    const envContent = `
SERVER_PORT=3000 # required
API_URL="http://127.0.0.1:3000/api" # not required
ERROR_FILE_PATH="logs/errors.log" # not required
TOKEN_KEY="your-ultra-secret-key" # required if you want to use tokens

# ---
# Db parameters are required depending on the DB_DIALECT
# Use the next lines how you want, the template comes from a configuration for a sqlite3 db.
# ---
# DB_DIALECT="postgres"
# DB_HOST="127.0.0.1"
# DB_PORT=5432
# DB_USER="dbusername"
# DB_PASSWORD="yuordbpassword"
# DB_NAME="expresso"

DB_DIALECT="sqlite"
DB_NAME="db/expresso.db"

# Not for the expresso-macchiato package but inside the template because i often use it.
MINIO_ENDPOINT="127.0.0.1"
MINIO_PORT=9000
MINIO_SSL=false
MINIO_ACCESS_KEY="in minio container you can use your root username but in prod use amazon s3 keys"
MINIO_SECRET_KEY="in minio container you can use your root password but in prod use amazon s3 keys"
    `.trim();

    fs.writeFileSync(path.join(targetPath, ".env"), envContent);

    console.log("✅  Project created!");
    if (projectName) console.log(` - cd ${projectName}`);
    console.log(` - npm install`);
    console.log(` - npm run dev`);

    process.exit(0);
})();
