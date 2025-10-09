// src/index.ts - With Semantic Search
interface Env {
	AI: any;
	VECTORIZE: VectorizeIndex;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// Serve HTML page
		if (request.method === 'GET' && url.pathname === '/') {
			return new Response(HTML, {
				headers: { 'content-type': 'text/html;charset=UTF-8' },
			});
		}

		// Handle chat
		if (request.method === 'POST' && url.pathname === '/api/chat') {
			console.log('=== NEW CHAT REQUEST ===');

			try {
				const body = (await request.json()) as { message?: string };
				const message = body.message;

				if (!message) {
					return new Response(
						JSON.stringify({
							error: 'Message is required',
						}),
						{
							status: 400,
							headers: { 'content-type': 'application/json' },
						}
					);
				}

				console.log('Question:', message);
				const ai = env.AI;

				// 1. Convert question to embedding
				console.log('Generating question embedding...');
				const questionEmbedding = await ai.run('@cf/baai/bge-base-en-v1.5', {
					text: message,
				});

				// 2. Search for relevant chunks
				console.log('Searching vector database...');
				const matches = await env.VECTORIZE.query(questionEmbedding.data[0], {
					topK: 3, // Get top 3 most relevant chunks
					returnMetadata: true,
				});

				if (!matches.matches || matches.matches.length === 0) {
					return new Response(
						JSON.stringify({
							answer: "I don't have any information about that in the course materials.",
						}),
						{
							headers: { 'content-type': 'application/json' },
						}
					);
				}

				// 3. Build context from relevant chunks only
				const sources = new Map();
				const allContent = matches.matches
					.map((match: any, idx: number) => {
						sources.set(idx + 1, match.metadata.url);
						return `SOURCE ${idx + 1}:\n${match.metadata.text}`;
					})
					.join('\n\n---\n\n');

				console.log(`Found ${matches.matches.length} relevant chunks`);

				// Call AI
				console.log('Calling AI...');

				const aiResponse = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
					messages: [
						{
							role: 'system',
							content: `You are a helpful course assistant. Answer questions based ONLY on the content provided below.
  
  CRITICAL RULES:
  1. Only use information that appears in the actual text content
  2. If the answer is not explicitly in the provided content, say "I don't have that information in the course materials", without any citations
  3. DO NOT infer, assume, or make up information
  4. Mention the source once at the end like (Source: [url]), if the answer is in the sources.
  5. Be precise, factual, and concise. Do NOT repeat yourself or over-explain.`,
						},
						{
							role: 'user',
							content: `${allContent}\n\nQuestion: ${message}\n\nAnswer based only on the content above:`,
						},
					],
					max_tokens: 150,
					temperature: 0.3, // Lower temperature = less creative/hallucination
				});

				console.log('AI Response:', aiResponse);

				let answer = aiResponse.response || 'No response generated.';

				// Replace SOURCE references with actual URLs
				sources.forEach((url, id) => {
					const sourcePattern = new RegExp(`SOURCE ${id}`, 'g');
					answer = answer.replace(sourcePattern, url);
				});

				// Include sources for transparency
				const sourcesArray = Array.from(sources.entries()).map(([id, url]) => ({
					id,
					url,
				}));

