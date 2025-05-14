// renderer.js
window.electronAPI.onAppVersion((version) => {
    const versionElement = document.getElementById('version');
    if (versionElement) {
        versionElement.innerText = version;
    }
});

const checkUpdateBtn = document.getElementById('checkUpdateBtn');
const updateMessageDiv = document.getElementById('updateMessage');

if (checkUpdateBtn) {
    checkUpdateBtn.addEventListener('click', () => {
        if (updateMessageDiv) updateMessageDiv.innerText = 'Requesting update check...';
        window.electronAPI.checkForUpdate();
    });
}

window.electronAPI.onUpdateMessage((message) => {
    if (updateMessageDiv) {
        updateMessageDiv.innerText = message;
    }
    console.log('Update Message from Main:', message);
});