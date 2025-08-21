// servicenow.js
export async function snowFetch(path, method = 'GET', body) {
    const { snowUrl, authType, oauthToken, username, password } = await chrome.storage.sync.get([
      'snowUrl','authType','oauthToken','username','password'
    ]);
    if(!snowUrl) throw new Error('未配置 ServiceNow 实例地址');
  
    const headers = { 'Accept': 'application/json' };
    if (method && method.toUpperCase() !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }
    if(authType === 'oauth' && oauthToken) {
      let token = String(oauthToken).trim();
      token = token.replace(/^bearer\s+/i, '');
      headers['Authorization'] = `Bearer ${token}`;
    } else if(authType === 'basic' && username && password) {
      headers['Authorization'] = 'Basic ' + btoa(`${username}:${password}`);
    } else {
      throw new Error('未配置有效的认证方式');
    }
  
    const base = String(snowUrl).replace(/\/$/, '');
    const fullUrl = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    if(!res.ok) {
      let detail = '';
      try {
        const errJson = await res.clone().json();
        detail = errJson?.error?.message || errJson?.result?.error?.message || JSON.stringify(errJson);
      } catch(_) {
        detail = await res.text().catch(()=> '');
      }
      throw new Error(`ServiceNow API 错误: ${res.status} ${detail}`);
    }
    return res.json();
  }
  
  // —— 常用封装 ——
  
  // 1) Incident：创建报障
  export async function createIncident({ short_description, description, urgency='3', impact='3', category='inquiry' }) {
    return snowFetch('/api/now/table/incident', 'POST', {
      short_description, description, urgency, impact, category
    });
  }
  
  // 2) Catalog：下单（例如重置密码/申请访问/入职套餐）
  export async function orderCatalogItem({ itemSysId, variables = {} }) {
    // 获取下单 token（不同版本可能略有差异，以下为标准接口示例）
    return snowFetch(`/api/sn_sc/servicecatalog/items/${itemSysId}/order_now`, 'POST', { sysparm_quantity: '1', variables });
  }
  
  // 3) Knowledge：搜索知识库
  export async function searchKnowledge({ query, limit=5 }) {
    // 简化：直接用 table 查询标题/简述
    const q = encodeURIComponent(query);
    return snowFetch(`/api/now/table/kb_knowledge?sysparm_display_value=true&sysparm_limit=${limit}&sysparm_query=short_descriptionLIKE${q}^ORdescriptionLIKE${q}`);
  }
  
  // 4) Change：创建变更（示例）
  export async function createChange({ short_description, description, type='standard' }) {
    return snowFetch('/api/now/table/change_request', 'POST', {
      short_description, description, type
    });
  }
  