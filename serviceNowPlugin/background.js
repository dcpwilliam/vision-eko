// background.js
importScripts('servicenow-bundle.js'); // 构建时把 servicenow.js 打包为 IIFE 或使用 ESModule service worker（需更高版本）

// 为简单起见，这里演示消息路由（popup.js -> background）
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if(msg.type === 'QA_INCIDENT'){
        const r = await self.createIncident(msg.payload);
        sendResponse({ ok:true, data:r });
      } else if(msg.type === 'QA_RESET'){
        const r = await self.orderCatalogItem(msg.payload);
        sendResponse({ ok:true, data:r });
      } else if(msg.type === 'QA_ACCESS'){
        const r = await self.orderCatalogItem(msg.payload);
        sendResponse({ ok:true, data:r });
      } else if(msg.type === 'QA_ONBOARD'){
        const r = await self.orderCatalogItem(msg.payload);
        sendResponse({ ok:true, data:r });
      } else if(msg.type === 'EKO_CHAT'){
        const cfg = await chrome.storage.sync.get(['openrouterApiKey','openrouterModel','openrouterBase']);
        if(!cfg.openrouterApiKey) throw new Error('未配置 OpenRouter API Key');

        // OpenAI Function Calling 兼容的 tools（JSON Schema）
        const tools = [
          {
            type: 'function',
            function: {
              name: 'createIncident',
              description: '创建报障工单',
              parameters: {
                type: 'object',
                properties: {
                  short_description: { type: 'string' },
                  description: { type: 'string' },
                  urgency: { type: 'string' },
                  impact: { type: 'string' },
                  category: { type: 'string' }
                },
                required: ['short_description','description']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'orderCatalogItem',
              description: '下单目录项（密码重置/权限申请/入职）',
              parameters: {
                type: 'object',
                properties: {
                  itemSysId: { type: 'string' },
                  variables: { type: 'object', additionalProperties: true }
                },
                required: ['itemSysId']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'searchKnowledge',
              description: '搜索知识库',
              parameters: {
                type: 'object',
                properties: {
                  query: { type: 'string' },
                  limit: { type: 'number' }
                },
                required: ['query']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'createChange',
              description: '创建变更请求',
              parameters: {
                type: 'object',
                properties: {
                  short_description: { type: 'string' },
                  description: { type: 'string' },
                  type: { type: 'string' }
                },
                required: ['short_description','description']
              }
            }
          }
        ];

        const base = (cfg.openrouterBase || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
        const url = base + '/chat/completions';
        const model = cfg.openrouterModel || 'openai/gpt-4o-mini';

        const res = await fetch(url, {
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            'Authorization': `Bearer ${cfg.openrouterApiKey}`,
            'X-Title': 'SNOW x Eko Assistant'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role:'system', content: 'You are an assistant integrated with ServiceNow. When necessary, request function calls to perform actions. Keep responses concise in Chinese.' },
              { role:'user', content: msg.text }
            ],
            tools,
            tool_choice: 'auto'
          })
        });
        const orData = await res.json();
        const choice = orData.choices?.[0] || {};
        const message = choice.message || {};
        const reply = message.content || '';
        const toolCalls = message.tool_calls || [];

        const results = [];
        if (toolCalls.length) {
          for (const call of toolCalls) {
            const name = call.function?.name;
            let args = {};
            try { args = JSON.parse(call.function?.arguments || '{}'); } catch(_) {}
            let out;
            if (name === 'createIncident') out = await self.createIncident(args);
            if (name === 'orderCatalogItem') out = await self.orderCatalogItem(args);
            if (name === 'searchKnowledge') out = await self.searchKnowledge(args);
            if (name === 'createChange') out = await self.createChange(args);
            results.push({ id: call.id || String(results.length+1), output: out });
          }
        }

        const data = { reply, toolCalls, toolResults: results };
        sendResponse({ ok:true, data });
      } else {
        sendResponse({ ok:false, error:'Unknown message type' });
      }
    } catch (e) {
      sendResponse({ ok:false, error:String(e?.message || e) });
    }
  })();
  return true; // 异步响应
});
