const RULE_ID_BLOCKER = 1;

async function updateBlockingRules() {
    const { blockedSites, isEnabled } = await chrome.storage.local.get(['blockedSites', 'isEnabled']);

    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = currentRules.map(rule => rule.id);

    let rulesToAdd = [];
    if (isEnabled && blockedSites && blockedSites.length > 0) {
        rulesToAdd = [{
            id: RULE_ID_BLOCKER,
            priority: 1,
            action: {
                type: "redirect",
                redirect: { extensionPath: "/blocked.html" }
            },
            condition: {
                requestDomains: blockedSites,
                resourceTypes: ["main_frame"]
            }
        }];
        console.log("Applying rules for:", blockedSites);
    } else {
        console.log("Blocking disabled or no sites listed. Removing rules.");
    }

    try {
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIdsToRemove,
            addRules: rulesToAdd
        });
        console.log("Rules updated successfully.");
    } catch (error) {
        console.error("Error updating rules:", error);
    }
}

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed/updated. Setting initial state.");
    chrome.storage.local.get(['isEnabled', 'blockedSites'], (result) => {
        if (result.isEnabled === undefined) {
            chrome.storage.local.set({ isEnabled: true });
        }
        if (result.blockedSites === undefined) {
            chrome.storage.local.set({ blockedSites: [] });
        }
        updateBlockingRules();
    });
});

chrome.runtime.onStartup.addListener(() => {
    console.log("Chrome started. Ensuring rules are up-to-date.");
    updateBlockingRules();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateRules") {
        console.log("Received updateRules message from popup.");
        updateBlockingRules();
        sendResponse({ status: "Rules update triggered" });
        return true;
    }
});