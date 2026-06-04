const WEBHOOK = 'https://mbaghdadi6g.app.n8n.cloud/webhook/accessibility-check';

const imageInput   = document.getElementById('imageInput');
const preview      = document.getElementById('preview');
const dropZone     = document.getElementById('dropZone');
const dropFilename = document.getElementById('dropFilename');

imageInput.addEventListener('change', function () {
  showPreview(this.files[0]);
});

dropZone.addEventListener('dragover', function (e) {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', function () {
  dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', function (e) {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length) {
    imageInput.files = e.dataTransfer.files;
    showPreview(e.dataTransfer.files[0]);
  }
});

function showPreview(file) {
  if (!file) return;
  dropFilename.textContent = file.name;
  dropFilename.style.display = 'block';
  var url = URL.createObjectURL(file);
  preview.innerHTML = '<img src="' + url + '" alt="Preview">';
}

async function submitForm() {
  var apiKey     = document.getElementById('apiKey').value.trim();
  var locType    = document.getElementById('locationType').value;
  var statusEl   = document.getElementById('status');
  var btn        = document.getElementById('submitBtn');
  var spinner    = document.getElementById('spinner');
  var btnLabel   = document.getElementById('btnLabel');
  var resultWrap = document.getElementById('result-wrap');
  var frame      = document.getElementById('result-frame');

  statusEl.className = '';

  if (!apiKey) { setStatus(statusEl, '⚠️ Please enter your access key.', 'error'); return; }
  if (!imageInput.files.length) { setStatus(statusEl, '⚠️ Please select an image.', 'error'); return; }

  var file = imageInput.files[0];
  if (file.size > 10 * 1024 * 1024) { setStatus(statusEl, '⚠️ File exceeds 10 MB limit.', 'error'); return; }
  var allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.indexOf(file.type) === -1) { setStatus(statusEl, '⚠️ Invalid file type. Use JPEG, PNG or WEBP.', 'error'); return; }

  setLoading(btn, spinner, btnLabel, true);
  setStatus(statusEl, 'Sending to AI — this may take 15–30 seconds…', '');
  resultWrap.classList.remove('visible');

  // Send as multipart/form-data — n8n reads the binary automatically
  var fd = new FormData();
  fd.append('image', file);
  fd.append('location_type', locType);

  try {
    var res = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: fd
    });

    if (res.status === 401) { setStatus(statusEl, '⛔ Invalid access key.', 'error'); return; }
    if (!res.ok) { setStatus(statusEl, '❌ Server error (' + res.status + '). Check n8n Executions.', 'error'); return; }

    var html = await res.text();
    frame.srcdoc = injectStyles(html);
    resultWrap.classList.add('visible');
    setStatus(statusEl, '✓ Report ready — scroll down to view.', 'success');
    resultWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    setStatus(statusEl, '❌ Network error. Check your connection.', 'error');
  } finally {
    setLoading(btn, spinner, btnLabel, false);
  }
}

function setStatus(el, message, cls) {
  el.textContent = message;
  el.className = cls;
}

function setLoading(btn, spinner, label, isLoading) {
  btn.disabled = isLoading;
  spinner.style.display = isLoading ? 'block' : 'none';
  label.textContent = isLoading ? 'Analysing…' : 'Analyse Accessibility';
}

function injectStyles(html) {
  var styles = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink:       #0f1923;
    --ink-soft:  #4a5568;
    --ink-faint: #8898aa;
    --paper:     #f7f5f0;
    --white:     #ffffff;
    --accent:    #2d6a4f;
    --accent-lt: #d8f3dc;
    --warn:      #e07b39;
    --border:    #e2ddd6;
    --radius:    16px;
    --shadow:    0 4px 24px rgba(15,25,35,.08);
  }
  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--paper);
    color: var(--ink);
    padding: 32px 28px 48px;
    line-height: 1.6;
  }
  h1, h2, h3, h4 {
    font-family: 'DM Serif Display', serif;
    font-weight: 400;
    color: var(--ink);
    margin-bottom: 14px;
    line-height: 1.2;
  }
  h1 { font-size: 28px; margin-bottom: 24px; }
  h2 { font-size: 22px; margin-top: 28px; }
  h3 { font-size: 18px; margin-top: 20px; }
  p { color: var(--ink-soft); margin-bottom: 12px; font-size: 15px; }
  ul, ol { padding-left: 20px; color: var(--ink-soft); font-size: 14px; margin-bottom: 12px; }
  li { margin-bottom: 8px; line-height: 1.5; }
  section, .card, .report-section {
    background: var(--white);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
    padding: 24px 28px;
    margin-bottom: 20px;
  }
  .score-row, .mini-scores, [class*="score-row"], [class*="mini-score"] {
    display: flex;
    flex-wrap: nowrap;
    gap: 10px;
    overflow-x: auto;
    margin-bottom: 16px;
  }
  .mini-score, [class*="mini-score"] {
    flex: 1 1 0;
    min-width: 0;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 12px;
    text-align: center;
    font-size: 12px;
    color: var(--ink-soft);
    white-space: nowrap;
  }
  .mini-score strong, [class*="mini-score"] strong {
    display: block;
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    font-weight: 400;
    color: var(--accent);
    line-height: 1.2;
  }
  .score, [class*="overall-score"] {
    font-family: 'DM Serif Display', serif;
    font-size: 48px;
    font-weight: 400;
    color: var(--accent);
    line-height: 1;
  }
  hr { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; font-weight: 600; color: var(--ink-soft); padding: 8px 12px; border-bottom: 2px solid var(--border); }
  td { padding: 8px 12px; border-bottom: 1px solid var(--border); color: var(--ink-soft); }
  .badge, [class*="badge"] {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    background: var(--accent-lt);
    color: var(--accent);
  }
  a { color: var(--accent); text-decoration: underline; }
  .hero, header.hero, div.hero, .report-hero, .result-hero {
    background: var(--ink);
    color: var(--white);
    padding: 40px 32px 36px;
    border-radius: var(--radius);
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
  }
  .hero::before, header.hero::before, div.hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 80% 50%, rgba(45,106,79,.35) 0%, transparent 65%);
    pointer-events: none;
  }
  .hero *, header.hero *, div.hero * { position: relative; }
  .hero h1, .hero h2, .hero h3,
  header.hero h1, header.hero h2,
  div.hero h1, div.hero h2 {
    color: var(--white);
    margin-top: 0;
  }
  .hero p, header.hero p, div.hero p {
    color: rgba(255,255,255,.65);
    margin-bottom: 0;
  }
</style>`;
  if (html.includes('</head>')) {
    return html.replace('</head>', styles + '\n</head>');
  }
  return styles + html;
}
