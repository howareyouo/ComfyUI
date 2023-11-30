import {app} from "../../scripts/app.js";

app.registerExtension({
	name: "Comfy.Keybinds",
	init() {
		let specialCodes = ['Backquote']

		const keybindListener = function (e) {
			const modifierPressed = e.ctrlKey || e.altKey || e.metaKey;
			const el = e.composedPath()[0]
			let editable = el.isEditable || ["INPUT", "TEXTAREA"].includes(el.tagName)

			if (editable && !specialCodes.includes(e.code))  {
				return
			}
			
			// Queue prompt using ctrl or command + enter
			if ((modifierPressed && e.key === "Enter") || e.code === 'Backquote') {
				app.queuePrompt(e.shiftKey ? -1 : 0).then();
				e.preventDefault();
				return;
			}

			if (editable) return;

			const modifierKeyIdMap = {
				s: "#comfy-save-button",
				o: "#comfy-file-input",
				d: "#comfy-load-default-button",
				Backspace: "#comfy-clear-button",
				Delete: "#comfy-clear-button",
			};

			const modifierKeybindId = modifierKeyIdMap[e.key];
			if (modifierPressed && modifierKeybindId) {
				e.preventDefault();

				const elem = document.querySelector(modifierKeybindId);
				elem.click();
				return;
			}

			// Finished Handling all modifier keybinds, now handle the rest
			if (modifierPressed) {
				return;
			}

			// Close out of modals using escape
			if (e.key === "Escape") {
				const modals = document.querySelectorAll(".comfy-modal");
				const modal = Array.from(modals).find(modal => window.getComputedStyle(modal).getPropertyValue("display") !== "none");
				if (modal) {
					modal.style.display = "none";
				}

				[...document.querySelectorAll("dialog")].forEach(d => {
					d.close();
				});
			}

			const keyIdMap = {
				q: "#comfy-view-queue-button",
				h: "#comfy-view-history-button",
				r: "#comfy-refresh-button",
			};

			const buttonId = keyIdMap[e.key];
			if (buttonId) {
				const button = document.querySelector(buttonId);
				button.click();
			}
		}

		window.addEventListener("keydown", keybindListener, true);
	}
});
