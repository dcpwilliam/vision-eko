// options.js
document.getElementById('save').addEventListener('click', async () => {
    const cfg = {
      snowUrl: document.getElementById('snowUrl').value.trim(),
      authType: document.getElementById('authType').value,
      oauthToken: document.getElementById('oauthToken').value.trim(),
      username: document.getElementById('username').value.trim(),
      password: document.getElementById('password').value,
      ekoUrl: document.getElementById('ekoUrl').value.trim()
    };
    await chrome.storage.sync.set(cfg);
    alert('已保存');
  });
  