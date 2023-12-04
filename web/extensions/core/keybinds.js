import {app} from "../../scripts/app.js";

app.registerExtension({
	name: "Comfy.Keybinds",
	init() {

		let keybindListener = function (e) {
			let modifierPressed = e.ctrlKey || e.altKey || e.metaKey;
			let el = e.composedPath()[0]
			let editable = el.isEditable || ["INPUT", "TEXTAREA"].includes(el.tagName)
			let queueKey = ["Backquote", "ShiftRight"].includes(e.code)
			
			// Queue prompt using ctrl/command + enter
			if ((modifierPressed && e.key === "Enter") || queueKey) {
				app.queuePrompt(e.shiftKey ? -1 : 0).then();
				e.preventDefault();
				return;
			}

			if (editable) return;

			let modifierKeyIdMap = {
				s: "#comfy-save-button",
				o: "#comfy-file-input",
				d: "#comfy-load-default-button",
				Backspace: "#comfy-clear-button",
				Delete: "#comfy-clear-button",
			};

			let modifierKeybindId = modifierKeyIdMap[e.key];
			if (modifierPressed && modifierKeybindId) {
				e.preventDefault();

				let elem = document.querySelector(modifierKeybindId);
				elem.click();
				return;
			}

			// Finished Handling all modifier keybinds, now handle the rest
			if (modifierPressed) {
				return;
			}

			// Close out of modals using escape
			if (e.key === "Escape") {
				let modals = document.querySelectorAll(".comfy-modal");
				let modal = Array.from(modals).find(modal => getComputedStyle(modal).getPropertyValue("display") !== "none");
				if (modal) {
					modal.style.display = "none"
				}

				document.querySelectorAll("dialog").forEach(d => {
					d.close()
				});
			}

			let keyIdMap = {
				q: "#comfy-view-queue-button",
				h: "#comfy-view-history-button",
				r: "#comfy-refresh-button",
			};

			let buttonId = keyIdMap[e.key];
			if (buttonId) {
				let button = document.querySelector(buttonId);
				button.click();
			}
		}

		window.addEventListener("keydown", keybindListener, true);
	}
});
