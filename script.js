// ============================================
// DATA
// ============================================
let periodInfo = {};
let allSections = {};

async function loadData() {
    try {
        console.log('🔄 Loading data.json...');
        const res = await fetch('data.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        periodInfo = json.periodInfo;
        allSections = json.sections;
        console.log('✅ Data loaded:', Object.keys(allSections).length, 'sections');
    } catch (err) {
        console.error('❌ Failed to load data.json:', err);
        showToast('فشل تحميل البيانات - تأكد من وجود data.json', 'error');
        // Create dummy data so site doesn't crash
        allSections = {'1': {data: {}}};
    }
}

// ============================================
// STATE
// ============================================
let currentSection = "1";
let isGroupView = false;
let currentGroup = null;

// ============================================
// THEME
// ============================================
function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
    showToast(next === 'dark' ? 'Dark Mode 🌙' : 'Light Mode ☀️', 'info');
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

// ============================================
// RAMADAN DECORATIONS 🌙✨
// ============================================
function initBinaryBackground() {
    const bg = document.getElementById('binary-bg');
    if (!bg) return;
    
    bg.innerHTML = '';
    bg.className = 'binary-background';
    
    // Create stars container
    const starsDiv = document.createElement('div');
    starsDiv.className = 'stars';
    
    // Generate 50 random stars
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsDiv.appendChild(star);
    }
    bg.appendChild(starsDiv);
    
    // Create crescent moon
    const crescent = document.createElement('div');
    crescent.className = 'crescent';
    crescent.style.right = '10%';
    crescent.style.top = '15%';
    bg.appendChild(crescent);
    
    // Create lanterns
    const lanternPositions = [
        { left: '15%', top: '20%', delay: '0s' },
        { right: '20%', top: '35%', delay: '1s' },
        { left: '25%', top: '60%', delay: '2s' },
        { right: '15%', top: '70%', delay: '1.5s' }
    ];
    
    lanternPositions.forEach(pos => {
        const lantern = document.createElement('div');
        lantern.className = 'lantern';
        lantern.style.animationDelay = pos.delay;
        if (pos.left) lantern.style.left = pos.left;
        if (pos.right) lantern.style.right = pos.right;
        lantern.style.top = pos.top;
        
        lantern.innerHTML = `
            <div class="lantern-rope"></div>
            <div class="lantern-body">
                <div class="lantern-light"></div>
            </div>
        `;
        
        bg.appendChild(lantern);
    });
}