				return new Response(
					JSON.stringify({
						answer,
						sources: sourcesArray,
					}),
					{
						headers: {
							'content-type': 'application/json',
							'access-control-allow-origin': '*',
						},
					}
				);
			} catch (error) {
				console.error('ERROR:', error);
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.error('Error details:', errorMessage);

				return new Response(
					JSON.stringify({
						error: 'Failed to process request',
						details: errorMessage,
					}),
					{
						status: 500,
						headers: { 'content-type': 'application/json' },
					}
				);
			}
		}

		return new Response('Not Found', { status: 404 });
	},
};
const HTML = `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Ed Bot Lite</title>
	  <style>
		  * { margin: 0; padding: 0; box-sizing: border-box; }
		  body {
			  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
			  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			  min-height: 100vh;
			  display: flex;
			  justify-content: center;
			  align-items: center;
			  padding: 20px;
		  }
		  .container {
			  background: white;
			  border-radius: 20px;
			  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
			  width: 100%;
			  max-width: 800px;
			  height: 600px;
			  display: flex;
			  flex-direction: column;
		  }
		  .header {
			  padding: 20px;
			  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			  color: white;
			  border-radius: 20px 20px 0 0;
		  }
		  .header h1 { font-size: 28px; margin-bottom: 5px; }
		  .header p { font-size: 14px; opacity: 0.95; }
		  .messages {
			  flex: 1;
			  overflow-y: auto;
			  padding: 20px;
			  display: flex;
			  flex-direction: column;
			  gap: 15px;
			  background: #f8f9fa;
		  }
		  .message {
			  display: flex;
			  gap: 10px;
			  max-width: 80%;
			  animation: slideIn 0.3s ease;
		  }
		  @keyframes slideIn {
			  from { opacity: 0; transform: translateY(10px); }
			  to { opacity: 1; transform: translateY(0); }
		  }
		  .message.user { 
			  align-self: flex-end; 
			  flex-direction: row-reverse;
		  }
		  .message-content {
			  padding: 12px 16px;
			  border-radius: 12px;
			  line-height: 1.6;
			  word-wrap: break-word;
		  }
		  .message.user .message-content {
			  background: #667eea;
			  color: white;
			  border-bottom-right-radius: 4px;
		  }
		  .message.assistant .message-content {
			  background: white;
			  color: #333;
			  border: 1px solid #e9ecef;
			  border-bottom-left-radius: 4px;
		  }
		  .input-area {
			  padding: 20px;
			  background: white;
			  border-top: 1px solid #e9ecef;
			  display: flex;
			  gap: 10px;
		  }
		  input {
			  flex: 1;
			  padding: 14px 18px;
			  border: 2px solid #e9ecef;
			  border-radius: 25px;
			  font-size: 14px;
			  outline: none;
		  }
		  input:focus { border-color: #667eea; }
		  button {
			  padding: 14px 32px;
			  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			  color: white;
			  border: none;
			  border-radius: 25px;
			  cursor: pointer;
			  font-weight: 600;
			  font-size: 14px;
		  }
		  button:hover:not(:disabled) { transform: scale(1.05); }
		  button:disabled {
			  opacity: 0.6;
			  cursor: not-allowed;
		  }
		  .typing {
			  display: flex;
			  gap: 4px;
			  padding: 12px 16px;
		  }
		  .typing span {
			  width: 8px;
			  height: 8px;
			  border-radius: 50%;
			  background: #667eea;
			  animation: bounce 1.4s infinite;
		  }
		  .typing span:nth-child(2) { animation-delay: 0.2s; }
		  .typing span:nth-child(3) { animation-delay: 0.4s; }
		  @keyframes bounce {
			  0%, 60%, 100% { transform: translateY(0); }
			  30% { transform: translateY(-10px); }
		  }
	  </style>
  </head>
  <body>
	  <div class="container">
		  <div class="header">
			  <h1>🤖 CS61B Ed Bot </h1>
			  <p> Chat about the Fall 2025 iteration of CS61B: Data Structures and Algorithms.  </p>
		  </div>
		  <div class="messages" id="messages">
			  <div class="message assistant">
				  <div class="message-content">
					  👋 Hi! Ask me a question about the course.
				  </div>
			  </div>
		  </div>
		  <div class="input-area">
			  <input 
				  type="text" 
				  id="input" 
				  placeholder="Ask a question..."
				  onkeypress="if(event.key==='Enter') send()"
			  />
			  <button onclick="send()" id="btn">Send</button>
		  </div>
	  </div>
  
	  <script>
		  const msgs = document.getElementById('messages');
		  const input = document.getElementById('input');
		  const btn = document.getElementById('btn');
  
		  async function send() {
			  const text = input.value.trim();
			  if (!text) return;
			  
			  addMsg(text, 'user');
			  input.value = '';
			  btn.disabled = true;
			  btn.textContent = 'Thinking...';
			  
			  const typingId = addTyping();
			  
			  try {
				  console.log('Sending request...');
				  const res = await fetch('/api/chat', {
					  method: 'POST',
					  headers: { 'Content-Type': 'application/json' },
					  body: JSON.stringify({ message: text })
				  });
				  
				  console.log('Response status:', res.status);
				  const data = await res.json();
				  console.log('Response data:', data);
				  
				  removeTyping(typingId);
				  
				  if (data.error) {
					  addMsg('Error: ' + data.error + (data.details ? ' - ' + data.details : ''), 'assistant');
				  } else {
					  addMsg(data.answer, 'assistant');
				  }
			  } catch (error) {
				  console.error('Fetch error:', error);
				  removeTyping(typingId);
				  addMsg('Connection error. Check console for details.', 'assistant');
			  }
			  
			  btn.disabled = false;
			  btn.textContent = 'Send';
		  }
		  
		  function addMsg(text, role) {
			  const div = document.createElement('div');
			  div.className = 'message ' + role;
			  div.innerHTML = '<div class="message-content">' + escapeHtml(text) + '</div>';
			  msgs.appendChild(div);
			  msgs.scrollTop = msgs.scrollHeight;
		  }
		  
		  function addTyping() {
			  const div = document.createElement('div');
			  div.className = 'message assistant';
			  div.id = 'typing';
			  div.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
			  msgs.appendChild(div);
			  msgs.scrollTop = msgs.scrollHeight;
			  return 'typing';
		  }
		  
		  function removeTyping(id) {
			  const el = document.getElementById(id);
			  if (el) el.remove();
		  }
		  
		  function escapeHtml(text) {
			  const div = document.createElement('div');
			  div.textContent = text;
			  return div.innerHTML;
		  }
	  </script>
  </body>
  </html>`;
