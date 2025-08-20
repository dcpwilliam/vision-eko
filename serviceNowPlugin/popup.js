const log = document.getElementById('chat-log');
const input = document.getElementById('chat-input');
const sendBtn = document.getElementById('chat-send');

function appendMsg(text, who='bot'){
  const div = document.createElement('div');
  div.className = `msg msg--${who==='user'?'user':'bot'}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

sendBtn.addEventListener('click', () => send());
input.addEventListener('keydown', (e) => { if(e.key==='Enter'){ send(); }});

function send(){
  const txt = input.value.trim();
  if(!txt) return;
  appendMsg(txt,'user');
  input.value = '';

  chrome.runtime.sendMessage({ type:'EKO_CHAT', text: txt }, (res) => {
    if(!res?.ok) return appendMsg(`❌ ${res?.error || '对话失败'}`);
    const { data } = res;
    if(data.toolResults?.length){
      appendMsg(`🛠 已执行 ${data.toolResults.length} 个操作`);
    }
    appendMsg(data.reply || data.text || '（无回复文本）');
  });
}

// 快捷入口：根据你企业的目录项 sys_id 进行配置
document.getElementById('qa-incident').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type:'QA_INCIDENT', payload:{
    short_description:'通用故障报修（来自插件）',
    description:'用户在插件中发起报障，请 IT 跟进',
    urgency:'3', impact:'3', category:'inquiry'
  }}, (res) => {
    if(!res?.ok) return appendMsg('❌ 报障失败：' + res.error);
    appendMsg('✅ 已创建报障：' + (res.data?.result?.number || ''));
  });
});

document.getElementById('qa-reset').addEventListener('click', () => {
  // 假设密码重置目录项 sys_id
  const RESET_SYS_ID = 'xxxxxxxxxxxxxx';
  chrome.runtime.sendMessage({ type:'QA_RESET', payload:{
    itemSysId: RESET_SYS_ID,
    variables: { user: 'me' } // 按需替换目录项变量
  }}, (res) => {
    if(!res?.ok) return appendMsg('❌ 重置密码下单失败：' + res.error);
    appendMsg('✅ 已提交密码重置请求');
  });
});

document.getElementById('qa-access').addEventListener('click', () => {
  const ACCESS_SYS_ID = 'yyyyyyyyyyyyyy';
  chrome.runtime.sendMessage({ type:'QA_ACCESS', payload:{
    itemSysId: ACCESS_SYS_ID,
    variables: { system: 'ERP', role: 'read' }
  }}, (res) => {
    if(!res?.ok) return appendMsg('❌ 访问申请失败：' + res.error);
    appendMsg('✅ 已提交访问申请');
  });
});

document.getElementById('qa-onboard').addEventListener('click', () => {
  const ONBOARD_SYS_ID = 'zzzzzzzzzzzzzz';
  chrome.runtime.sendMessage({ type:'QA_ONBOARD', payload:{
    itemSysId: ONBOARD_SYS_ID,
    variables: { employee_name: '新员工', start_date: new Date().toISOString().slice(0,10) }
  }}, (res) => {
    if(!res?.ok) return appendMsg('❌ 入职流程触发失败：' + res.error);
    appendMsg('✅ 已触发入职流程');
  });
});
