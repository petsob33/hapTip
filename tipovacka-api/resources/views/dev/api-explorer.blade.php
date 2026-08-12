<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <title>API Explorer — dev</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            margin: 0;
            display: flex;
            height: 100vh;
            color: #222;
        }
        header.topbar {
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 48px;
            background: #1f2937;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 12px;
            z-index: 10;
        }
        header.topbar strong { margin-right: 12px; }
        header.topbar input {
            width: 420px;
            max-width: 40vw;
            padding: 6px 8px;
            border-radius: 4px;
            border: 1px solid #555;
        }
        header.topbar button {
            padding: 6px 10px;
            border: none;
            border-radius: 4px;
            background: #2563eb;
            color: #fff;
            cursor: pointer;
        }
        header.topbar span.token-status {
            font-size: 12px;
            color: #9ca3af;
        }
        #sidebar {
            width: 340px;
            min-width: 340px;
            overflow-y: auto;
            border-right: 1px solid #ddd;
            margin-top: 48px;
            height: calc(100vh - 48px);
            padding-bottom: 40px;
        }
        #sidebar .group {
            border-bottom: 1px solid #eee;
        }
        #sidebar .group-title {
            font-weight: 600;
            padding: 8px 12px;
            background: #f3f4f6;
            position: sticky;
            top: 0;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.05em;
            color: #4b5563;
        }
        .endpoint-item {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            text-align: left;
            padding: 8px 12px;
            border: none;
            background: none;
            cursor: pointer;
            font-family: monospace;
            font-size: 13px;
        }
        .endpoint-item:hover { background: #eef2ff; }
        .endpoint-item.active { background: #dbeafe; }
        .method-tag {
            display: inline-block;
            min-width: 42px;
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 4px;
            border-radius: 3px;
            color: #fff;
        }
        .method-GET { background: #2563eb; }
        .method-POST { background: #16a34a; }
        .method-PUT { background: #ca8a04; }
        .method-PATCH { background: #ca8a04; }
        .method-DELETE { background: #dc2626; }
        .badge {
            margin-left: auto;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #d1d5db;
            flex-shrink: 0;
        }
        .badge.status-2xx { background: #16a34a; }
        .badge.status-4xx { background: #ea580c; }
        .badge.status-5xx { background: #dc2626; }
        .badge.status-error { background: #7c3aed; }
        #main {
            flex: 1;
            overflow-y: auto;
            margin-top: 48px;
            height: calc(100vh - 48px);
            padding: 24px;
        }
        .field-row {
            margin-bottom: 12px;
        }
        .field-row label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 4px;
            color: #374151;
        }
        .field-row input[type=text] {
            width: 100%;
            max-width: 480px;
            padding: 6px 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        textarea#body-input {
            width: 100%;
            max-width: 700px;
            height: 220px;
            font-family: monospace;
            font-size: 13px;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        .meta-line {
            font-size: 13px;
            color: #555;
            margin-bottom: 4px;
        }
        .meta-line code {
            background: #f3f4f6;
            padding: 1px 5px;
            border-radius: 3px;
        }
        #send-btn {
            padding: 8px 18px;
            border: none;
            border-radius: 4px;
            background: #2563eb;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
            margin-top: 6px;
        }
        #send-btn:disabled { background: #9ca3af; cursor: default; }
        #response-box {
            margin-top: 20px;
            max-width: 900px;
        }
        #response-meta {
            font-family: monospace;
            font-size: 13px;
            margin-bottom: 6px;
        }
        #response-meta .status-2xx { color: #16a34a; font-weight: 700; }
        #response-meta .status-4xx { color: #ea580c; font-weight: 700; }
        #response-meta .status-5xx { color: #dc2626; font-weight: 700; }
        #response-meta .status-error { color: #7c3aed; font-weight: 700; }
        #response-body {
            background: #111827;
            color: #e5e7eb;
            padding: 12px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 12.5px;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 60vh;
            overflow-y: auto;
        }
        .empty-hint {
            color: #888;
            margin-top: 40px;
        }
        .pill {
            display: inline-block;
            font-size: 11px;
            padding: 1px 6px;
            border-radius: 10px;
            background: #eef2ff;
            color: #4338ca;
            margin-left: 6px;
        }
        .pill.admin { background: #fee2e2; color: #b91c1c; }
    </style>
</head>
<body>

<header class="topbar">
    <strong>API Explorer</strong>
    <input type="text" id="token-input" placeholder="Bearer token…">
    <button id="token-save">Uložit token</button>
    <span class="token-status" id="token-status"></span>
</header>

<nav id="sidebar">
    @foreach ($groups as $groupName => $endpoints)
        <div class="group">
            <div class="group-title">{{ $groupName }}</div>
            @foreach ($endpoints as $endpoint)
                <button
                    type="button"
                    class="endpoint-item"
                    data-id="{{ $endpoint['id'] }}"
                    onclick="selectEndpoint('{{ $endpoint['id'] }}')"
                >
                    <span class="method-tag method-{{ $endpoint['method'] }}">{{ $endpoint['method'] }}</span>
                    <span>{{ $endpoint['uri'] }}</span>
                    <span class="badge" id="badge-{{ $endpoint['id'] }}"></span>
                </button>
            @endforeach
        </div>
    @endforeach
</nav>

<main id="main">
    <div class="empty-hint" id="empty-hint">Vyber endpoint vlevo.</div>
    <div id="detail" style="display:none;"></div>
</main>

<script>
const ENDPOINTS = @json($groups->flatten(1)->values());
const ENDPOINT_MAP = Object.fromEntries(ENDPOINTS.map(e => [e.id, e]));
const TOKEN_KEY = 'dev_api_token';
const STATUS_KEY_PREFIX = 'dev_api_status_';

function statusClass(status) {
    if (status === 'error') return 'status-error';
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    if (status >= 500) return 'status-5xx';
    return '';
}

function loadToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
}

function saveToken(value) {
    localStorage.setItem(TOKEN_KEY, value);
    document.getElementById('token-status').textContent = value ? 'Token uložen.' : 'Token smazán.';
}

function applyStoredBadges() {
    ENDPOINTS.forEach(e => {
        const raw = localStorage.getItem(STATUS_KEY_PREFIX + e.id);
        if (!raw) return;
        const badge = document.getElementById('badge-' + e.id);
        if (badge) badge.classList.add(statusClass(raw === 'error' ? 'error' : parseInt(raw, 10)));
    });
}

function setBadge(id, status) {
    localStorage.setItem(STATUS_KEY_PREFIX + id, status);
    const badge = document.getElementById('badge-' + id);
    if (!badge) return;
    badge.className = 'badge ' + statusClass(status === 'error' ? 'error' : status);
}

let activeId = null;

function selectEndpoint(id) {
    activeId = id;
    document.querySelectorAll('.endpoint-item').forEach(el => el.classList.remove('active'));
    const btn = document.querySelector('.endpoint-item[data-id="' + id + '"]');
    if (btn) btn.classList.add('active');

    document.getElementById('empty-hint').style.display = 'none';
    const detail = document.getElementById('detail');
    detail.style.display = 'block';
    detail.innerHTML = renderForm(ENDPOINT_MAP[id]);
}

function renderForm(endpoint) {
    let html = '';
    html += '<div class="meta-line"><span class="method-tag method-' + endpoint.method + '">' + endpoint.method + '</span> <code>' + endpoint.uri + '</code></div>';
    html += '<div class="meta-line">Name: <code>' + (endpoint.name || '—') + '</code></div>';
    html += '<div class="meta-line">Controller: <code>' + endpoint.action + '</code>';
    if (endpoint.requires_auth) html += '<span class="pill">auth:sanctum</span>';
    if (endpoint.requires_admin) html += '<span class="pill admin">admin</span>';
    html += '</div>';

    if (endpoint.path_params.length) {
        html += '<h4>Path parametry</h4>';
        endpoint.path_params.forEach(p => {
            html += '<div class="field-row"><label>' + p + '</label><input type="text" class="path-param" data-param="' + p + '" placeholder="' + p + '"></div>';
        });
    }

    if (endpoint.query_params.length) {
        html += '<h4>Query parametry</h4>';
        endpoint.query_params.forEach(p => {
            html += '<div class="field-row"><label>' + p + '</label><input type="text" class="query-param" data-param="' + p + '" placeholder="' + p + '"></div>';
        });
    }

    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        html += '<h4>JSON body</h4>';
        html += '<textarea id="body-input">' + JSON.stringify(endpoint.example_body, null, 2) + '</textarea>';
    }

    html += '<div><button id="send-btn" onclick="sendRequest()">Odeslat</button></div>';
    html += '<div id="response-box"></div>';

    return html;
}

async function sendRequest() {
    const endpoint = ENDPOINT_MAP[activeId];
    if (!endpoint) return;

    let uri = endpoint.uri;
    document.querySelectorAll('.path-param').forEach(input => {
        uri = uri.replace('{' + input.dataset.param + '}', encodeURIComponent(input.value || ''));
        uri = uri.replace('{' + input.dataset.param + '?}', encodeURIComponent(input.value || ''));
    });

    const queryPairs = [];
    document.querySelectorAll('.query-param').forEach(input => {
        if (input.value !== '') {
            queryPairs.push(encodeURIComponent(input.dataset.param) + '=' + encodeURIComponent(input.value));
        }
    });
    if (queryPairs.length) {
        uri += '?' + queryPairs.join('&');
    }

    const url = window.location.origin + uri;
    const headers = { 'Accept': 'application/json' };
    const token = loadToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const options = { method: endpoint.method, headers };

    const bodyInput = document.getElementById('body-input');
    if (bodyInput) {
        headers['Content-Type'] = 'application/json';
        try {
            options.body = JSON.stringify(JSON.parse(bodyInput.value));
        } catch (e) {
            renderResponse('error', null, 'Neplatný JSON v body: ' + e.message);
            setBadge(activeId, 'error');
            return;
        }
    }

    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Odesílám…';

    const started = performance.now();
    try {
        const response = await fetch(url, options);
        const elapsed = Math.round(performance.now() - started);
        const text = await response.text();
        let formatted = text;
        try {
            formatted = JSON.stringify(JSON.parse(text), null, 2);
        } catch (e) {
            // not JSON, show raw text
        }
        renderResponse(response.status, elapsed, formatted);
        setBadge(activeId, response.status);
    } catch (e) {
        const elapsed = Math.round(performance.now() - started);
        renderResponse('error', elapsed, 'Fetch selhal: ' + e.message);
        setBadge(activeId, 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Odeslat';
    }
}

function renderResponse(status, elapsedMs, body) {
    const box = document.getElementById('response-box');
    const cls = statusClass(status === 'error' ? 'error' : status);
    const statusLabel = status === 'error' ? 'ERROR' : status;
    const timeLabel = elapsedMs !== null ? elapsedMs + ' ms' : '';
    box.innerHTML =
        '<div id="response-meta"><span class="' + cls + '">' + statusLabel + '</span> ' + timeLabel + '</div>' +
        '<div id="response-body"></div>';
    document.getElementById('response-body').textContent = body;
}

document.getElementById('token-input').value = loadToken();
document.getElementById('token-status').textContent = loadToken() ? 'Token uložen.' : '';
document.getElementById('token-save').addEventListener('click', () => {
    saveToken(document.getElementById('token-input').value.trim());
});

applyStoredBadges();
</script>

</body>
</html>
