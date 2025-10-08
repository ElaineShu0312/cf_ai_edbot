// src/index.ts - Simplified & Debugged Version
interface Env {
	AI: any;
}


const COURSE_MATERIALS = [
	'https://fa25.datastructur.es/policies/exams/',
	'https://fa25.datastructur.es/policies/extensions/',
	'https://fa25.datastructur.es/policies/cs47b/',
	'https://fa25.datastructur.es/policies/academic-misconduct/',
	'https://fa25.datastructur.es/resources/assignment-workflow/',
	'https://fa25.datastructur.es/resources/exam-archive/',
	'https://fa25.datastructur.es/resources/exam-study-tips/',
	'https://fa25.datastructur.es/resources/using-ed/',
	'https://fa25.datastructur.es/resources/using-git/',
	'https://fa25.datastructur.es/resources/using-oh/',
	'https://fa25.datastructur.es/resources/using-debugger/',
	'https://fa25.datastructur.es/homeworks/hw01/',
	'https://fa25.datastructur.es/troubleshooting/git-wtfs/',
];

async function scrapeWebpage(url: string): Promise<string> {
	try {
		console.log(`Fetching ${url}...`);
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; EdBot/1.0)',
			},
		});

		if (!response.ok) {
			console.error(`HTTP ${response.status} for ${url}`);
			return '';
		}

		const html = await response.text();
		console.log(`Fetched ${html.length} characters from ${url}`);

		// Simple text extraction
		const cleanText = html
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
			.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
			.slice(0, 5000); 

		console.log(`Cleaned to ${cleanText.length} characters`);
		return cleanText;
	} catch (error) {
		console.error(`Failed to scrape ${url}:`, error);
		return '';
	}
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

				// Scrape course materials
				console.log('Starting scrape...');
				const scrapedContent: { url: string; content: string }[] = [];

				for (const courseUrl of COURSE_MATERIALS) {
					const content = await scrapeWebpage(courseUrl);
					if (content) {
						scrapedContent.push({ url: courseUrl, content });
					}
				}

				if (scrapedContent.length === 0) {
					console.error('No content scraped!');
					return new Response(
						JSON.stringify({
							answer: 'Sorry, I could not retrieve course materials. Please try again.',
						}),
						{
							headers: { 'content-type': 'application/json' },
						}
					);
				}

				// Format content with clear source markers
				const allContent = scrapedContent.map((item, idx) => `SOURCE ${idx + 1}:\n${item.content}`).join('\n\n---\n\n');

				console.log(`Total content: ${allContent.length} characters`);

				// Call AI
				console.log('Calling AI...');
				const ai = env.AI;

				const aiResponse = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
					messages: [
						{
							role: 'system',
							content: `You are a helpful course assistant. Answer questions based ONLY on the content provided below.
  
								CRITICAL RULES:
								1. Only use information that appears in the actual text content
								2. If the answer is not explicitly in the provided content, say "I don't have that information in the course materials"
								3. DO NOT infer, assume, or make up information
								4. When citing, reference "SOURCE 1", "SOURCE 2", etc.
								5. Be precise and factual`,
						},
						{
							role: 'user',
							content: `${allContent}\n\nQuestion: ${message}\n\nAnswer based only on the content above:`,
						},
					],
					max_tokens: 300,
					temperature: 0.3, // Lower temperature = less creative/hallucination
				});

				console.log('AI Response:', aiResponse);

				const answer = aiResponse.response || 'No response generated.';

				// Include sources for transparency
				const sources = scrapedContent.map((item, idx) => ({
					id: idx + 1,
					url: item.url,
				}));

				return new Response(
					JSON.stringify({
						answer,
						sources,
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
