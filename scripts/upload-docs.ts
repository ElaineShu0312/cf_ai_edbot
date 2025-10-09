interface Env {
    AI: any;
    VECTORIZE: any;
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
    const response = await fetch(url);
    const html = await response.text();
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  function chunkText(text: string, maxChars: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += maxChars - 50) {
      const chunk = text.slice(i, i + maxChars).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
    }
    return chunks;
  }
  
  export default {
    async fetch(request: Request, env: Env): Promise<Response> {
      const ai = env.AI;
      const vectors: any[] = [];
      let globalIndex = 0;
  
      for (const url of COURSE_MATERIALS) {
        console.log(`Processing ${url}...`);
        const content = await scrapeWebpage(url);
        const chunks = chunkText(content, 800); // Increased to 800
  
        for (let i = 0; i < chunks.length; i++) {
          const embedding = await ai.run('@cf/baai/bge-base-en-v1.5', {
            text: chunks[i],
          });
  
          vectors.push({
            id: `chunk-${globalIndex}`,  // Short ID
            values: embedding.data[0],
            metadata: {
              text: chunks[i],
              url: url,
              chunkIndex: i,
            },
          });
          
          globalIndex++;
        }
      }
  
      await env.VECTORIZE.upsert(vectors);
      return new Response(`✅ Uploaded ${vectors.length} chunks from ${COURSE_MATERIALS.length} pages!`);
    },
  };