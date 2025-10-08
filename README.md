# cf_ai_edbot - Ed Bot MVP 
Try it now : [https://61b-edbot.elaineshu.workers.dev/](https://61b-edbot.elaineshu.workers.dev/)

<img width="1470" height="829" alt="Screenshot 2025-10-07 at 5 13 52 PM" src="https://github.com/user-attachments/assets/545cb85e-12f5-4644-a3ee-99c4f60d9035" />

AI and RAG powered course assistant that answers student questions by searching through course webpages and providing cited responses. Built with [Cloudflare Workers AI](https://ai.cloudflare.com/) and Llama 3.3.
This is an MVP that will later be integrated into the official course forum ([Edstem](https://edstem.org/)) to aid TAs in responding to common questions and providing citations.

## Features
* Cited Responses - provides sources to enable student agency in finding answers
* Hallucination Prevention - only answers from known course materials

## Prerequistes for running locally
* Node.js 18+
* Cloudflare account
* Wrangler CLI: `npm install -g wrangler`

## Future Enhancements
- [ ] Semantic Search with Vectorize (for smart search!)
- [ ] Integrate into course [Edstem](https://edstem.org/) and link to Edstem API
- [ ] Multi-turn conversation memory with Durable Objects
- [ ] Admin panel for resource upload
- [ ] Support for PDF uploads
- [ ] Confidence scores for answers



