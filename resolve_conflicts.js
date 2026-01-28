const fs = require('fs');
const path = require('path');

const directory = './src';

function resolveConflicts(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Match <<<<<<< HEAD ... ======= ... >>>>>> ...
        // We use a regex that captures the part after =======
        // We look for ======= followed by anything until >>>>>>
        const regex = /<<<<<<< HEAD[\s\S]*?=======([\s\S]*?)>>>>>>> [^\r\n]*/g;

        if (regex.test(content)) {
            console.log(`Found conflicts in: ${filePath}`);
            const resolved = content.replace(regex, (match, incoming) => {
                // incoming might start with newlines if ======= was on its own line
                // We typically want to trim the leading newline from the incoming block if it exists
                // But merge format usually is:
                // =======
                // incoming content...
                // >>>>>>

                // So 'incoming' captures the newline after ======= too if we are not careful
                // Let's just return matches group 1.

                // However, the regex above: `=======([\s\S]*?)>>>>>>>`
                // captures the newline after `=======` as the start of `incoming`.
                // We should probably strip ONE leading newline if present.

                let cleanIncoming = incoming;
                if (cleanIncoming.startsWith('\r\n')) cleanIncoming = cleanIncoming.substring(2);
                else if (cleanIncoming.startsWith('\n')) cleanIncoming = cleanIncoming.substring(1);

                return cleanIncoming;
            });

            fs.writeFileSync(filePath, resolved, 'utf8');
            console.log(`Resolved conflicts in: ${filePath}`);
        }
    } catch (e) {
        console.error(`Error processing ${filePath}: ${e.message}`);
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`Directory not found: ${dir}`);
        return;
    }
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            walkDir(filePath);
        } else {
            resolveConflicts(filePath);
        }
    });
}

console.log('Starting conflict resolution (Accept Incoming) v2...');
console.log('Current directory:', process.cwd());
walkDir(directory);
console.log('Done.');
