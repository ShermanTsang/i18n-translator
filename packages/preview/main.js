import "@xterm/xterm/css/xterm.css";
import {Terminal} from "@xterm/xterm";
import {FitAddon} from "@xterm/addon-fit";
import {WebContainer} from "@webcontainer/api";
import {files} from "./files.js";

let terminal;
let webContainerInstance;

function loadExampleFile() {
    const textareaEl = document.getElementById("textarea");
    textareaEl.value = files["example"]["directory"]["index.js"].file.contents;
    textareaEl.addEventListener("input", (e) => {
        writeIndexJS(e.currentTarget.value);
    });
}

async function writeIndexJS(content) {
    await webContainerInstance.fs.writeFile("/example/index.js", content);
}

async function initTerminal() {
    terminal = new Terminal({
        theme: {
            background: '#111',
            foreground: '#fff',
            cursor: '#4f46e5'
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 16,
        allowProposedApi: true,
        convertEol: true,
    });

    const fitAddon = new FitAddon();

    terminal.loadAddon(fitAddon);
    terminal.open(document.getElementById('terminal'));
    fitAddon.fit();

    terminal.writeln('Have a try on @shermant/i18n-translator!😊');
    terminal.write('$ ');

    window.addEventListener("resize", () => {
        fitAddon.fit();
    });

}

async function initWebContainer() {
    try {
        webContainerInstance = await WebContainer.boot()
        await webContainerInstance.mount({
            'package.json': {
                file: {
                    contents: `
                                {
                                    "name": "translator",
                                    "dependencies": {
                                        "@shermant/i18n-translator": "^1.0.0"
                                    }
                                }
                            `
                }
            },
            'server.js': {
                file: {
                    contents: `
                                console.log('Ready to use translations!');
                                process.stdin.pipe(process.stdout);
                            `
                }
            }
        });
    } catch (error) {
        terminal.write(`\x1b[31mError: ${error.message}\x1b[0m\n`);
        console.error(error);
    }
}

async function runProject(command) {
    try {
        async function runCommand(cmd, args, desc, config = {}) {
            terminal.write(`\r${desc}\n$ `);
            const process = await webContainerInstance.spawn(cmd, args);

            process.output.pipeTo(new WritableStream({
                write(chunk) {
                    terminal.write(chunk);
                }
            }));

            const writer = process.input.getWriter();
            const disposable = terminal.onData(data => {
                writer.write(data);
            });

            const exitCode = await process.exit;
            disposable.dispose();
            writer.releaseLock();

            if (exitCode !== 0) {
                throw new Error(`${cmd} ${args} failed (code ${exitCode})`);
            }
        }

        await runCommand('npm', ['install', 'nrm'], 'Installing registry manager...');
        await runCommand('nrm', ['use', 'taobao'], 'Setting registry...');
        await runCommand('npm', ['install'], 'Installing dependencies...');
        await runCommand('i18n-translator', [''], 'Starting translator...', {canInput: true});

    } catch (error) {
        terminal.write(`\x1b[31mError: ${error.message}\x1b[0m\n`);
        console.error(error);
    }
}

const outputEl = document.getElementById('terminal-output');
window.addEventListener('DOMContentLoaded', async () => {
    await initTerminal();
    loadExampleFile();
    await initWebContainer();
    await runProject();
});