// ============================================
// TOAST
// ============================================
function showToast(msg, type = 'info') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    t.innerHTML = `<span>${icons[type]||''}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3200);
}

// ============================================
// SECTION LOADING
// ============================================
function changeSection(num) {
    console.log('📋 changeSection called with:', num);
    if (!num) { console.warn('⚠️ No section number provided'); return; }
    if (!allSections[num]) { 
        console.error('❌ Section not found:', num); 
        showToast('هذا القسم غير متوفر', 'error'); 
        return; 
    }

    console.log('✅ Changing to section:', num);
    currentSection = num;
    isGroupView = false;
    currentGroup = null;

    document.getElementById('noticeBox').classList.add('hidden');
    document.getElementById('controlsArea').classList.remove('hidden');
    document.getElementById('sectionView').classList.remove('hidden');
    document.getElementById('groupView').classList.add('hidden');
    document.getElementById('notesSection').classList.remove('hidden');

    document.getElementById('groupABtn').classList.remove('hidden');
    document.getElementById('groupBBtn').classList.remove('hidden');
    // Show print button (it's always visible for sections)
    const printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.classList.remove('hidden');
    // Hide group print button
    const printGroupBtn = document.getElementById('printGroupBtn');
    if (printGroupBtn) printGroupBtn.classList.add('hidden');
    document.getElementById('backBtn').classList.add('hidden');

    // Edit button — only for section 17
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveEditBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (num === '17') {
        editBtn?.classList.remove('hidden');
    } else {
        editBtn?.classList.add('hidden');
        saveBtn?.classList.add('hidden');
        cancelBtn?.classList.add('hidden');
        // cancel any active editing
        const area = document.getElementById('captureArea');
        if (area) area.contentEditable = 'false';
    }

    // sync selects
    ['sectionSelect','sectionSelectMain'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = num;
    });

    const sec = allSections[num];
    const displayName = num === '17' ? '✏️ Custom Schedule' : `Section ${num}`;
    renderSectionTable(sec.data, displayName);
    showToast(`${displayName} Loaded ✅`, 'success');
}

// ============================================
// RENDER SECTION TABLE
// ============================================
function renderSectionTable(data, displayName) {
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday"];
    const periods = ["1-2","3-4","5-6","7-8"];
    const body = document.getElementById('tableBody');
    body.innerHTML = '';
    document.getElementById('tableTitle').innerText = displayName;

    // Section 17: load saved HTML if exists
    if (currentSection === '17') {
        const saved = localStorage.getItem('custom17-html');
        if (saved) {
            document.getElementById('captureArea').innerHTML = saved;
            return;
        }
    }

    days.forEach((day, di) => {
        const row = document.createElement('tr');
        row.className = 'day-row';
        row.style.animationDelay = `${di * 0.06}s`;

        // Day label
        const dayTd = document.createElement('td');
        dayTd.className = 'day-lbl';
        dayTd.textContent = day;
        row.appendChild(dayTd);

        periods.forEach((p, pi) => {
            // Insert break after period index 1 (before 5-6)
            if (pi === 2) {
                const brk = document.createElement('td');
                brk.innerHTML = `<div class="brk-cell">
                    <div class="brk-line"></div>
                    <span class="brk-icon">☕</span>
                    <span class="brk-lbl">BREAK</span>
                    <div class="brk-line"></div>
                </div>`;
                row.appendChild(brk);
            }

            const cell = data[day]?.[p] ?? null;  // null for empty/section-17 slots
            const td = document.createElement('td');

            if (cell) {
                const roomHtml = (cell.r || '').replace(/AI/g, '<span class="ai-tag">AI</span>');
                const isLec = cell.t === 'L';
                td.innerHTML = `<div class="${isLec ? 'lec-card' : 'lab-card'}" onclick="showDetails('${day}','${p}','${currentSection}')">
                    <div class="card-subj">${cell.n}</div>
                    <div class="card-doc">${cell.d}</div>
                    <div class="card-room">${roomHtml}</div>
                </div>`;
            } else {
                td.innerHTML = `<div class="free-card">FREE</div>`;
            }
            row.appendChild(td);
        });
        body.appendChild(row);
    });
}

// ============================================
// GROUP VIEW
// ============================================
function showGroupSchedule(group) {
    isGroupView = true;
    currentGroup = group;

    document.getElementById('noticeBox').classList.add('hidden');
    document.getElementById('controlsArea').classList.remove('hidden');
    document.getElementById('sectionView').classList.add('hidden');
    document.getElementById('groupView').classList.remove('hidden');
    document.getElementById('notesSection').classList.remove('hidden');

    document.getElementById('groupABtn').classList.add('hidden');
    document.getElementById('groupBBtn').classList.add('hidden');
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.classList.add('hidden');
    const printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.classList.add('hidden');
    const printGroupBtn = document.getElementById('printGroupBtn');
    if (printGroupBtn) printGroupBtn.classList.remove('hidden');
    document.getElementById('backBtn').classList.remove('hidden');
    
    // Hide edit buttons (they're only for Section 17)
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveEditBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (editBtn) editBtn.classList.add('hidden');
    if (saveBtn) saveBtn.classList.add('hidden');
    if (cancelBtn) cancelBtn.classList.add('hidden');

    ['sectionSelect','sectionSelectMain'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    renderGroupTable(group);
    showToast(`Group ${group} Loaded ✅`, 'success');
}

function renderGroupTable(group) {
    const sections = group === 'A'
        ? ['1','2','3','4','5','6','7','8']
        : ['9','10','11','12','13','14','15','16'];
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday"];
    const periods = ["1-2","3-4","5-6","7-8"];

    document.getElementById('groupTitle').innerText = `Group ${group} Schedule`;
    const tbody = document.getElementById('groupTableBody');
    tbody.innerHTML = '';

    sections.forEach((secNum, idx) => {
        const sec = allSections[secNum];
        if (!sec) return;

        const tr = document.createElement('tr');
        tr.style.animationDelay = `${idx * 0.05}s`;

        const th = document.createElement('th');
        th.className = `grp-sec-th${sec.group === 'B' ? ' gb' : ''}`;
        th.innerText = `SEC ${secNum.padStart(2,'0')}`;
        tr.appendChild(th);

        days.forEach(day => {
            const td = document.createElement('td');
            td.className = 'period-cell';
            periods.forEach(period => {
                const cell = sec.data[day]?.[period] || null;
                const info = periodInfo[period];
                if (cell) {
                    const mini = document.createElement('div');
                    mini.className = `mini-card${cell.t === 'S' ? ' lab' : ''}`;
                    mini.onclick = () => showDetails(day, period, secNum);
                    mini.innerHTML = `<div class="mini-t">${period} | ${info.time}</div>
                        <div class="mini-s">${cell.n}</div>
                        <div class="mini-d">${cell.d}</div>
                        <div class="mini-r">${(cell.r||'').replace(/AI/g,'<span style="color:#00ffff">AI</span>')}</div>`;
                    td.appendChild(mini);
                } else {
                    const fr = document.createElement('div');
                    fr.className = 'mini-free';
                    fr.innerHTML = `${period} | ${info.time}<br>FREE`;
                    td.appendChild(fr);
                }
            });
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function backToSection() { changeSection(currentSection); }

// ============================================
// EDIT MODE — Section 17 only
// ============================================
let _editBackup = '';

function enableEditing() {
    const area = document.getElementById('captureArea');
    if (!area) return;
    _editBackup = area.innerHTML;
    area.contentEditable = 'true';
    area.focus();
    document.getElementById('editBtn')?.classList.add('hidden');
    document.getElementById('saveEditBtn')?.classList.remove('hidden');
    document.getElementById('cancelEditBtn')?.classList.remove('hidden');
    showToast('Edit Mode — اضغط على أي نص وعدّله', 'info');
}

function saveEditing() {
    const area = document.getElementById('captureArea');
    if (!area) return;
    area.contentEditable = 'false';
    localStorage.setItem('custom17-html', area.innerHTML);
    document.getElementById('editBtn')?.classList.remove('hidden');
    document.getElementById('saveEditBtn')?.classList.add('hidden');
    document.getElementById('cancelEditBtn')?.classList.add('hidden');
    showToast('تم الحفظ! ✅', 'success');
}

function cancelEditing() {
    const area = document.getElementById('captureArea');
    if (!area) return;
    area.innerHTML = _editBackup;
    area.contentEditable = 'false';
    document.getElementById('editBtn')?.classList.remove('hidden');
    document.getElementById('saveEditBtn')?.classList.add('hidden');
    document.getElementById('cancelEditBtn')?.classList.add('hidden');
    showToast('تم الإلغاء', 'info');
}

function showDetails(day, period, secNum) {
    const cell = allSections[secNum]?.data?.[day]?.[period];
    if (cell) showToast(`${cell.n} | ${cell.d} | ${cell.r}`, 'info');
}

// ============================================
// NEW DOWNLOAD METHODS — COMPLETE REWRITE
// ============================================

// SIMPLE PRINT METHOD (Most Reliable)
function printTable() {
    console.log('🖨️ Print triggered');
    const original = document.getElementById('sectionView');
    if (!original) {
        showToast('Table not found', 'error');
        return;
    }
    
    // Get current theme - default to dark if not set
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const bgColor = theme === 'light' ? '#fff8e7' : '#0a051f';
    
    console.log('📋 Current theme:', theme);
    console.log('🎨 Background color:', bgColor);
    
    const printContent = original.innerHTML;
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    printWindow.document.write(`
<!DOCTYPE html>
<html data-theme="${theme}">
<head>
    <meta charset="UTF-8">
    <title>CS Schedule - Section ${currentSection}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        ${theme === 'dark' ? `
        :root, [data-theme="dark"] {
            --bg: #0a051f;
            --bg2: #1a0a3e;
            --card: rgba(26,10,62,0.85);
            --txt: #f5e6d3;
            --txt2: #d4c5b0;
            --accent: #ffd700;
            --purple: #9370db;
            --green: #32cd32;
            --orange: #ff8c00;
            --gold: #ffd700;
            --border: rgba(255,215,0,0.15);
        }` : `
        :root, [data-theme="light"] {
            --bg: #fff8e7;
            --bg2: #fff3d9;
            --card: rgba(255,255,255,0.95);
            --txt: #4a2c0f;
            --txt2: #6b4423;
            --accent: #d4af37;
            --purple: #9370db;
            --green: #2d8659;
            --orange: #e67e22;
            --gold: #d4af37;
            --border: rgba(212,175,55,0.25);
        }`}
    </style>
    <link href="style.css" rel="stylesheet">
    <style>
        body {
            background: ${bgColor};
            padding: 20px;
            font-family: 'Inter', sans-serif;
        }
        .table-card {
            max-width: none !important;
            width: 100% !important;
        }
        .tbl-scroll {
            overflow: visible !important;
        }
        .sched-table {
            width: 100% !important;
            min-width: 0 !important;
        }
        @media print {
            body { background: ${theme === 'light' ? 'white' : '#0a051f'}; }
            * { overflow: visible !important; }
        }
    </style>
