(function () {
	let isActive = false;
	// Store the current hovered element
	let currentElement = null;

	//  toggle button
	const toggle = document.createElement("button");
	toggle.innerHTML = "🎯 Copy Styles";
	toggle.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 999999;
          padding: 10px 20px;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-family: system-ui;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      `;
	document.body.appendChild(toggle);

	//  highlight overlay
	const overlay = document.createElement("div");
	overlay.style.cssText = `
          position: absolute;
          pointer-events: none;
          z-index: 999998;
          border: 2px solid #0070f3;
          background: rgba(0, 112, 243, 0.1);
          display: none;
      `;
	document.body.appendChild(overlay);

	//  preview modal
	const modal = document.createElement("div");
	modal.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80%;
          max-width: 800px;
          max-height: 80vh;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000000;
          display: none;
          flex-direction: column;
      `;

	// Modal header
	const modalHeader = document.createElement("div");
	modalHeader.style.cssText = `
          padding: 16px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
      `;

	const modalTitle = document.createElement("h3");
	modalTitle.textContent = "Preview";
	modalTitle.style.cssText = `
          margin: 0;
          font-family: system-ui;
          font-size: 18px;
      `;

	const closeButton = document.createElement("button");
	closeButton.innerHTML = "✕";
	closeButton.style.cssText = `
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
          color: #666;
      `;

	modalHeader.appendChild(modalTitle);
	modalHeader.appendChild(closeButton);
	modal.appendChild(modalHeader);

	// Modal content
	const modalContent = document.createElement("div");
	modalContent.style.cssText = `
          padding: 16px;
          overflow-y: auto;
          flex-grow: 1;
      `;
	modal.appendChild(modalContent);

	// Preview iframe
	const previewFrame = document.createElement("iframe");
	previewFrame.style.cssText = `
          width: 100%;
          height: 300px;
          border: 1px solid #eee;
          border-radius: 4px;
          margin-bottom: 16px;
      `;
	modalContent.appendChild(previewFrame);

	// Code display
	const codeDisplay = document.createElement("pre");
	codeDisplay.style.cssText = `
          background: #f5f5f5;
          padding: 16px;
          border-radius: 4px;
          overflow-x: auto;
          margin: 0;
          font-family: monospace;
          font-size: 14px;
          color: #333;
      `;
	modalContent.appendChild(codeDisplay);

	// Modal backdrop
	const backdrop = document.createElement("div");
	backdrop.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.5);
          z-index: 999999;
          display: none;
      `;

	document.body.appendChild(modal);
	document.body.appendChild(backdrop);

	// Create notification element
	const notification = document.createElement("div");
	notification.style.cssText = `
          position: fixed;
          bottom: 70px;
          right: 20px;
          padding: 10px 20px;
          background: #28a745;
          color: white;
          border-radius: 5px;
          z-index: 999999;
          font-family: system-ui;
          display: none;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      `;
	document.body.appendChild(notification);

	// Helper: Get computed styles for an element
	function getElementStyles(element) {
		const computed = window.getComputedStyle(element);

		let styles = {};

		for (let i = 0; i < computed.length; i++) {
			const property = computed[i];
			const value = computed.getPropertyValue(property);

			if (
				value !== "none" &&
				value !== "auto" &&
				value !== "normal" &&
				value !== "0px" &&
				value !== "rgba(0, 0, 0, 0)"
			) {
				styles[property] = value;
			}
		}

		return styles;
	}

	// Helper: Create CSS rule for element
	function createCSSRule(element, styles) {
		let selector = element.tagName.toLowerCase();

		if (element.id) {
			selector += `#${element.id}`;
		}

		if (element.classList && element.classList.length > 0) {
			selector += "." + Array.from(element.classList).join(".");
		}

		let css = `${selector} {\n`;
		Object.entries(styles).forEach(([prop, value]) => {
			css += `    ${prop}: ${value};\n`;
		});
		css += "}\n";
		return css;
	}

	// Helper: Get styles for pseudo-elements
	function getPseudoStyles(element, pseudo) {
		const computed = window.getComputedStyle(element, pseudo);
		let css = "";

		if (computed.content !== "none") {
			let selector = element.tagName.toLowerCase();
			if (element.id) selector += `#${element.id}`;
			if (element.classList && element.classList.length > 0) {
				selector += "." + Array.from(element.classList).join(".");
			}

			css = `${selector}${pseudo} {\n`;
			for (let i = 0; i < computed.length; i++) {
				const property = computed[i];
				const value = computed.getPropertyValue(property);
				if (
					value !== "none" &&
					value !== "auto" &&
					value !== "normal"
				) {
					css += `    ${property}: ${value};\n`;
				}
			}
			css += "}\n";
		}

		return css;
	}

	// Helper: Get all styles recursively
	function getAllStylesRecursive(element) {
		let css = createCSSRule(element, getElementStyles(element));

		css += getPseudoStyles(element, ":before");
		css += getPseudoStyles(element, ":after");

		Array.from(element.children).forEach((child) => {
			css += getAllStylesRecursive(child);
		});

		return css;
	}

	// Helper: Copy to clipboard
	async function copyToClipboard(text) {
		try {
			await navigator.clipboard.writeText(text);
			showNotification("Copied to clipboard!");
		} catch (err) {
			const textarea = document.createElement("textarea");
			textarea.value = text;
			textarea.style.position = "fixed";
			textarea.style.opacity = "0";
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			showNotification("Copied to clipboard!");
		}
	}

	// Helper: Show notification
	function showNotification(message) {
		notification.textContent = message;
		notification.style.display = "block";
		setTimeout(() => {
			notification.style.display = "none";
		}, 2000);
	}

	// ... (previous code remains the same until showPreview function)

	// Show modal with preview
	function showPreview(html, css) {
		// Update code display
		codeDisplay.textContent = `${html}\n\n<style>\n${css}</style>`;

		// Update iframe preview with base styles and reset
		const frameDoc =
			previewFrame.contentDocument || previewFrame.contentWindow.document;
		frameDoc.open();
		frameDoc.write(`
              <!DOCTYPE html>
              <html style="overflow:scroll;">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                      /* Reset default styles */
                      *, *::before, *::after {
                          box-sizing: border-box;
                          margin: 0;
                          padding: 0;
                      }
                      
                      /* Ensure body takes full height */
                      html, body {
                          height: 100%;
                          width: 100%;
                          margin: 0;
                          padding: 16px;
                          font-family: system-ui, -apple-system, sans-serif;
                      }
  
                      /* Import your page's fonts if needed */
                      ${Array.from(document.styleSheets)
							.filter((sheet) => {
								try {
									return (
										sheet.href &&
										sheet.href.includes("fonts")
									);
								} catch (e) {
									return false;
								}
							})
							.map((sheet) => {
								try {
									return Array.from(sheet.cssRules)
										.filter(
											(rule) =>
												rule.type ===
												CSSRule.FONT_FACE_RULE
										)
										.map((rule) => rule.cssText)
										.join("\n");
								} catch (e) {
									return "";
								}
							})
							.join("\n")}
  
                      /* Base styles from the page */
                      ${Array.from(document.styleSheets)
							.filter((sheet) => {
								try {
									return (
										!sheet.href ||
										!sheet.href.includes("fonts")
									);
								} catch (e) {
									return true;
								}
							})
							.map((sheet) => {
								try {
									return Array.from(sheet.cssRules)
										.filter(
											(rule) =>
												rule.type ===
													CSSRule.STYLE_RULE ||
												rule.type ===
													CSSRule.KEYFRAMES_RULE
										)
										.map((rule) => rule.cssText)
										.join("\n");
								} catch (e) {
									return "";
								}
							})
							.join("\n")}
  
                      /* Custom styles for the element */
                      ${css}
                  </style>
              </head>
              <body>
                  ${html}
              </body>
              </html>
          `);
		frameDoc.close();

		// Show modal and backdrop
		modal.style.display = "flex";
		backdrop.style.display = "block";
	}

	// ... (rest of the code remains the same)
	// Close modal
	function closeModal() {
		modal.style.display = "none";
		backdrop.style.display = "none";
	}

	// Update overlay position
	function updateOverlayPosition() {
		if (!currentElement || !isActive) return;

		const rect = currentElement.getBoundingClientRect();
		overlay.style.display = "block";
		overlay.style.position = "fixed";
		overlay.style.top = `${rect.top}px`;
		overlay.style.left = `${rect.left}px`;
		overlay.style.width = `${rect.width - 4}px`;
		overlay.style.height = `${rect.height - 4}px`;
	}

	// Event Handlers
	function handleMouseMove(e) {
		if (!isActive) return;

		// Ignore toggle button, modal, and their children
		if (
			e.target === toggle ||
			toggle.contains(e.target) ||
			e.target === modal ||
			modal.contains(e.target) ||
			e.target === overlay ||
			e.target === backdrop
		) {
			overlay.style.display = "none";
			currentElement = null;
			return;
		}

		currentElement = e.target;
		updateOverlayPosition();
	}

	// Add scroll event listener
	function handleScroll() {
		if (isActive && currentElement) {
			requestAnimationFrame(updateOverlayPosition);
		}
	}

	function handleClick(e) {
		if (!isActive) return;

		// Prevent copying the toggle button, modal, or any of their children
		if (
			e.target === toggle ||
			toggle.contains(e.target) ||
			e.target === modal ||
			modal.contains(e.target) ||
			e.target === overlay ||
			e.target === backdrop
		) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		const element = e.target;
		const html = element.outerHTML;
		const css = getAllStylesRecursive(element);

		// Copy to clipboard and show preview
		copyToClipboard(`${html}\n\n<style>\n${css}</style>`);
		showPreview(html, css);

		// Deactivate the style copier
		deactivateStyleCopier();
	}

	function deactivateStyleCopier() {
		isActive = false;
		currentElement = null;
		toggle.innerHTML = "🎯 Copy Styles";
		overlay.style.display = "none";
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("scroll", handleScroll);
		document.removeEventListener("click", handleClick);
	}

	// Activate the style copier
	toggle.addEventListener("click", () => {
		isActive = !isActive;
		toggle.innerHTML = isActive ? "❌ Stop Copying" : "🎯 Copy Styles";

		if (isActive) {
			overlay.style.display = "none"; // Hide overlay initially
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("scroll", handleScroll);
			document.addEventListener("click", handleClick);
		} else {
			deactivateStyleCopier();
		}
	});

	// Close modal on close button click
	closeButton.addEventListener("click", closeModal);

	// Close modal on backdrop click
	backdrop.addEventListener("click", closeModal);

	// Cleanup function
	window.removeStyleCopier = function () {
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("click", handleClick);
		document.removeEventListener("scroll", handleScroll);
		toggle.remove();
		overlay.remove();
		notification.remove();
		modal.remove();
		backdrop.remove();
	};
})();
