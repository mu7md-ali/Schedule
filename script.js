// ============================================
// DATA
// ============================================
let periodInfo = {};
let allSections = {};

async function loadData() {
    try {
        const res = await fetch('data.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        periodInfo = json.periodInfo;
        allSections = json.sections;
    } catch (err) {
        console.error('Failed to load data.json:', err);
        showToast('Failed to load data - check data.json', 'error');
        allSections = {'1': {data: {}}};
    }
}

let currentSection = "1";
let isGroupView = false;
let currentGroup = null;
let currentEditCell = null;

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
// RAMADAN DECORATIONS
// ============================================
function initBinaryBackground() {
    const bg = document.getElementById('binary-bg');
    if (!bg) return;
    bg.innerHTML = '';
    bg.className = 'binary-background';
    const pattern = document.createElement('div');
    pattern.className = 'ramadan-pattern';
    bg.appendChild(pattern);
    const starsDiv = document.createElement('div');
    starsDiv.className = 'stars';
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsDiv.appendChild(star);
    }
    bg.appendChild(starsDiv);
    const crescent = document.createElement('div');
    crescent.className = 'crescent';
    crescent.style.right = '10%';
    crescent.style.top = '15%';
    bg.appendChild(crescent);
    [{ left:'15%',top:'20%',delay:'0s'},{right:'20%',top:'35%',delay:'1s'},{left:'25%',top:'60%',delay:'2s'},{right:'15%',top:'70%',delay:'1.5s'}].forEach(pos => {
        const lantern = document.createElement('div');
        lantern.className = 'lantern';
        lantern.style.animationDelay = pos.delay;
        if (pos.left) lantern.style.left = pos.left;
        if (pos.right) lantern.style.right = pos.right;
        lantern.style.top = pos.top;
        lantern.innerHTML = `<div class="lantern-rope"></div><div class="lantern-body"><div class="lantern-light"></div></div>`;
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
    const icons = { success:'✅', error:'❌', info:'ℹ️' };
    t.innerHTML = `<span>${icons[type]||''}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3200);
}

// ============================================
// SECTION LOADING
// ============================================
function changeSection(num) {
    if (!num) return;
    if (!allSections[num]) { showToast('Section not available', 'error'); return; }
    currentSection = num;
    isGroupView = false;
    currentGroup = null;
    document.getElementById('noticeBox').classList.add('hidden');
    document.getElementById('controlsArea').classList.remove('hidden');
    document.getElementById('sectionView').classList.remove('hidden');
    document.getElementById('groupView').classList.add('hidden');
    document.getElementById('notesSection').classList.remove('hidden');
    document.getElementById('tasksSection').classList.remove('hidden');
    document.getElementById('groupABtn').classList.remove('hidden');
    document.getElementById('groupBBtn').classList.remove('hidden');
    document.getElementById('printBtn')?.classList.remove('hidden');
    document.getElementById('printGroupBtn')?.classList.add('hidden');
    document.getElementById('backBtn').classList.add('hidden');
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveEditBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (num === '17') { editBtn?.classList.remove('hidden'); }
    else { editBtn?.classList.add('hidden'); saveBtn?.classList.add('hidden'); cancelBtn?.classList.add('hidden'); }
    const englishBtn  = document.getElementById('englishBtn');
    const studentsBtn = document.getElementById('sectionStudentsBtn');
    if (num === '17') {
        englishBtn?.classList.add('hidden');
        studentsBtn?.classList.add('hidden');
    } else {
        englishBtn?.classList.remove('hidden');
        studentsBtn?.classList.remove('hidden');
        if (studentsBtn) studentsBtn.innerHTML = `<i class="fas fa-user-graduate"></i><span>Section ${num} Students</span>`;
    }
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
    const days    = ["Sunday","Monday","Tuesday","Wednesday","Thursday"];
    const periods = ["1-2","3-4","5-6","7-8"];
    const body    = document.getElementById('tableBody');
    body.innerHTML = '';
    document.getElementById('tableTitle').innerText = displayName;
    if (currentSection === '17') {
        const saved = localStorage.getItem('custom17-data');
        if (saved) data = JSON.parse(saved);
    }
    days.forEach((day, di) => {
        const row = document.createElement('tr');
        row.className = 'day-row';
        row.style.animationDelay = `${di * 0.06}s`;
        const dayTd = document.createElement('td');
        dayTd.className = 'day-lbl';
        dayTd.textContent = day;
        row.appendChild(dayTd);
        periods.forEach((p, pi) => {
            if (pi === 2) {
                const brk = document.createElement('td');
                brk.innerHTML = `<div class="brk-cell"><div class="brk-line"></div><span class="brk-icon">☕</span><span class="brk-lbl">BREAK</span><div class="brk-line"></div></div>`;
                row.appendChild(brk);
            }
            const cell = data[day]?.[p] ?? null;
            const td   = document.createElement('td');
            if (currentSection === '17') {
                td.innerHTML = renderCustomCell(cell, day, p);
            } else {
                if (cell) {
                    const roomHtml = (cell.r || '').replace(/AI/g, '<span class="ai-tag">AI</span>');
                    const isLec    = cell.t === 'L';
                    const key      = cleanSubjectName(cell.n);
                    const cardDiv  = document.createElement('div');
                    cardDiv.className = isLec ? 'lec-card' : 'lab-card';
                    cardDiv.dataset.subject = cell.n;
                    cardDiv.dataset.key     = key;
                    cardDiv.innerHTML = `<div class="card-subj">${cell.n}</div><div class="card-doc">${cell.d}</div><div class="card-room">${roomHtml}</div>`;
                    attachCardEvents(cardDiv, cell.n, key);
                    td.appendChild(cardDiv);
                } else {
                    td.innerHTML = `<div class="free-card">FREE</div>`;
                }
            }
            row.appendChild(td);
        });
        body.appendChild(row);
    });
}

// ============================================
// CARD EVENTS — hold (500ms) = Drive, double-tap = Videos
// ============================================
function attachCardEvents(card, subjectName, key) {
    if (!card) return;

    // ── Desktop: mousedown hold ──
    let holdTimer = null;
    let holdFired = false;

    card.addEventListener('mousedown', () => {
        holdFired = false;
        holdTimer = setTimeout(() => {
            holdFired = true;
            flashCard(card);
            openSubjectFiles(subjectName);
        }, 500);
    });
    card.addEventListener('mouseup',    () => clearTimeout(holdTimer));
    card.addEventListener('mouseleave', () => clearTimeout(holdTimer));
    // Desktop double-click = videos
    card.addEventListener('dblclick', (e) => {
        clearTimeout(holdTimer);
        if (holdFired) { holdFired = false; return; }
        openVideoLinks(subjectName);
    });

    // ── Mobile: touchstart hold ──
    let touchTimer = null;
    let touchHoldFired = false;
    let lastTap = 0;

    card.addEventListener('touchstart', () => {
        touchHoldFired = false;
        touchTimer = setTimeout(() => {
            touchHoldFired = true;
            if (navigator.vibrate) navigator.vibrate(60);
            flashCard(card);
            openSubjectFiles(subjectName);
        }, 500);
    }, { passive: true });

    card.addEventListener('touchmove',  () => clearTimeout(touchTimer));
    card.addEventListener('touchend', (e) => {
        clearTimeout(touchTimer);
        if (touchHoldFired) { touchHoldFired = false; return; }
        const now = Date.now();
        if (now - lastTap < 350) {
            e.preventDefault();
            if (navigator.vibrate) navigator.vibrate([30,30]);
            openVideoLinks(subjectName);
        }
        lastTap = now;
    });
}

function flashCard(card) {
    card.style.transition = 'transform .15s, opacity .15s';
    card.style.transform  = 'scale(0.93)';
    card.style.opacity    = '0.7';
    setTimeout(() => { card.style.transform = ''; card.style.opacity = ''; }, 300);
}

// ============================================
// CUSTOM SCHEDULE
// ============================================
function renderCustomCell(cell, day, period) {
    if (cell && cell.n) {
        const roomHtml = (cell.r || '').replace(/AI/g, '<span class="ai-tag">AI</span>');
        const isLec    = cell.t === 'L' || cell.d?.includes('Dr.');
        return `<div class="${isLec ? 'lec-card' : 'lab-card'}" onclick="openCustomEdit('${day}','${period}')"><div class="card-subj">${cell.n}</div><div class="card-doc">${cell.d}</div><div class="card-room">${roomHtml}</div></div>`;
    }
    return `<div class="free-card" onclick="openCustomEdit('${day}','${period}')" style="cursor:pointer;">+ ADD</div>`;
}
function openCustomEdit(day, period) {
    if (currentSection !== '17') return;
    currentEditCell = { day, period };
    const saved = localStorage.getItem('custom17-data');
    let data = saved ? JSON.parse(saved) : {};
    const cell = data[day]?.[period] || {};
    document.getElementById('customSubject').value    = cell.n || '';
    document.getElementById('customInstructor').value = cell.d || '';
    document.getElementById('customRoom').value       = cell.r || '';
    document.getElementById('customType').value       = cell.t || 'L';
    document.getElementById('customEditModal').classList.add('active');
}
function closeCustomEdit() {
    document.getElementById('customEditModal').classList.remove('active');
    currentEditCell = null;
}
function saveCustomCell() {
    if (!currentEditCell) return;
    const { day, period } = currentEditCell;
    const subject    = document.getElementById('customSubject').value.trim();
    const instructor = document.getElementById('customInstructor').value.trim();
    const room       = document.getElementById('customRoom').value.trim();
    const type       = document.getElementById('customType').value;
    const saved      = localStorage.getItem('custom17-data');
    let data         = saved ? JSON.parse(saved) : {};
    if (!data[day]) data[day] = {};
    if (subject) {
        data[day][period] = { n: subject, d: instructor || (type==='L'?'Dr. TBD':'T.A TBD'), r: room||'TBD', t: type };
    } else {
        delete data[day][period];
    }
    localStorage.setItem('custom17-data', JSON.stringify(data));
    renderSectionTable(data, '✏️ Custom Schedule');
    closeCustomEdit();
    showToast('Saved! ✅', 'success');
}
function deleteCustomCell() {
    if (!currentEditCell) return;
    const { day, period } = currentEditCell;
    const saved = localStorage.getItem('custom17-data');
    let data    = saved ? JSON.parse(saved) : {};
    if (data[day]) delete data[day][period];
    localStorage.setItem('custom17-data', JSON.stringify(data));
    renderSectionTable(data, '✏️ Custom Schedule');
    closeCustomEdit();
    showToast('Deleted! 🗑️', 'info');
}

// ============================================
// GROUP VIEW
// ============================================
function showGroupSchedule(group) {
    isGroupView = true; currentGroup = group;
    document.getElementById('noticeBox').classList.add('hidden');
    document.getElementById('controlsArea').classList.remove('hidden');
    document.getElementById('sectionView').classList.add('hidden');
    document.getElementById('groupView').classList.remove('hidden');
    document.getElementById('notesSection').classList.remove('hidden');
    document.getElementById('tasksSection').classList.add('hidden');
    document.getElementById('groupABtn').classList.add('hidden');
    document.getElementById('groupBBtn').classList.add('hidden');
    document.getElementById('printBtn')?.classList.add('hidden');
    document.getElementById('printGroupBtn')?.classList.remove('hidden');
    document.getElementById('backBtn').classList.remove('hidden');
    document.getElementById('editBtn')?.classList.add('hidden');
    document.getElementById('saveEditBtn')?.classList.add('hidden');
    document.getElementById('cancelEditBtn')?.classList.add('hidden');
    ['sectionSelect','sectionSelectMain'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    renderGroupTable(group);
    showToast(`Group ${group} Loaded ✅`, 'success');
}
function renderGroupTable(group) {
    const sections = group === 'A' ? ['1','2','3','4','5','6','7','8'] : ['9','10','11','12','13','14','15','16'];
    const days    = ["Sunday","Monday","Tuesday","Wednesday","Thursday"];
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
        th.className = `grp-sec-th${sec.group==='B'?' gb':''}`;
        th.innerHTML = `<div style="cursor:pointer" onclick="showSectionFromGroup('${secNum}')">SEC ${secNum.padStart(2,'0')}</div>`;
        tr.appendChild(th);
        days.forEach(day => {
            const td = document.createElement('td');
            td.className = 'period-cell';
            periods.forEach(period => {
                const cell = sec.data[day]?.[period] || null;
                const info = periodInfo[period];
                if (cell) {
                    const mini = document.createElement('div');
                    mini.className = `mini-card${cell.t==='L'?' lec':' lab'}`;
                    mini.onclick = () => showDetails(day, period, secNum);
                    mini.innerHTML = `<div class="mini-t">${period} | ${info?.time||''}</div><div class="mini-s">${cell.n}</div><div class="mini-d">${cell.d}</div><div class="mini-r">${(cell.r||'').replace(/AI/g,'<span class="ai-tag">AI</span>')}</div>`;
                    td.appendChild(mini);
                } else {
                    const fr = document.createElement('div');
                    fr.className = 'mini-free';
                    fr.innerHTML = `${period} | ${info?.time||''}<br>FREE`;
                    td.appendChild(fr);
                }
            });
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}
function showSectionFromGroup(secNum) { changeSection(secNum); }
function backToSection() { changeSection(currentSection); }

// ============================================
// EDIT MODE
// ============================================
function enableEditing() {
    showToast('Edit Mode', 'info');
    document.getElementById('editBtn')?.classList.add('hidden');
    document.getElementById('saveEditBtn')?.classList.remove('hidden');
    document.getElementById('cancelEditBtn')?.classList.remove('hidden');
}
function saveEditing() {
    document.getElementById('editBtn')?.classList.remove('hidden');
    document.getElementById('saveEditBtn')?.classList.add('hidden');
    document.getElementById('cancelEditBtn')?.classList.add('hidden');
    showToast('Saved! ✅', 'success');
}
function cancelEditing() {
    const saved = localStorage.getItem('custom17-data');
    renderSectionTable(saved ? JSON.parse(saved) : {}, '✏️ Custom Schedule');
    document.getElementById('editBtn')?.classList.remove('hidden');
    document.getElementById('saveEditBtn')?.classList.add('hidden');
    document.getElementById('cancelEditBtn')?.classList.add('hidden');
    showToast('Cancelled', 'info');
}
function showDetails(day, period, secNum) {
    const cell = allSections[secNum]?.data?.[day]?.[period];
    if (cell) showToast(`${cell.n} | ${cell.d} | ${cell.r}`, 'info');
}

// ============================================
// PRINT
// ============================================
function printTable() {
    const original = document.getElementById('sectionView');
    if (!original) { showToast('Table not found', 'error'); return; }
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const bgColor = theme === 'light' ? '#fef9e7' : '#0a051f';
    const w = window.open('', '_blank', 'width=1200,height=800');
    w.document.write(`<!DOCTYPE html><html data-theme="${theme}"><head><meta charset="UTF-8"><title>Section ${currentSection}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet"><link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"><link href="style.css" rel="stylesheet"><style>*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}body{background:${bgColor};padding:20px;}.tbl-scroll{overflow:visible!important;}.sched-table{width:100%!important;min-width:0!important;}</style></head><body><div class="table-card">${original.innerHTML}</div><script>window.onload=function(){setTimeout(function(){window.print();},500);};<\/script></body></html>`);
    w.document.close();
}
function printGroupTable() {
    const original = document.getElementById('groupView');
    if (!original) { showToast('Table not found', 'error'); return; }
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const bgColor = theme === 'light' ? '#fef9e7' : '#0a051f';
    const w = window.open('', '_blank', 'width=1200,height=800');
    w.document.write(`<!DOCTYPE html><html data-theme="${theme}"><head><meta charset="UTF-8"><title>Group ${currentGroup}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet"><link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"><link href="style.css" rel="stylesheet"><style>*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;overflow:visible!important;}body{background:${bgColor};padding:20px;}</style></head><body>${original.innerHTML}<script>window.onload=function(){setTimeout(function(){window.print();},500);};<\/script></body></html>`);
    w.document.close();
}

// ============================================
// MODALS
// ============================================
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }
function showAcademicCalendar() { document.getElementById('calendarModal')?.classList.remove('hidden'); }
window.onclick = function(e) {
    if (e.target.classList.contains('modal')) e.target.classList.add('hidden');
    if (e.target.id === 'englishScheduleModal') closeEnglishSchedule();
    if (e.target.id === 'studentsNamesModal')   closeStudentsNames();
    if (e.target.id === 'customEditModal')      closeCustomEdit();
    if (e.target.id === 'videoLinksModal')      closeVideoLinks();
};
document.addEventListener('keydown', (e) => {
    const tag = document.activeElement.tagName;
    if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;
    const k = e.key;
    if (!e.shiftKey && k >= '1' && k <= '9') { changeSection(k); return; }
    if (e.shiftKey && k >= '1' && k <= '7')  { changeSection(String(parseInt(k)+9)); return; }
    switch (k.toLowerCase()) {
        case 'a': if (!document.getElementById('groupABtn')?.classList.contains('hidden')) showGroupSchedule('A'); break;
        case 'b': if (!document.getElementById('groupBBtn')?.classList.contains('hidden')) showGroupSchedule('B'); break;
        case 'c': showAcademicCalendar(); break;
        case 't': toggleTheme(); break;
        case 'escape':
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            closeEnglishSchedule(); closeStudentsNames(); closeCustomEdit(); closeVideoLinks();
            if (!document.getElementById('studyPlanModal')?.classList.contains('hidden')) closeStudyPlan();
            break;
    }
});
window.addEventListener('online',  () => showToast('Back online ✅', 'success'));
window.addEventListener('offline', () => showToast('Offline 📴', 'info'));

// ============================================
// ENGLISH SCHEDULE
// ============================================
let englishScheduleData = null;
async function loadEnglishScheduleData() {
    try { const r = await fetch('english-schedule-data.json'); englishScheduleData = await r.json(); }
    catch (e) { console.error(e); }
}
function openEnglishSchedule() {
    if (!englishScheduleData) { showToast('Loading...','info'); loadEnglishScheduleData().then(()=>{ if(englishScheduleData) displayEnglishSchedule(); }); }
    else displayEnglishSchedule();
}
function displayEnglishSchedule() {
    const modal = document.getElementById('englishScheduleModal');
    const body  = document.getElementById('englishScheduleBody');
    if (!modal||!body) return;
    body.innerHTML = '';
    englishScheduleData.sections.forEach(section => {
        const div = document.createElement('div');
        div.className = 'schedule-category';
        div.innerHTML = `<h3 class="category-title"><i class="fas fa-graduation-cap"></i> ${section.category}</h3><table class="schedule-table"><thead><tr><th>Level</th><th>Day</th><th>Period</th><th>Location</th><th>Instructor</th></tr></thead><tbody>${section.schedule.map(i=>`<tr><td><span class="level-badge">Level ${i.level}</span></td><td><span class="day-badge">${i.day}</span></td><td><span class="period-badge">${i.period}</span></td><td><span class="location-badge">${i.location}</span></td><td><span class="instructor-name">${i.instructor}</span></td></tr>`).join('')}</tbody></table>`;
        body.appendChild(div);
    });
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeEnglishSchedule() {
    const modal = document.getElementById('englishScheduleModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

// ============================================
// STUDENTS NAMES
// ============================================
let studentsData = null;
let currentStudentsSection = null;
const SPECIAL_STUDENT = "محمد على السيد على سالم شرف الدين";
async function loadStudentsData() {
    try { if (typeof sectionsData !== 'undefined') studentsData = sectionsData; }
    catch(e) { console.error(e); }
}
function openCurrentSectionStudents() {
    if (!currentSection||currentSection==='17') { showToast('Select a section first','error'); return; }
    openStudentsNamesWithSection(parseInt(currentSection));
}
function openStudentsNames() {
    if (!studentsData) { loadStudentsData(); setTimeout(()=>{ if(studentsData) displayStudentsModal(); },100); }
    else displayStudentsModal();
}
function openStudentsNamesWithSection(sectionNum) {
    if (!studentsData) { loadStudentsData(); setTimeout(()=>{ if(studentsData){ displayStudentsModal(); showStudentsBySection(sectionNum); } },100); }
    else { displayStudentsModal(); showStudentsBySection(sectionNum); }
}
function displayStudentsModal() {
    const modal = document.getElementById('studentsNamesModal');
    if (!modal) return;
    generateSectionButtons();
    if (!currentStudentsSection && studentsData && studentsData.length > 0) showStudentsBySection(1);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function generateSectionButtons() {
    const container = document.getElementById('sectionButtonsContainer');
    if (!container||!studentsData) return;
    container.innerHTML = '';
    studentsData.forEach(section => {
        const btn = document.createElement('button');
        btn.className = `section-btn ${section.section<=8?'group-a':'group-b'}`;
        btn.textContent = `Sec ${section.section}`;
        btn.onclick = () => showStudentsBySection(section.section);
        container.appendChild(btn);
    });
}
function showStudentsBySection(sectionNumber) {
    currentStudentsSection = sectionNumber;
    const sectionData = studentsData.find(s => s.section === sectionNumber);
    if (!sectionData) return;
    document.querySelectorAll('.section-btn').forEach(btn => { btn.classList.remove('active'); if(btn.textContent===`Sec ${sectionNumber}`) btn.classList.add('active'); });
    const titleEl = document.getElementById('currentSectionTitle');
    if (titleEl) titleEl.innerHTML = `<i class="fas fa-user-graduate"></i> Section ${sectionNumber} - Group ${sectionNumber<=8?'A':'B'}`;
    const countEl = document.getElementById('studentCount');
    if (countEl) countEl.textContent = `Total Students: ${sectionData.students.length}`;
    const tbody = document.getElementById('studentsTableBody');
    if (tbody) { tbody.innerHTML = ''; sectionData.students.forEach(student => { const tr=document.createElement('tr'); if(student.name===SPECIAL_STUDENT) tr.classList.add('special-student'); tr.innerHTML=`<td>${student.rank}</td><td>${student.name}</td>`; tbody.appendChild(tr); }); }
    const si = document.getElementById('studentsSearchInput');
    if (si) si.value = '';
}
function filterStudents() {
    const si = document.getElementById('studentsSearchInput');
    if (!si) return;
    const val = si.value.trim().toLowerCase();
    const rows = document.querySelectorAll('#studentsTableBody tr');
    let vis = 0;
    rows.forEach(row => { const name=row.querySelector('td:last-child').textContent.toLowerCase(); if(name.includes(val)){row.style.display='';vis++;}else row.style.display='none'; });
    const countEl = document.getElementById('studentCount');
    if (countEl) countEl.textContent = val ? `Showing ${vis} of ${rows.length} students` : `Total Students: ${rows.length}`;
}
function closeStudentsNames() {
    const modal = document.getElementById('studentsNamesModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow=''; currentStudentsSection=null; }
}

// ============================================
// SUBJECT DRIVE LINKS
// ============================================
const subjectDriveLinks = {
    "business administration": "https://drive.google.com/drive/folders/1_GE-P572jVZLhJZqnU7t7ahl5GxVTU8I",
    "data structure":          "https://drive.google.com/drive/folders/1RIdM672Mfhcr8KhVpzXgJr-DsWC0zL7A",
    "web programming":         "https://drive.google.com/drive/folders/10WOEaho7ElyojafkQRgm6fBodkFXlRi-",
    "computer network":        "https://drive.google.com/drive/folders/1EcZ47bZzeT0lER5etJe-2viYPueFYtb2",
    "system analysis":         "https://drive.google.com/drive/folders/11OcZ2n_v--nO3KehMMDu8onO15kxz-ZJ",
    "human rights":            "https://drive.google.com/drive/folders/1XlfEGfvmQigDkWkEgxO9ewxxBN9n3ElF"
};

function cleanSubjectName(name) {
    return name.replace(/\p{Emoji}/gu,'').replace(/[\u{FE00}-\u{FE0F}]/gu,'').replace(/\s+/g,' ').trim().toLowerCase();
}
function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function openSubjectFiles(subjectName) {
    const key = cleanSubjectName(subjectName);
    const link = subjectDriveLinks[key];
    if (link) { window.open(link,'_blank'); showToast(`Opening ${subjectName} Drive 🚀`,'success'); }
    else showToast(`No Drive link for: ${subjectName}`,'error');
}

// ============================================
// VIDEO LINKS — single sheet, cols: Subject | Title | URL
// ============================================
const VIDEO_LINKS_URL = `https://docs.google.com/spreadsheets/d/1FJ603NgbRaWcGPtHOENSPuS_6DW30uhtU_WhNjftuzc/gviz/tq?tqx=out:csv`;

let videoLinksCache = null; // cache fetched rows for session

async function fetchAllVideoLinks() {
    if (videoLinksCache) return videoLinksCache;
    const res = await fetch(VIDEO_LINKS_URL + '&t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text  = await res.text();
    const lines = text.trim().split('\n');
    const rows  = [];
    for (let i = 1; i < lines.length; i++) {   // i=1 skips header
        const cols    = splitCSVLine(lines[i].trim());
        const subject = stripQuotes(cols[0] || '');
        const title   = stripQuotes(cols[1] || '');
        const url     = stripQuotes(cols[2] || '');
        if (!subject || !url) continue;
        rows.push({ subject: normSubject(subject), title, url });
    }
    videoLinksCache = rows;
    return rows;
}

// Normalize: lowercase, remove emoji/symbols, collapse spaces
function normSubject(name) {
    return name
        .replace(/\p{Emoji}/gu, '')
        .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
        .replace(/[^a-z0-9 ]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

async function openVideoLinks(subjectName) {
    if (!document.getElementById('videoLinksModal')) {
        const el = document.createElement('div');
        el.id = 'videoLinksModal';
        el.className = 'video-links-modal';
        el.innerHTML = `
            <div class="vlm-overlay" onclick="closeVideoLinks()"></div>
            <div class="vlm-box">
                <div class="vlm-header">
                    <div class="vlm-title"><i class="fas fa-play-circle"></i> <span id="vlmSubjectName"></span></div>
                    <button class="vlm-close" onclick="closeVideoLinks()"><i class="fas fa-times"></i></button>
                </div>
                <div class="vlm-body" id="vlmBody"></div>
            </div>`;
        document.body.appendChild(el);
    }
    document.getElementById('vlmSubjectName').textContent = subjectName;
    document.getElementById('vlmBody').innerHTML = `<div class="vlm-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    document.getElementById('videoLinksModal').classList.add('active');
    document.body.style.overflow = 'hidden';

    try {
        const allRows = await fetchAllVideoLinks();
        const norm    = normSubject(subjectName);
        const rows    = allRows.filter(r => r.subject === norm);

        if (!rows.length) {
            document.getElementById('vlmBody').innerHTML = `
                <div class="vlm-empty"><i class="fas fa-video-slash"></i><p>No videos for this subject yet.</p></div>`;
            return;
        }

        // Card style similar to task cards
        document.getElementById('vlmBody').innerHTML = rows.map((row, i) => `
            <a href="${escapeHtml(row.url)}" target="_blank" rel="noopener" class="vlm-card">
                <div class="vlm-card-top">
                    <span class="vlm-badge"><i class="fas fa-play"></i> Video</span>
                    <span class="vlm-num">${i + 1}</span>
                </div>
                <div class="vlm-card-title">${escapeHtml(row.title || row.url)}</div>
                <div class="vlm-card-url"><i class="fas fa-external-link-alt"></i> ${escapeHtml(row.url)}</div>
            </a>`).join('');

    } catch(err) {
        videoLinksCache = null;
        document.getElementById('vlmBody').innerHTML = `
            <div class="vlm-empty">
                <i class="fas fa-wifi"></i><p>Could not load videos</p>
                <button onclick="videoLinksCache=null;openVideoLinks('${escapeHtml(subjectName)}')" class="vlm-retry">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>`;
    }
}

function closeVideoLinks() {
    const modal = document.getElementById('videoLinksModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

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
        if (saved) { saved.classList.add('visible'); setTimeout(()=>saved.classList.remove('visible'),2000); }
    }, 600);
}
function updateNotesCount() {
    const ta = document.getElementById('freeNotesArea');
    const count = document.getElementById('notesCount');
    if (ta&&count) count.textContent = `${ta.value.length} characters`;
}
function clearAllNotes() {
    const ta = document.getElementById('freeNotesArea');
    if (!ta) return;
    if (confirm('Clear all notes?')) { ta.value=''; localStorage.removeItem('free-notes'); updateNotesCount(); showToast('Notes cleared','info'); }
}

// ============================================
// TASKS FROM GOOGLE SHEETS
// ============================================
const TASKS_SHEET_ID  = '12W7uul0LS0dZmMf7E3DU2TJRrf2BN06o';
const TASKS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${TASKS_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=tasks`;
let allTasks = [];
let currentFilter = 'all';

const TYPE_COLORS = {
    quiz      : { border:'rgba(0,212,255,0.5)',   bg:'rgba(0,212,255,0.08)',   accent:'#00d4ff' },
    assignment: { border:'rgba(50,205,50,0.5)',   bg:'rgba(50,205,50,0.08)',   accent:'#32cd32' },
    project   : { border:'rgba(245,166,35,0.5)',  bg:'rgba(245,166,35,0.08)',  accent:'#f5a623' },
    submission: { border:'rgba(255,80,130,0.5)',  bg:'rgba(255,80,130,0.08)',  accent:'#ff5082' },
    default   : { border:'rgba(147,112,219,0.5)', bg:'rgba(147,112,219,0.08)', accent:'#9370db' },
};
function getTypeColor(type) { return TYPE_COLORS[(type||'').toLowerCase()] || TYPE_COLORS.default; }

function getCompletedTasks() { try { return JSON.parse(localStorage.getItem('completed-tasks')||'{}'); } catch { return {}; } }
function setTaskCompleted(key, done) { const d=getCompletedTasks(); if(done) d[key]=true; else delete d[key]; localStorage.setItem('completed-tasks',JSON.stringify(d)); }
function makeTaskKey(task) { return `${task.name}__${task.due}__${task.type}`.toLowerCase().replace(/\s+/g,'_'); }

async function loadTasksFromSheet() {
    const container = document.getElementById('tasksContainer');
    if (!container) return;
    container.innerHTML = `<div class="tasks-loading"><i class="fas fa-spinner fa-spin"></i><span>Loading tasks...</span></div>`;
    try {
        const res  = await fetch(TASKS_SHEET_URL + '&t=' + Date.now());
        if (!res.ok) throw new Error('HTTP ' + res.status);
        allTasks = parseTasksCSV(await res.text());
        renderTasks();
    } catch(err) {
        container.innerHTML = `<div class="tasks-empty"><i class="fas fa-wifi"></i><p>Could not load tasks</p><button onclick="refreshTasks()" class="btn-retry-tasks"><i class="fas fa-redo"></i> Retry</button></div>`;
    }
}
function parseTasksCSV(csv) {
    const lines = csv.trim().split('\n');
    const tasks = [];
    for (let i = 2; i < lines.length; i++) {
        const cols = splitCSVLine(lines[i].trim());
        const name = stripQuotes(cols[0]||'');
        if (!name) continue;
        tasks.push({ name, subject:stripQuotes(cols[1]||''), type:stripQuotes(cols[2]||''), due:stripQuotes(cols[3]||''), notes:stripQuotes(cols[4]||'') });
    }
    return tasks;
}
function splitCSVLine(line) {
    const cols = []; let current='', inQuotes=false;
    for (let i=0;i<line.length;i++) {
        const ch=line[i], next=line[i+1];
        if (ch==='"') { if(inQuotes&&next==='"'){current+='"';i++;}else inQuotes=!inQuotes; }
        else if (ch===','&&!inQuotes) { cols.push(current); current=''; }
        else current+=ch;
    }
    cols.push(current);
    return cols;
}
function stripQuotes(str) { return str.replace(/^"|"$/g,'').trim(); }

function parseDate(str) {
    if (!str||typeof str!=='string') return null;
    const s = str.trim(); if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const [y,m,d]=s.split('-').map(Number); const dt=new Date(y,m-1,d); return isNaN(dt)?null:dt; }
    const sm=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if(sm){const[,d,m,y]=sm.map(Number);const dt=new Date(y,m-1,d);return isNaN(dt)?null:dt;}
    const sh=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/); if(sh){const[,d,m,y]=sh.map(Number);const dt=new Date(2000+y,m-1,d);return isNaN(dt)?null:dt;}
    if(/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)){const[d,m,y]=s.split('-').map(Number);const dt=new Date(y,m-1,d);return isNaN(dt)?null:dt;}
    const p=new Date(s); return isNaN(p)?null:new Date(p.getFullYear(),p.getMonth(),p.getDate());
}
function daysFromToday(date) {
    const today=new Date();today.setHours(0,0,0,0);
    return Math.round((new Date(date.getFullYear(),date.getMonth(),date.getDate())-today)/86400000);
}
function linkify(text) {
    return escapeHtml(text).replace(/(https?:\/\/[^\s<>"]+)/g,'<a href="$1" target="_blank" rel="noopener" class="t-link">$1 <i class="fas fa-external-link-alt" style="font-size:.6rem"></i></a>').replace(/\n/g,'<br>');
}
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    if (!container) return;
    // Keep real index from allTasks so openTaskModal always opens the right card
    const list = allTasks
        .map((task, realIdx) => ({ task, realIdx }))
        .filter(({ task }) => currentFilter === 'all' || (task.type||'').toLowerCase() === currentFilter.toLowerCase());
    if (!list.length) { container.innerHTML=`<div class="tasks-empty"><i class="fas fa-check-circle"></i><p>No tasks found!</p></div>`; return; }
    container.innerHTML = list.map(({ task, realIdx }) => buildTaskCard(task, realIdx)).join('');
}
function buildTaskCard(task, idx) {
    const date=parseDate(task.due), diff=date?daysFromToday(date):null;
    const typeKey=(task.type||'').toLowerCase(), tKey=makeTaskKey(task), done=getCompletedTasks()[tKey]||false;
    let badge='',urgency='';
    if (!done&&diff!==null) {
        if(diff<0){badge=`<span class="t-badge overdue">Overdue</span>`;urgency='is-overdue';}
        else if(diff===0){badge=`<span class="t-badge today">Today!</span>`;urgency='is-today';}
        else if(diff<=3){badge=`<span class="t-badge soon">In ${diff}d</span>`;urgency='is-soon';}
    }
    let countdown='';
    if (!done&&diff!==null) {
        if(diff<0) countdown=`<div class="t-countdown overdue"><i class="fas fa-exclamation-circle"></i> ${Math.abs(diff)} day${Math.abs(diff)!==1?'s':''} ago</div>`;
        else if(diff===0) countdown=`<div class="t-countdown today"><i class="fas fa-clock"></i> Due Today!</div>`;
        else if(diff===1) countdown=`<div class="t-countdown soon"><i class="fas fa-hourglass-half"></i> 1 day left</div>`;
        else countdown=`<div class="t-countdown normal"><i class="fas fa-hourglass-start"></i> ${diff} days left</div>`;
    }
    const notesHint = (task.notes&&task.notes.trim()) ? `<div class="t-notes-hint"><i class="fas fa-sticky-note"></i> Click to view notes</div>` : '';
    return `<div class="t-card ${urgency} ${done?'is-done':''}" data-type="${typeKey}">
        <div class="t-card-top">
            <div class="t-card-top-left">
                <label class="t-checkbox" onclick="event.stopPropagation()">
                    <input type="checkbox" ${done?'checked':''} onchange="toggleTaskDone('${tKey}',${idx},this.checked)">
                    <span class="t-checkmark"></span>
                </label>
                <span class="t-type">${escapeHtml(task.type||'Task')}</span>
            </div>
            ${badge}
        </div>
        <div onclick="openTaskModal(${idx})">
            <div class="t-name ${done?'t-done-text':''}">${escapeHtml(task.name)}</div>
            ${task.subject?`<div class="t-meta"><i class="fas fa-book"></i> ${escapeHtml(task.subject)}</div>`:''}
            ${countdown}${notesHint}
        </div>
    </div>`;
}
function toggleTaskDone(tKey, idx, done) { setTaskCompleted(tKey, done); renderTasks(); }
function openTaskModal(idx) {
    const task = allTasks[idx]; if (!task) return;
    const col = getTypeColor(task.type);
    if (!document.getElementById('taskDetailModal')) {
        const el=document.createElement('div'); el.id='taskDetailModal'; el.className='task-detail-modal';
        el.innerHTML=`<div class="tdm-overlay" onclick="closeTaskModal()"></div><div class="tdm-box"><div class="tdm-header"><div class="tdm-header-left"><span class="tdm-type-badge"></span><span class="tdm-status-badge"></span></div><button class="tdm-close" onclick="closeTaskModal()"><i class="fas fa-times"></i></button></div><div class="tdm-body"><div class="tdm-name"></div><div class="tdm-meta-row"><i class="fas fa-book"></i> <span class="tdm-subject"></span></div><div class="tdm-divider"></div><div class="tdm-notes-label"><i class="fas fa-sticky-note"></i> Notes</div><div class="tdm-notes"></div></div></div>`;
        document.body.appendChild(el);
    }
    const date=parseDate(task.due), diff=date?daysFromToday(date):null;
    let statusHtml='';
    if(diff!==null){if(diff<0)statusHtml=`<span class="t-badge overdue">Overdue by ${Math.abs(diff)}d</span>`;else if(diff===0)statusHtml=`<span class="t-badge today">Today!</span>`;else if(diff<=3)statusHtml=`<span class="t-badge soon">In ${diff}d</span>`;else statusHtml=`<span class="t-countdown normal" style="display:inline-flex"><i class="fas fa-hourglass-start"></i> ${diff} days left</span>`;}
    const notesHtml = (task.notes&&task.notes.trim())?linkify(task.notes):'<span class="tdm-no-notes">No notes.</span>';
    const modal=document.getElementById('taskDetailModal');
    const box=modal.querySelector('.tdm-box'); const header=modal.querySelector('.tdm-header');
    box.style.borderColor=col.border; box.style.borderLeftWidth='4px'; box.style.borderLeftColor=col.accent;
    header.style.background=col.bg;
    modal.querySelector('.tdm-type-badge').textContent=task.type||'Task';
    modal.querySelector('.tdm-type-badge').style.background=col.bg;
    modal.querySelector('.tdm-type-badge').style.borderColor=col.border;
    modal.querySelector('.tdm-type-badge').style.color=col.accent;
    modal.querySelector('.tdm-status-badge').innerHTML=statusHtml;
    modal.querySelector('.tdm-name').textContent=task.name;
    modal.querySelector('.tdm-subject').textContent=task.subject||'—';
    modal.querySelector('.tdm-notes').innerHTML=notesHtml;
    modal.querySelector('.tdm-meta-row').style.display=task.subject?'flex':'none';
    modal.classList.add('active'); document.body.style.overflow='hidden';
}
function closeTaskModal() { const m=document.getElementById('taskDetailModal'); if(m) m.classList.remove('active'); document.body.style.overflow=''; }
function filterTasks(type, el) { currentFilter=type; document.querySelectorAll('.task-filter-btn').forEach(b=>b.classList.remove('active')); if(el) el.classList.add('active'); renderTasks(); }
function refreshTasks() { allTasks=[]; loadTasksFromSheet(); }

// ============================================
// STUDY PLAN — Official course codes
// ============================================
const SP_COLORS = {
    prog:'#00d4ff',math:'#9370db',systems:'#32cd32',hardware:'#ff8c00',
    networks:'#e67e22',ai:'#f5a623',graphics:'#ff69b4',lang:'#64c8ff',soft:'#b0b0b0',science:'#50dcb4'
};
const SP_LABELS = {
    prog:'Programming',math:'Math',systems:'Systems',hardware:'Hardware',
    networks:'Networks',ai:'AI',graphics:'Graphics',lang:'Language',soft:'Soft Skills',science:'Science'
};

// All courses with official codes from education requirements
const SP_DATA = [
    // Level 1 — Term 1
    { id:0,  code:'H 101',  name:'English Language',           pre:[],       chain:'lang',     lv:1, tm:1 },
    { id:1,  code:'H 102',  name:'Creative Thinking & Comm.',  pre:[],       chain:'soft',     lv:1, tm:1 },
    { id:2,  code:'BS 101', name:'Calculus',                   pre:[],       chain:'math',     lv:1, tm:1 },
    { id:3,  code:'BS 131', name:'Electronics',                pre:[],       chain:'hardware', lv:1, tm:1 },
    { id:4,  code:'CS 101', name:'Physics',                    pre:[],       chain:'science',  lv:1, tm:1 },
    { id:5,  code:'CS 103', name:'Intro to CS',                pre:[],       chain:'prog',     lv:1, tm:1 },
    // Level 1 — Term 2
    { id:6,  code:'H 103',  name:'Technical Report Writing',   pre:[0],      chain:'lang',     lv:1, tm:2 },
    { id:7,  code:'BS 102', name:'Linear Algebra',             pre:[2],      chain:'math',     lv:1, tm:2 },
    { id:8,  code:'BS 103', name:'Discrete Mathematics',       pre:[2],      chain:'math',     lv:1, tm:2 },
    { id:9,  code:'BS 121', name:'Info Systems',               pre:[],       chain:'systems',  lv:1, tm:2 },
    { id:10, code:'CS 102', name:'Computer Programming',       pre:[4],      chain:'prog',     lv:1, tm:2 },
    { id:11, code:'CS 121', name:'Logic Design',               pre:[3],      chain:'hardware', lv:1, tm:2 },
    // Level 2 — Term 1
    { id:12, code:'H 201',  name:'Work Ethics',                pre:[],       chain:'soft',     lv:2, tm:1 },
    { id:13, code:'BS 205', name:'Operations Research',        pre:[2],      chain:'math',     lv:2, tm:1 },
    { id:14, code:'BS 210', name:'Statistics & Probabilities', pre:[2],      chain:'math',     lv:2, tm:1 },
    { id:15, code:'CS 203', name:'OOP',                        pre:[10],     chain:'prog',     lv:2, tm:1 },
    { id:16, code:'CS 211', name:'File Processing',            pre:[10],     chain:'prog',     lv:2, tm:1 },
    { id:17, code:'CS 220', name:'Assembly Language',          pre:[11],     chain:'hardware', lv:2, tm:1 },
    // Level 2 — Term 2
    { id:18, code:'H 202',  name:'Business Administration',    pre:[],       chain:'soft',     lv:2, tm:2 },
    { id:19, code:'H 204',  name:'Human Rights',               pre:[],       chain:'soft',     lv:2, tm:2 },
    { id:20, code:'CS 201', name:'Data Structure',             pre:[10],     chain:'prog',     lv:2, tm:2 },
    { id:21, code:'CS 206', name:'Web Programming',            pre:[10],     chain:'prog',     lv:2, tm:2 },
    { id:22, code:'CS 210', name:'Systems Analysis & Design',  pre:[5,9],    chain:'systems',  lv:2, tm:2 },
    { id:23, code:'CS 250', name:'Computer Networks',          pre:[4],      chain:'networks', lv:2, tm:2 },
    // Level 3 — Term 1
    { id:24, code:'CS 323', name:'Intro to Databases',         pre:[5],      chain:'systems',  lv:3, tm:1 },
    { id:25, code:'CS 309', name:'Mobile App Development',     pre:[21],     chain:'prog',     lv:3, tm:1 },
    { id:26, code:'CS 312', name:'Analysis of Algorithms',     pre:[20],     chain:'prog',     lv:3, tm:1 },
    { id:27, code:'CS 315', name:'Software Engineering',       pre:[22],     chain:'systems',  lv:3, tm:1 },
    { id:28, code:'CS 353', name:'Fundamentals of Multimedia', pre:[10],     chain:'graphics', lv:3, tm:1 },
    { id:29, code:'CS 314', name:'Human Computer Interaction', pre:[10],     chain:'soft',     lv:3, tm:1 },
    // Level 3 — Term 2
    { id:30, code:'CS 307', name:'Logic Programming',          pre:[10],     chain:'prog',     lv:3, tm:2 },
    { id:31, code:'CS 321', name:'Compiler Design & Theory',   pre:[17],     chain:'hardware', lv:3, tm:2 },
    { id:32, code:'CS 331', name:'Theory of OS',               pre:[17],     chain:'systems',  lv:3, tm:2 },
    { id:33, code:'CS 340', name:'Computer Graphics',          pre:[17],     chain:'graphics', lv:3, tm:2 },
    { id:34, code:'CS 360', name:'Artificial Intelligence',    pre:[26],     chain:'ai',       lv:3, tm:2 },
    { id:35, code:'CS 361', name:'Neural Networks',            pre:[30],     chain:'ai',       lv:3, tm:2 },
    // Level 4 — Term 1
    { id:36, code:'CS 413', name:'Computer Security',          pre:[26],     chain:'networks', lv:4, tm:1 },
    { id:37, code:'CS 443', name:'Digital Image Processing',   pre:[33],     chain:'graphics', lv:4, tm:1 },
    { id:38, code:'CS 418', name:'Parallel Processing',        pre:[23],     chain:'networks', lv:4, tm:1 },
    { id:39, code:'CS 433', name:'Cloud Computing',            pre:[23],     chain:'networks', lv:4, tm:1 },
    { id:40, code:'CS 463', name:'Intro to Embedded Systems',  pre:[17],     chain:'hardware', lv:4, tm:1 },
    { id:41, code:'CS 498', name:'Senior Project 1',           pre:[],       chain:'systems',  lv:4, tm:1 },
    // Level 4 — Term 2
    { id:42, code:'CS 455', name:'Internet of Things (IoT)',   pre:[23],     chain:'networks', lv:4, tm:2 },
    { id:43, code:'CS 462', name:'Machine Learning',           pre:[14],     chain:'ai',       lv:4, tm:2 },
    { id:44, code:'CS 432', name:'Distributed Systems',        pre:[32],     chain:'systems',  lv:4, tm:2 },
    { id:45, code:'CS 470', name:'Data Warehousing',           pre:[24],     chain:'systems',  lv:4, tm:2 },
    { id:46, code:'CS 499', name:'Graduation Project 2',       pre:[41],     chain:'systems',  lv:4, tm:2 },
];

let sp_active = null;
function showStudyPlan() {
    const modal = document.getElementById('studyPlanModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    if (!modal.dataset.built) { buildSP(); modal.dataset.built='1'; }
    document.body.style.overflow = 'hidden';
}
function closeStudyPlan() {
    const modal = document.getElementById('studyPlanModal');
    if (modal) { modal.classList.add('hidden'); document.body.style.overflow=''; }
    sp_active = null; spClearStates();
}
function buildSP() {
    const modal = document.getElementById('studyPlanModal');
    const cols  = {};
    for (let lv=1;lv<=4;lv++) for (let tm=1;tm<=2;tm++) cols[`${lv}-${tm}`] = SP_DATA.filter(c=>c.lv===lv&&c.tm===tm);
    const maxRows = Math.max(...Object.values(cols).map(a=>a.length));
    const chains  = [...new Set(SP_DATA.map(c=>c.chain))];
    const legendHtml = chains.map(ch=>`<div class="sp-pill" style="border-color:${SP_COLORS[ch]}55;color:${SP_COLORS[ch]};"><div class="sp-pill-dot" style="background:${SP_COLORS[ch]};"></div>${SP_LABELS[ch]||ch}</div>`).join('');
    let gridHtml = '';
    for (let lv=1;lv<=4;lv++) {
        const border = lv>1?'lvl-border':'';
        gridHtml += `<div class="sp-level-head ${border}" style="grid-column:${(lv-1)*2+1} / span 2;grid-row:1;">⬡ Level ${lv}</div>`;
    }
    for (let lv=1;lv<=4;lv++) {
        gridHtml += `<div class="sp-col-head term1" style="grid-column:${(lv-1)*2+1};grid-row:2;">Term 1</div>`;
        gridHtml += `<div class="sp-col-head term2" style="grid-column:${(lv-1)*2+2};grid-row:2;">Term 2</div>`;
    }
    for (let row=0;row<maxRows;row++) {
        for (let lv=1;lv<=4;lv++) {
            for (let tm=1;tm<=2;tm++) {
                const gridCol=(lv-1)*2+tm, gridRow=row+3;
                const course=cols[`${lv}-${tm}`][row];
                const bl=(lv>1&&tm===1)?'border-left:3px solid rgba(245,166,35,0.15);':tm===2?'border-left:1px solid rgba(255,255,255,0.05);':'';
                if (course) {
                    gridHtml += `<div style="grid-column:${gridCol};grid-row:${gridRow};padding:4px 3px;${bl}"><div class="sp-card" data-id="${course.id}" data-chain="${course.chain}" data-pre="${course.pre.join(',')}" onclick="spTap(${course.id})"><div class="sp-card-code">${course.code}</div><div class="sp-card-name">${course.name}</div>${course.pre.length?`<div class="sp-card-pre">pre: ${course.pre.map(pid=>SP_DATA.find(c=>c.id===pid)?.code||'?').join(', ')}</div>`:''}</div></div>`;
                } else {
                    gridHtml += `<div style="grid-column:${gridCol};grid-row:${gridRow};${bl}"></div>`;
                }
            }
        }
    }
    modal.innerHTML = `<div style="display:flex;flex-direction:column;height:100%;overflow:hidden;"><div class="sp-header"><div class="sp-title"><i class="fas fa-graduation-cap"></i> CS Study Plan</div><button class="sp-close" onclick="closeStudyPlan()"><i class="fas fa-times"></i></button></div><div class="sp-legend">${legendHtml}</div><div class="sp-info" id="spInfo"><span class="sp-info-name" id="spInfoName"></span><span id="spInfoTags"></span></div><div class="sp-body"><div class="sp-grid" id="spGrid">${gridHtml}</div></div></div>`;
}
function spTap(id) {
    if (sp_active===id) { sp_active=null; spClearStates(); document.getElementById('spInfo')?.classList.remove('show'); return; }
    sp_active = id;
    const course = SP_DATA.find(c=>c.id===id); if (!course) return;
    const prereqs = spGetPrereqs(id), unlocks = spGetUnlocks(id);
    document.querySelectorAll('.sp-card').forEach(card => {
        const cid = parseInt(card.dataset.id);
        card.classList.remove('is-selected','is-prereq','is-unlocks','is-dim');
        if(cid===id) card.classList.add('is-selected');
        else if(prereqs.find(c=>c.id===cid)) card.classList.add('is-prereq');
        else if(unlocks.find(c=>c.id===cid)) card.classList.add('is-unlocks');
        else card.classList.add('is-dim');
    });
    const col = SP_COLORS[course.chain]||'#f5a623';
    const nameEl = document.getElementById('spInfoName');
    const tagsEl = document.getElementById('spInfoTags');
    nameEl.textContent = `${course.code} — ${course.name}`;
    nameEl.style.color = col;
    nameEl.style.textShadow = `0 0 10px ${col}`;
    let tags = `<span class="sp-info-tag">${SP_LABELS[course.chain]||course.chain}</span>`;
    if (prereqs.length) tags += `<span class="sp-info-tag pre">📌 ${prereqs.map(p=>p.code).join(' → ')}</span>`;
    else tags += `<span class="sp-info-tag">✅ No prerequisites</span>`;
    if (unlocks.length) tags += `<span class="sp-info-tag open">🔓 ${unlocks.map(u=>u.code).join(', ')}</span>`;
    tagsEl.innerHTML = tags;
    document.getElementById('spInfo')?.classList.add('show');
    const el = [...document.querySelectorAll('.sp-card')].find(c=>parseInt(c.dataset.id)===id);
    el?.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
}
function spClearStates() { document.querySelectorAll('.sp-card').forEach(c=>c.classList.remove('is-selected','is-prereq','is-unlocks','is-dim')); }
function spGetPrereqs(id) {
    const visited=new Set(), result=[];
    function recurse(cid) {
        const course=SP_DATA.find(c=>c.id===cid); if(!course) return;
        course.pre.forEach(pid=>{ if(!visited.has(pid)){ visited.add(pid); const p=SP_DATA.find(c=>c.id===pid); if(p){result.push(p);recurse(pid);} } });
    }
    recurse(id); return result;
}
function spGetUnlocks(id) {
    const result=[],queue=[id],seen=new Set();
    while(queue.length){ const cid=queue.shift(); if(seen.has(cid)) continue; seen.add(cid); SP_DATA.forEach(c=>{ if(c.pre.includes(cid)&&!seen.has(c.id)){result.push(c);queue.push(c.id);} }); }
    return result;
}
