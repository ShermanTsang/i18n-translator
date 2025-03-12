import "@xterm/xterm/css/xterm.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebContainer } from "@webcontainer/api";
import { files } from "./files.js";
import * as Prism from "prismjs";

let terminal;
let webContainerInstance;
let editor;
let isComposing = false;

function initCodeEditor() {
  editor = document.getElementById("editor");
  const exampleCode = files["example"]["directory"]["index.js"].file.contents;

  editor.textContent = exampleCode;
  updateHighlighting(editor.textContent);

  // Handle input with debouncing to prevent cursor jumping
  editor.addEventListener("input", async () => {
    if (isComposing) return;

    const content = editor.textContent;
    // Ensure file is written synchronously before continuing
    await writeIndexJS(content);

    // Capture selection state before updating
    const selection = saveSelection(editor);

    // Update highlighting
    updateHighlighting(content);

    // Restore selection immediately
    restoreSelection(editor, selection);
  });

  // Handle IME composition
  editor.addEventListener("compositionstart", () => {
    isComposing = true;
  });

  editor.addEventListener("compositionend", async () => {
    isComposing = false;
    const content = editor.textContent;

    // Ensure file is written synchronously before continuing
    await writeIndexJS(content);

    const selection = saveSelection(editor);
    updateHighlighting(content);
    restoreSelection(editor, selection);
  });

  // Handle tab key for indentation
  editor.addEventListener("keydown", async (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "    ");

      const content = editor.textContent;
      // Ensure file is written synchronously before continuing
      await writeIndexJS(content);

      const selection = saveSelection(editor);
      updateHighlighting(content);
      restoreSelection(editor, selection);
    }
  });

  // Prevent default rich text behavior
  editor.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  });
}

// Helper function to save selection state
function saveSelection(element) {
  if (!window.getSelection().rangeCount) return { start: 0, end: 0 };

  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  const start = preCaretRange.toString().length;

  return {
    start,
    end: start + range.toString().length,
  };
}

// Helper function to restore selection state
function restoreSelection(element, savedSel) {
  if (!savedSel) return;

  // Create a tree walker to navigate through text nodes
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false,
  );

  let currentNode = walker.nextNode();
  let charCount = 0;
  let startNode, startOffset, endNode, endOffset;

  // Find the nodes and offsets for start and end positions
  while (currentNode) {
    const nodeLength = currentNode.length;
    const nextCharCount = charCount + nodeLength;

    // Check if start position is in this node
    if (
      !startNode &&
      savedSel.start >= charCount &&
      savedSel.start <= nextCharCount
    ) {
      startNode = currentNode;
      startOffset = savedSel.start - charCount;
    }

    // Check if end position is in this node
    if (
      !endNode &&
      savedSel.end >= charCount &&
      savedSel.end <= nextCharCount
    ) {
      endNode = currentNode;
      endOffset = savedSel.end - charCount;
    }

    // If we found both start and end, we can stop
    if (startNode && endNode) {
      break;
    }

    charCount = nextCharCount;
    currentNode = walker.nextNode();
  }

  // If we found valid positions, set the selection
  if (startNode && endNode) {
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

// Helper function to update syntax highlighting
function updateHighlighting(content) {
  const highlighted = Prism.highlight(
    content,
    Prism.languages.javascript,
    "javascript",
  );
  // Only update if content has changed to prevent unnecessary re-renders
  if (editor.innerHTML !== highlighted) {
    editor.innerHTML = highlighted;
  }
}

async function writeIndexJS(content) {
  try {
    // Make sure we wait for the write operation to complete
    await webContainerInstance.fs.writeFile("/example/index.js", content);
    console.log("Successfully updated /example/index.js");
    return true;
  } catch (error) {
    console.error("Error writing to file:", error);
    return false;
  }
}

async function initTerminal() {
  terminal = new Terminal({
    theme: {
      background: "#111",
      foreground: "#fff",
      cursor: "#4f46e5",
    },
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: 16,
    allowProposedApi: true,
    convertEol: true,
  });

  const fitAddon = new FitAddon();

  terminal.loadAddon(fitAddon);
  terminal.open(document.getElementById("terminal"));
  fitAddon.fit();

  terminal.writeln("Have a try on @shermant/i18n-translator!😊");
  terminal.write("$ ");

  window.addEventListener("resize", () => {
    fitAddon.fit();
  });
}

async function initWebContainer() {
  try {
    webContainerInstance = await WebContainer.boot();
    await webContainerInstance.mount(files);
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

      process.output.pipeTo(
        new WritableStream({
          write(chunk) {
            terminal.write(chunk);
          },
        }),
      );

      const writer = process.input.getWriter();
      const disposable = terminal.onData((data) => {
        writer.write(data);
      });

      const exitCode = await process.exit;
      disposable.dispose();
      writer.releaseLock();

      if (exitCode !== 0) {
        throw new Error(`${cmd} ${args} failed (code ${exitCode})`);
      }
    }

    await runCommand(
      "npm",
      ["install", "nrm"],
      "Installing registry manager...",
    );
    await runCommand("nrm", ["use", "taobao"], "Setting registry...");
    await runCommand("npm", ["install"], "Installing dependencies...");
    await runCommand("i18n-translator", [""], "Starting translator...", {
      canInput: true,
    });
  } catch (error) {
    terminal.write(`\x1b[31mError: ${error.message}\x1b[0m\n`);
    console.error(error);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  initCodeEditor();
  await initTerminal();
  await initWebContainer();
  await runProject();
});
