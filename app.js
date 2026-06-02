const WEBHOOK = 'https://mbaghdadi6g.app.n8n.cloud/webhook/accessibility-check';

const imageInput   = document.getElementById('imageInput');
const preview      = document.getElementById('preview');
const dropZone     = document.getElementById('dropZone');
const dropFilename = document.getElementById('dropFilename');

// ── Preview & drag-and-drop ───────────────────────────────
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

// ── Submit ────────────────────────────────────────────────
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

  if (!apiKey) {
    setStatus(statusEl, '⚠️ Please enter your access key.', 'error');
    return;
  }
  if (!imageInput.files.length) {
    setStatus(statusEl, '⚠️ Please select an image.', 'error');
    return;
  }

  var file = imageInput.files[0];
  if (file.size > 10 * 1024 * 1024) {
    setStatus(statusEl, '⚠️ File exceeds 10 MB limit.', 'error');
    return;
  }
  var allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.indexOf(file.type) === -1) {
    setStatus(statusEl, '⚠️ Invalid file type. Use JPEG, PNG or WEBP.', 'error');
    return;
  }

  setLoading(btn, spinner, btnLabel, true);
  setStatus(statusEl, 'Sending to AI — this may take 15–30 seconds…', '');
  resultWrap.classList.remove('visible');

  var fd = new FormData();
  fd.append('image', file);
  fd.append('location_type', locType);

  try {
    var res = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: fd
    });

    if (res.status === 401) {
      setStatus(statusEl, '⛔ Invalid access key.', 'error');
      return;
    }
    if (!res.ok) {
      setStatus(statusEl, '❌ Server error (' + res.status + '). Check n8n Executions for details.', 'error');
      return;
    }

    var html = await res.text();
    frame.srcdoc = html;
    resultWrap.classList.add('visible');
    setStatus(statusEl, '✓ Report ready — scroll down to view.', 'success');
    resultWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    setStatus(statusEl, '❌ Network error. Check your connection and try again.', 'error');
  } finally {
    setLoading(btn, spinner, btnLabel, false);
  }
}

// ── Helpers ───────────────────────────────────────────────
function setStatus(el, message, cls) {
  el.textContent = message;
  el.className = cls;
}

function setLoading(btn, spinner, label, isLoading) {
  btn.disabled = isLoading;
  spinner.style.display = isLoading ? 'block' : 'none';
  label.textContent = isLoading ? 'Analysing…' : 'Analyse Accessibility';
}
