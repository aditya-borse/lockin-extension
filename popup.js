const blockedSitesTextarea = document.getElementById('blockedSites');
const saveButton = document.getElementById('saveButton');
const statusElement = document.getElementById('status');
const enabledCheckbox = document.getElementById('blockerEnabled');

function showStatus(message, isError = false) {
    statusElement.textContent = message;
    if (isError) {
        statusElement.classList.add('error');
    } else {
        statusElement.classList.remove('error');
    }
    setTimeout(() => {
        statusElement.textContent = '';
        statusElement.classList.remove('error');
    }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['blockedSites', 'isEnabled'], (result) => {
        blockedSitesTextarea.value = (result.blockedSites || []).join('\n');
        enabledCheckbox.checked = result.isEnabled !== undefined ? result.isEnabled : true;
    });
});

saveButton.addEventListener('click', () => {
    const sites = blockedSitesTextarea.value
        .split('\n')
        .map(s => s.trim().toLowerCase()) 
        .map(s => s.replace(/^(?:https?:\/\/)?(?:www\.)?/i, ''))
        .filter(s => s.length > 0 && s.includes('.')) 
        .filter((value, index, self) => self.indexOf(value) === index);

    blockedSitesTextarea.value = sites.join('\n');

    const isEnabled = enabledCheckbox.checked;

    chrome.storage.local.set({ blockedSites: sites, isEnabled: isEnabled }, () => {
        showStatus('Settings saved!');

        chrome.runtime.sendMessage({ action: "updateRules" });
    });
});

enabledCheckbox.addEventListener('change', () => {
    const isEnabled = enabledCheckbox.checked;
    chrome.storage.local.set({ isEnabled: isEnabled }, () => {
        chrome.runtime.sendMessage({ action: "updateRules" });

        if (isEnabled) {
            showStatus('Blocker enabled.');
        } else {
            showStatus('Blocker disabled.', true);
        }
    });
});