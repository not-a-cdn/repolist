// Made by Not-a-Cdn
// Remember, this is not a cdn.
const ORG = 'not-a-cdn';
const output = document.getElementById('output');
const backBtn = document.getElementById('backBtn');
let historyStack = [];

function goBack() {
    if (historyStack.length > 0) {
    const last = historyStack.pop();
    last();
    }
    if (historyStack.length === 0) backBtn.style.display = 'none';
}

function clear() {
    output.textContent = '';
}

function line(text, onClick = null) {
    const div = document.createElement('div');
    div.textContent = text;
    if (onClick) div.style.cursor = 'pointer';
    if (onClick) div.onclick = onClick;
    output.appendChild(div);
}

async function showRaw(url, path) {
    clear();
    backBtn.style.display = 'block';
    historyStack.push(() => loadFolder(currentRepo, currentPath));
    line('- ' + path + '\n');
    const content = await fetch(url).then(r => r.text()).catch(() => 'Error loading file.');
    line(content);
}

let currentRepo = '';
let currentPath = '';

async function loadFolder(repo, path = '') {
    currentRepo = repo;
    currentPath = path;
    clear();
    backBtn.style.display = historyStack.length ? 'block' : 'none';

    const prefix = path ? path + '/' : '';
    line('/' + repo + (path ? '/' + path : '') + '\n');

    const url = `https://api.github.com/repos/${ORG}/${repo}/contents/${path}`;
    const res = await fetch(url);
    const items = await res.json();

    for (const item of items) {
    if (item.type === 'dir') {
        line('- ' + prefix + item.name + '/', () => {
        historyStack.push(() => loadFolder(repo, path));
        loadFolder(repo, prefix + item.name);
        });
    } else if (item.type === 'file') {
        line('- ' + prefix + item.name, () => {
        historyStack.push(() => loadFolder(repo, path));
        showRaw(item.download_url, prefix + item.name);
        });
    }
    }
}

async function listRepos() {
    clear();
    backBtn.style.display = 'none';
    const res = await fetch(`https://api.github.com/orgs/${ORG}/repos?per_page=100&sort=updated`);
    const repos = await res.json();

    line(ORG + ' GitHub Repositories\n');

    repos.forEach(repo => {
    line('- ' + repo.name + (repo.description ? ' — ' + repo.description : ''), () => {
        historyStack.push(listRepos);
        loadFolder(repo.name);
    });
    });
}

listRepos();
