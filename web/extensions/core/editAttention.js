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
        const delimiters = ".,\\/!?%^*;:{}=-_`~()\r\n\t";

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
            if (start < 0) return false;

            openCount = 0;
            closeCount = 0;

            // Find closing parenthesis after cursor
            while (end < text.length) {
                if (text[end] === ")" && openCount === closeCount) break;
                if (text[end] === "(") openCount++;
                if (text[end] === ")") closeCount++;
                end++;
            }
            if (end === text.length) return false;

            return { start: start + 1, end: end };
        }

        function editAttention(e) {
            const inputField = e.composedPath()[0];
            const delta = parseFloat(editAttentionDelta.value);

            if (inputField.tagName !== "TEXTAREA") return;
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
            
            let start = inputField.selectionStart;
            let end = inputField.selectionEnd;
            let selectedText = inputField.value.substring(start, end);

            // If there is no selection, attempt to find the nearest enclosure, or select the current word
            if (!selectedText) {
                const nearestEnclosure = findNearestEnclosure(inputField.value, start);
                if (nearestEnclosure) {
                    start = nearestEnclosure.start;
                    end = nearestEnclosure.end;
                    selectedText = inputField.value.substring(start, end);
                } else {
                    // Select the current word, find the start and end of the word
                    while (!delimiters.includes(inputField.value[start - 1]) && start > 0) {
                        start--
                    }
                    
                    while (!delimiters.includes(inputField.value[end]) && end < inputField.value.length) {
                        end++
                    }

                    selectedText = inputField.value.substring(start, end);
                    if (!selectedText) return;
                }
            }
            
            let parts = selectedText.match(/^\s*|\s*$/g)
            let leftSpaces = parts[0].length
            let rightSpaces = parts[1]?.length || 0
            if (leftSpaces) {
                start += leftSpaces
            }
            if (rightSpaces) {
                end -= rightSpaces
            }

            // If there are parentheses left and right of the selection, select them
            if (inputField.value[start - 1] === "(" && inputField.value[end] === ")") {
                start--
                end++
            }
            selectedText = inputField.value.substring(start, end);

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
                
                weight = 1.1
                if (parts.length == 2) {
                    weight = parseFloat(parts[1])
                }
                weight += isPlus ? delta : -delta;
                weight = Math.max(0, weight)
                weight = String(Number(weight.toFixed(2))).replace('0.', '.')
                switch (weight) {
                    case '1.1':
                        updatedText = '(' + parts[0] + ')'
                        break
                    case '1':
                        updatedText = parts[0]
                        break
                    default:
                        updatedText = '(' + parts[0] + ':' + weight + ')'
                }
            }
            inputField.setRangeText(updatedText, start, end, "select");
        }
        window.addEventListener("keydown", editAttention);
        window.addEventListener("wheel", editAttention, {passive: false});
    }
});