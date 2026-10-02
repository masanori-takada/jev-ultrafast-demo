// Toolbar button -> inject the self-contained panel (panel.js) into the active tab. Second click toggles it off.
// Needs only activeTab + scripting. No host permissions, no remote code, no network access.
async function jevToggle(tab) {
  if (!tab || tab.id == null) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { globalThis.__JEV_EXT__ = true; } });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['panel.js'] });
  } catch (e) {
    // chrome:// pages, the Web Store, PDF viewer etc. cannot be scripted
    chrome.action.setBadgeText({ tabId: tab.id, text: '×' });
    chrome.action.setTitle({ tabId: tab.id, title: 'このページでは使えません' });
    setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: '' }), 3000);
  }
}
chrome.action.onClicked.addListener(jevToggle);
