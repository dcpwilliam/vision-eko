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
        const cfg = await chrome.storage.sync.get(['ekoUrl']);
        if(!cfg.ekoUrl) throw new Error('未配置 Eko 引擎 API');

        // 将可用“工具”Schema告知 Eko，引擎可在链路中调用
        const tools = [
          { name:'createIncident', description:'创建报障工单', args:['short_description','description','urgency','impact','category'] },
          { name:'orderCatalogItem', description:'下单目录项（密码重置/权限申请/入职）', args:['itemSysId','variables'] },
          { name:'searchKnowledge', description:'搜索知识库', args:['query','limit'] },
          { name:'createChange', description:'创建变更请求', args:['short_description','description','type'] }
        ];

        const res = await fetch(cfg.ekoUrl, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({
            query: msg.text,
            tools,
            // 可选：让 Eko 通过 toolCall 回调再由 extension 执行
            mode: 'tool-calls-via-extension'
          })
        });
        const data = await res.json();

        // 如果 Eko 返回 toolCalls，就在此执行 ServiceNow API，并把结果回传给 Eko（或直接整合到回复里）
        if (data.toolCalls?.length) {
          const results = [];
          for (const call of data.toolCalls) {
            let out;
            if (call.name === 'createIncident') out = await self.createIncident(call.args);
            if (call.name === 'orderCatalogItem') out = await self.orderCatalogItem(call.args);
            if (call.name === 'searchKnowledge') out = await self.searchKnowledge(call.args);
            if (call.name === 'createChange') out = await self.createChange(call.args);
            results.push({ id: call.id, output: out });
          }
          data.toolResults = results;
        }

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
