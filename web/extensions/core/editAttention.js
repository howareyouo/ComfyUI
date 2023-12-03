import { app } from "../../scripts/app.js";

// Allows you to edit the attention weight by holding ctrl (or cmd) and using the up/down arrow keys

app.registerExtension({
    name: "Comfy.EditAttention",
    init() {
        const editAttentionDelta = app.ui.settings.addSetting({
            id: "Comfy.EditAttention.Delta",
            name: "Ctrl+up/down precision",
            type: "slider",
            attrs: {
                min: 0.01,
                max: 0.5,
                step: 0.01,
            },
            defaultValue: 0.05,
        });
        const delimiters = ".,\\/!?%^*;{}=-`~()\r\n\t";

        function findNearestEnclosure(text, cursorPos) {
            let start = cursorPos, end = cursorPos;
            let openCount = 0, closeCount = 0;

            // Find opening parenthesis before cursor
            while (start >= 0) {
                start--;
                if (text[start] === "(" && openCount === closeCount) break;
                if (text[start] === "(") openCount++;
                if (text[start] === ")") closeCount++;
            }
            if (start < 0) return

            openCount = 0;
            closeCount = 0;

            // Find closing parenthesis after cursor
            while (end < text.length) {
                if (text[end] === ")" && openCount === closeCount) break;
                if (text[end] === "(") openCount++;
                if (text[end] === ")") closeCount++;
                end++;
            }
            if (end === text.length) return

            return { start: start + 1, end }
        }

        function editAttention(e) {
            const el = e.composedPath()[0];
            const delta = parseFloat(editAttentionDelta.value);

            if (el.tagName !== "TEXTAREA") return;
            if (!(e.metaKey || e.ctrlKey || e.altKey || e.type == 'wheel')) return
            
            let isPlus
            if (e.type == "wheel") {
                isPlus = e.deltaY < 0
            } else {
                if (e.key === "ArrowUp") isPlus = 1
                else if (e.key == "ArrowDown") isPlus = 0
                else return
            }
            e.preventDefault();
            
            let start = el.selectionStart;
            let end = el.selectionEnd;
            let text = el.value
            let selectedText = text.substring(start, end);

            // If there is no selection, attempt to find the nearest enclosure, or select the current word
            if (!selectedText) {
                const nclosure = findNearestEnclosure(text, start);
                if (nclosure) {
                    start = nclosure.start;
                    end = nclosure.end;
                    selectedText = text.substring(start, end);
                } else {
                    // Select the current word, find the start and end of the word
                    while (!delimiters.includes(text[start - 1]) && start > 0) {
                        start--
                    }
                    while (!delimiters.includes(text[end]) && end < text.length) {
                        end++
                    }
                    while (start < end && text[start] == ' ') {
                        start++
                    }
                    while (start < end && text[end - 1] == ' ') {
                        end--
                    }
                }
            }
            
            selectedText = text.substring(start, end);
            if (!selectedText) return;

            // If there are parentheses left and right of the selection, select them
            if (text[start - 1] === "(" && text[end] === ")") {
                start--
                end++
            }
            selectedText = text.substring(start, end);

            let updatedText
            let weight = isPlus ? 1 + delta : 1 - delta;
            
            // If the selection is not enclosed in parentheses, add them
            if (selectedText[0] !== "(" || selectedText[selectedText.length - 1] !== ")") {
                if (weight == 1.1) {
                    updatedText = `(${selectedText})`
                } else {
                    weight = String(Number(weight.toFixed(2))).replace('0.', '.')
                    updatedText = `(${selectedText}:${weight})`
                }
            } 
            // Increment the weight
            else {    
                let parts = selectedText.substring(1, selectedText.length - 1).split(':')                
                let content = parts[0]
                weight = 1.1
                if (parts[0].endsWith('embedding')) {
                    content += ':' + parts[1]
                    if (parts.length == 3) {
                        weight = parseFloat(parts[2])
                    }
                } else if (parts.length == 2) {
                    weight = parseFloat(parts[1])
                }
                
                weight += isPlus ? delta : -delta;
                weight = Math.max(0, weight)
                weight = String(Number(weight.toFixed(2))).replace('0.', '.')
                switch (weight) {
                    case '1.1':
                        updatedText = '(' + content + ')'
                        break
                    case '1':
                        updatedText = content
                        break
                    default:
                        updatedText = '(' + content + ':' + weight + ')'
                }
            }
            el.setRangeText(updatedText, start, end, "select");
        }
        window.addEventListener("keydown", editAttention);
        window.addEventListener("wheel", editAttention, {passive: false});
    }
});
