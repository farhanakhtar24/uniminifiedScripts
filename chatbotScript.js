// Create the chatbot UI and attach it to the body
(function () {
	// Chatbot styles
	const styles = `
    #chatbotContainer {
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 300px;
      height: 400px;
      background-color: #f1f1f1;
      border: 1px solid #ccc;
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      z-index: 10000;
    }
    #chatMessages {
      flex-grow: 1;
      padding: 10px;
      overflow-y: auto;
    }
    #chatInputContainer {
      display: flex;
      border-top: 1px solid #ccc;
    }
    #chatInput {
      flex-grow: 1;
      padding: 10px;
      border: none;
      outline: none;
    }
    #sendButton {
      padding: 10px;
      background-color: #007bff;
      color: white;
      cursor: pointer;
      border: none;
      outline: none;
    }
    #sendButton:hover {
      background-color: #0056b3;
    }
  `;

	// Append styles
	const styleSheet = document.createElement("style");
	styleSheet.type = "text/css";
	styleSheet.innerText = styles;
	document.head.appendChild(styleSheet);

	// Chatbot container
	const chatbotContainer = document.createElement("div");
	chatbotContainer.id = "chatbotContainer";
	chatbotContainer.innerHTML = `
    <div id="chatMessages"></div>
    <div id="chatInputContainer">
      <input type="text" id="chatInput" placeholder="Ask me anything..." />
      <button id="sendButton">Send</button>
    </div>
  `;
	document.body.appendChild(chatbotContainer);

	// Function to add message to chat window
	function addMessage(text, sender = "user") {
		const message = document.createElement("div");
		message.style.margin = "5px 0";
		message.style.padding = "10px";
		message.style.borderRadius = "5px";
		message.style.color = "white";
		message.style.backgroundColor = sender === "user" ? "#007bff" : "#555";
		message.textContent = text;
		document.getElementById("chatMessages").appendChild(message);
		document.getElementById("chatMessages").scrollTop =
			document.getElementById("chatMessages").scrollHeight;
	}

	// Handle sending messages
	async function sendMessage() {
		const inputField = document.getElementById("chatInput");
		const question = inputField.value.trim();
		if (!question) return;

		// Add user message to the chat
		addMessage(question, "user");
		inputField.value = ""; // Clear input

		// Get the entire page content
		const websiteContent = document.body.innerText;

		// POST request to your backend
		try {
			const response = await fetch(
				"https://template-next-silk.vercel.app/api/generate",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ websiteContent, question }),
				}
			);

			// Handle the response
			const data = await response.json();
			const answer = data.text || "Sorry, I couldn't find an answer.";

			// Display the answer in the chat
			addMessage(answer, "bot");
		} catch (error) {
			addMessage("Error: Could not connect to server.", "bot");
		}
	}

	// Add event listener to send button and input field
	document
		.getElementById("sendButton")
		.addEventListener("click", sendMessage);
	document.getElementById("chatInput").addEventListener("keydown", (e) => {
		if (e.key === "Enter") sendMessage();
	});
})();
