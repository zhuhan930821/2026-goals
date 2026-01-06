import { Client } from "@notionhq/client";

// V12 Direct Sync Backend (No AI)
export default async function handler(req, res) {
  // CORS 设置
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    const { title, category, summary, content } = req.body;

    if (!process.env.NOTION_KEY || !process.env.NOTION_DB_ID) {
      throw new Error("Missing Notion API Keys");
    }

    const notion = new Client({ auth: process.env.NOTION_KEY });

    // 将文本切分为 Notion 的段落块
    const childrenBlocks = content.split('\n').filter(line => line.trim()).map(line => ({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: line } }] }
    }));

    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DB_ID },
      properties: {
        "Name": { title: [{ text: { content: title } }] },
        "Type": { select: { name: category } }, 
        "Summary": { rich_text: [{ text: { content: summary } }] },
        "Created": { date: { start: new Date().toISOString() } }
      },
      children: childrenBlocks
    });

    res.status(200).json({ success: true, url: response.url });

  } catch (error) {
    console.error("Notion Error:", error);
    res.status(500).json({ error: error.message });
  }
}