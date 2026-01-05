import { Client } from "@notionhq/client";
import OpenAI from "openai";

// Vercel Serverless Function 标准写法
export default async function handler(req, res) {
  // 1. 设置 CORS (允许前端访问)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // 处理预检请求 (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { input } = req.body; // 注意：这里不是 req.json()

    if (!process.env.NOTION_KEY || !process.env.OPENAI_API_KEY) {
      throw new Error("Missing API Keys in server environment");
    }

    const notion = new Client({ auth: process.env.NOTION_KEY });
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 2. 呼叫 AI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `你是一个 Notion 归档专家。分析用户输入，重组为 JSON。
          输出字段:
          - title: 标题
          - category: 必须是 ["Reading", "Reflection", "Logic", "Music", "Generic"] 之一
          - tags: 1-3个标签 (Array)
          - summary: 一句话总结
          - content: 清晰的 Markdown 格式内容`
        },
        { role: "user", content: input }
      ]
    });

    const aiData = JSON.parse(completion.choices[0].message.content);

    // Markdown 转 Blocks 简单处理
    const convertMarkdownToBlocks = (text) => {
      if (!text) return [];
      return text.split('\n').filter(l => l.trim()).map(l => {
        l = l.trim();
        if (l.startsWith('# ')) return { heading_1: { rich_text: [{ text: { content: l.replace('# ', '') } }] } };
        if (l.startsWith('## ')) return { heading_2: { rich_text: [{ text: { content: l.replace('## ', '') } }] } };
        if (l.startsWith('- ') || l.startsWith('* ')) return { bulleted_list_item: { rich_text: [{ text: { content: l.replace(/^[-*] /, '') } }] } };
        return { paragraph: { rich_text: [{ text: { content: l } }] } };
      });
    };

    // 3. 写入 Notion
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DB_ID },
      properties: {
        "Name": { title: [{ text: { content: aiData.title } }] },
        "Type": { select: { name: aiData.category } },
        "Tags": { multi_select: aiData.tags.map(t => ({ name: t })) },
        "Summary": { rich_text: [{ text: { content: aiData.summary } }] },
        "Created": { date: { start: new Date().toISOString() } }
      },
      children: convertMarkdownToBlocks(aiData.content)
    });

    res.status(200).json({ success: true, url: response.url });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: error.message });
  }
}