</head>
<body>
    <div class="table-card">
        ${printContent}
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>
    `);
    printWindow.document.close();
}

// Print for Group view
function printGroupTable() {
    console.log('🖨️ Print Group triggered');
    const original = document.getElementById('groupView');
    if (!original) {
        showToast('Table not found', 'error');
        return;
    }
    
    // Get current theme - default to dark if not set
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const bgColor = theme === 'light' ? '#fff8e7' : '#0a051f';
    
    console.log('📋 Current theme:', theme);
    console.log('🎨 Background color:', bgColor);
    
    const printContent = original.innerHTML;
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    printWindow.document.write(`
<!DOCTYPE html>
<html data-theme="${theme}">
<head>
    <meta charset="UTF-8">
    <title>Group ${currentGroup} Schedule</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        ${theme === 'dark' ? `
        :root, [data-theme="dark"] {
            --bg: #0a051f;
            --bg2: #1a0a3e;
            --card: rgba(26,10,62,0.85);
            --txt: #f5e6d3;
            --txt2: #d4c5b0;
            --accent: #ffd700;
            --purple: #9370db;
            --green: #32cd32;
            --orange: #ff8c00;
            --gold: #ffd700;
            --border: rgba(255,215,0,0.15);
        }` : `
        :root, [data-theme="light"] {
            --bg: #fff8e7;
            --bg2: #fff3d9;
            --card: rgba(255,255,255,0.95);
            --txt: #4a2c0f;
            --txt2: #6b4423;
            --accent: #d4af37;
            --purple: #9370db;
            --green: #2d8659;
            --orange: #e67e22;
            --gold: #d4af37;
            --border: rgba(212,175,55,0.25);
        }`}
    </style>
    <link href="style.css" rel="stylesheet">
    <style>
        body {
            background: ${bgColor};
            padding: 20px;
            font-family: 'Inter', sans-serif;
        }
        * { overflow: visible !important; }
        @media print {
            body { background: ${theme === 'light' ? 'white' : '#0a051f'}; }
        }
    </style>
