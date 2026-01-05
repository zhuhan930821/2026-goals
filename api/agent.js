import { Client } from "@notionhq/client";
import OpenAI from "openai";

export default async function handler(req, res) {
  // CORS 设置 (保持不变)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    const { input } = req.body;

    const notion = new Client({ auth: process.env.NOTION_KEY });
    
    // --- 修改开始：切换到 Google 免费线路 ---
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY, // 这里一会儿去 Vercel 填 Google 的 Key
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/" // Google 的 OpenAI 兼容地址
    });

    const completion = await openai.chat.completions.create({
      model: "gemini-1.5-flash", // <--- 改用 Google 的免费模型 (速度极快)
      response_format: { type: "json_object" }, 
      messages: [
        {
          role: "system",
          content: `你是一个 Notion 归档专家。分析用户输入，重组为 JSON。
          
          输出 JSON 格式要求:
          {
            "title": "简短标题",
            "category": "必须是 Reading, Reflection, Logic, Music, Generic 其中之一",
            "tags": ["tag1", "tag2"],
            "summary": "一句话总结",
            "content": "Markdown格式正文"
          }`
        },
        { role: "user", content: input }
      ]
    });
    // --- 修改结束 ---

    const aiData = JSON.parse(completion.choices[0].message.content);

    // 下面 Notion 写入逻辑保持不变
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