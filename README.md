# cf_ai_edbot - Ed Bot MVP 
**Try it now!!! : [https://61b-edbot.elaineshu.workers.dev/](https://61b-edbot.elaineshu.workers.dev/)**

https://github.com/user-attachments/assets/175eef61-da29-414e-8348-24362168835b


An AI-powered course assistant that answers student questions by semantically searching through course materials and providing cited responses. Built with [Cloudflare Workers AI](https://ai.cloudflare.com/), Vectorize, and Llama 3.3 70B.


**This is an MVP designed to assist TAs in the [CS61B course at UC Berkeley](https://sp25.datastructur.es/) by answering common student questions with accurate citations to course materials. I envision it will later be integrated into our official course forum ([Edstem](https://edstem.org/)).**

---

## Features
* Semantic Search with Vectorize: uses vector embeddings to efficiently search through course materials
* Cited Responses: provides sources to enable student agency in finding answers
* Hallucination Prevention: only answers from known course materials
* Clean Chat Interface (only in the MVP).

## Architecture
```
User Question 
    ↓
Convert to embedding (Workers AI)
    ↓
Search vector database (Vectorize) → Returns top 3 relevant chunks
    ↓
Send chunks + question to LLM (Llama 3.3 70B)
    ↓
Generate cited answer
    ↓
Display with clickable sources
```

## Tech Stack
* LLM: Llama 3.3 70B (via Cloudflare Workers AI)
* Vector Search: Cloudflare Vectorize
* Workflow: Cloudflare Workers + Hono framework
* Frontend: Vanilla JS and CSS
* Database: Vector database storing 800+ chunks from 13+ course pages.

  
---

## Setup
### 1. Clone and Install
### 2. Authenticate with Cloudflare
```
npx wrangler login
```

### 3. Create Vector Index
```
npx wrangler vectorize create course-docs --dimensions=768 --metric=cosine
```

### 4. Upload your own Webpages
Edit `scripts/upload-docs.ts` and add your own URLS:
```typescript
const COURSE_MATERIALS = [
  'https://your-course-site.edu/syllabus',
  'https://your-course-site.edu/policies',
  // Add more URLs...
];
```

### 5. Upload Course Materials to Vector DB
`npx wrangler dev scripts/upload-docs.ts`
This will scrape all URLs, split content into chunks, generate embeddings for each chunk, and upload to Vectorize!
It may take some time to run, depending on the number of links you've added.

### 6. Test locally
```
npm run dev
```

### 7. Deploy 
```
npm wrangler deploy
```
Your bot will now be live at `https://cf-ai-edbot.YOUR-SUBDOMAIN.workers.dev`

---

## Future Enhancements
- [X] Semantic Search with Vectorize (for smart search!)
- [ ] Integrate into course [Edstem](https://edstem.org/) and link to Edstem API
- [ ] Multi-turn conversation memory with Durable Objects
- [ ] Admin panel for resource upload
- [ ] Support for PDF uploads
- [ ] Confidence scores for answers