</head>
<body>
    ${printContent}
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>
    `);
    printWindow.document.close();
}

// MAIN DOWNLOAD FUNCTION — Uses Fixed Width Clone Method
async function downloadTable() {
    const btn = document.getElementById('downloadBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }
    showToast('جاري تحضير الصورة...', 'info');

    try {
        const original = document.getElementById('sectionView');
        const theme = document.documentElement.getAttribute('data-theme');
        const bgColor = theme === 'light' ? '#fff8e7' : '#0a051f';
        
        // Create FIXED WIDTH clone (no responsive, no overflow)
        const clone = original.cloneNode(true);
        clone.id = 'downloadClone';
        clone.style.cssText = `
            position: fixed;
            left: -99999px;
            top: 0;
            width: 1200px !important;
            max-width: none !important;
            min-width: 0 !important;
            background: ${bgColor};
            padding: 20px;
            overflow: visible !important;
            transform: none !important;
        `;
        document.body.appendChild(clone);
        
        // Force EVERY element to be fully visible
        clone.querySelectorAll('*').forEach(el => {
            const computed = window.getComputedStyle(el);
            el.style.overflow = 'visible';
            el.style.maxWidth = 'none';
            el.style.minWidth = '0';
        });
        
        // Fix table scroll wrapper
        const scrollWrap = clone.querySelector('.tbl-scroll');
        if (scrollWrap) {
            scrollWrap.style.overflow = 'visible';
            scrollWrap.style.width = '100%';
            scrollWrap.style.maxWidth = 'none';
            scrollWrap.style.margin = '0';
            scrollWrap.style.padding = '0';
        }
        
        // Fix the table itself
        const table = clone.querySelector('.sched-table');
        if (table) {
            table.style.width = '100%';
            table.style.minWidth = '0';
            table.style.maxWidth = 'none';
            table.style.tableLayout = 'fixed';
            table.style.borderCollapse = 'separate';
        }
        
        // Wait for layout to stabilize
        await new Promise(r => setTimeout(r, 500));
        
        const finalWidth = 1200;
        const finalHeight = clone.scrollHeight + 40;
        
        const canvas = await html2canvas(clone, {
            backgroundColor: bgColor,
            scale: 1,  // No scaling - original size only
            useCORS: true,
            allowTaint: false,
            logging: false,
            width: finalWidth,
            height: finalHeight,
            windowWidth: finalWidth,
            windowHeight: finalHeight,
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
        });
        
        document.body.removeChild(clone);
        
        const link = document.createElement('a');
        link.download = `CS_Section${currentSection}_${new Date().toISOString().slice(0,10)}.jpg`;  // Changed to .jpg
        link.href = canvas.toDataURL('image/jpeg', 0.7);  // JPEG at 70% quality
        link.click();
        
        showToast('تم حفظ الصورة! ✅', 'success');
        
    } catch (err) {
        console.error('Download error:', err);
        showToast(`خطأ: ${err.message}`, 'error');
    } finally {
        if (btn) { 
            btn.disabled = false; 
            btn.innerHTML = '<i class="fas fa-download"></i><span>Download</span>'; 
        }
    }
}

// GROUP PDF — Rewritten
function downloadGroupPDF() {
    const { jsPDF } = window.jspdf;
    const btn = document.getElementById('pdfBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }
    showToast('جاري تحضير PDF...', 'info');

    const original = document.getElementById('groupView');
    const theme = document.documentElement.getAttribute('data-theme');
    const bgColor = theme === 'light' ? '#fff8e7' : '#0a051f';

    // Create fixed width clone
    const clone = original.cloneNode(true);
    clone.style.cssText = `
        position: fixed;
        left: -99999px;
        top: 0;
        width: 1200px !important;
        background: ${bgColor};
        padding: 20px;
        overflow: visible !important;
    `;
    document.body.appendChild(clone);
    
    // Force visibility
    clone.querySelectorAll('*').forEach(el => {
        el.style.overflow = 'visible';
        el.style.maxWidth = 'none';
    });
    
    const scrollWrap = clone.querySelector('.tbl-scroll');
    if (scrollWrap) {
        scrollWrap.style.overflow = 'visible';
        scrollWrap.style.width = '100%';
    }
    
    const table = clone.querySelector('.sched-table');
    if (table) {
        table.style.width = '100%';
        table.style.tableLayout = 'fixed';
    }

    setTimeout(() => {
        html2canvas(clone, {
            backgroundColor: bgColor,
            scale: 1,  // No scaling
            useCORS: true,
            allowTaint: false,
            logging: false,
            width: 1200,
            height: clone.scrollHeight + 40,
        }).then(canvas => {
            document.body.removeChild(clone);
            // Use JPEG with lower quality for much smaller size
            const imgData = canvas.toDataURL('image/jpeg', 0.7);
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pgW = 297;
            const pgH = (canvas.height * pgW) / canvas.width;

            if (pgH <= 210) {
                pdf.addImage(imgData, 'JPEG', 0, 0, pgW, pgH);
            } else {
                let yPos = 0;
                let remaining = pgH;
                let page = 0;
                while (remaining > 0) {
                    if (page > 0) pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, -page * 210, pgW, pgH);
                    remaining -= 210;
                    page++;
                }
            }

            pdf.save(`Group_${currentGroup}_${new Date().toISOString().slice(0,10)}.pdf`);
            showToast('تم حفظ PDF! 📄', 'success');
        }).catch(err => {
            console.error(err);
            showToast('فشل الحفظ', 'error');
        }).finally(() => {
            if (btn) { 
                btn.disabled = false; 
                btn.innerHTML = '<i class="fas fa-file-pdf"></i><span>Save PDF</span>'; 
            }
        });
    }, 800);
}


// ============================================
// MODALS
// ============================================
function closeModal(id) {
    document.getElementById(id)?.classList.add('hidden');
}

function showAcademicCalendar() {
    document.getElementById('calendarModal')?.classList.remove('hidden');
}

window.onclick = function(e) {
    if (e.target.classList.contains('modal')) e.target.classList.add('hidden');
};

// ============================================
// FREE NOTES
// ============================================
let notesTimer = null;

function autoSaveNotes() {
    const ta = document.getElementById('freeNotesArea');
    const saved = document.getElementById('notesSaved');
    const count = document.getElementById('notesCount');

    if (count) count.textContent = `${ta.value.length} characters`;

    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => {
        localStorage.setItem('free-notes', ta.value);
        if (saved) {
            saved.classList.add('visible');
            setTimeout(() => saved.classList.remove('visible'), 2000);
        }
    }, 600);
}

function updateNotesCount() {
    const ta = document.getElementById('freeNotesArea');
    const count = document.getElementById('notesCount');
    if (ta && count) count.textContent = `${ta.value.length} characters`;
}

function clearAllNotes() {
    const ta = document.getElementById('freeNotesArea');
    if (!ta) return;
    if (confirm('هتمسح كل الملاحظات؟ / Clear all notes?')) {
        ta.value = '';
        localStorage.removeItem('free-notes');
        updateNotesCount();
        showToast('تم مسح الملاحظات', 'info');
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    const tag = document.activeElement.tagName;
    if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;
    if (document.activeElement.isContentEditable) return;

    const k = e.key;

    // Sections 1–9
    if (!e.shiftKey && k >= '1' && k <= '9') { changeSection(k); return; }
    // Sections 10–16 (Shift+1–7)
    if (e.shiftKey && k >= '1' && k <= '7') { changeSection(String(parseInt(k)+9)); return; }

    switch (k.toLowerCase()) {
        case 'a':
            if (!document.getElementById('groupABtn')?.classList.contains('hidden')) showGroupSchedule('A');
            break;
        case 'b':
            if (!document.getElementById('groupBBtn')?.classList.contains('hidden')) showGroupSchedule('B');
            break;
        case 'c':
            showAcademicCalendar();
            break;
        case 't':
            toggleTheme();
            break;
        case 'escape':
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            break;
    }
});

// ============================================
// ONLINE / OFFLINE
// ============================================
window.addEventListener('online',  () => showToast('متصل بالإنترنت ✅', 'success'));
window.addEventListener('offline', () => showToast('غير متصل — التطبيق لا يزال يعمل 📴', 'info'));
