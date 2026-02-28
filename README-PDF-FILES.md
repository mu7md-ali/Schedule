# دليل إضافة ملفات PDF للمواد

## شرح الميزة الجديدة

لما تضغط مطولاً (Long Press) على أي كارت مادة لمدة **2 ثانية**، هيفتح Modal جديد بيعرض ملفات PDF الخاصة بالمادة دي.

## هيكل ملفات PDF المطلوب

```
📁 موقعك/
├── 📄 index.html
├── 📄 style.css
├── 📄 script.js
├── 📁 pdfs/                    <-- اعمل المجلد ده
│   ├── 📁 business administration/
│   │   ├── 📄 lecture1.pdf
│   │   ├── 📄 lecture2.pdf
│   │   └── 📁 exams/
│   │       ├── 📄 midterm.pdf
│   │       └── 📄 final.pdf
│   ├── 📁 data structure/
│   │   ├── 📄 slides.pdf
│   │   └── 📄 notes.pdf
│   ├── 📁 web programming/
│   │   └── 📄 ...
│   └── ... (باقي المواد)
```

## خطوات إضافة ملفات PDF

### 1. اعمل مجلد `pdfs/` في نفس مكان ملف `index.html`

### 2. اعمل مجلد لكل مادة

اسم المجلد لازم يكون نفس اسم المادة بالظبط (بدون إيموجيز):
- "Business Administration" → `business administration/`
- "Data Structure 🌳" → `data structure/`
- "Web Programming 🌐" → `web programming/`

### 3. حط ملفات PDF جوه المجلد

### 4. عدل ملف `script.js` - ضيف الملفات في `subjectFilesData`

افتح `script.js` ودور على:
```javascript
const subjectFilesData = {
    // Example structure...
};
```

ضيف ملفاتك بالشكل ده:

```javascript
const subjectFilesData = {
    "business administration": [
        { name: "Lecture 1.pdf", type: "file", path: "pdfs/business administration/lecture1.pdf" },
        { name: "Lecture 2.pdf", type: "file", path: "pdfs/business administration/lecture2.pdf" },
        { 
            name: "Exams", 
            type: "folder", 
            children: [
                { name: "Midterm.pdf", type: "file", path: "pdfs/business administration/exams/midterm.pdf" },
                { name: "Final.pdf", type: "file", path: "pdfs/business administration/exams/final.pdf" }
            ]
        }
    ],
    "data structure": [
        { name: "Slides.pdf", type: "file", path: "pdfs/data structure/slides.pdf" },
        { name: "Notes.pdf", type: "file", path: "pdfs/data structure/notes.pdf" }
    ],
    "web programming": [
        { name: "HTML Basics.pdf", type: "file", path: "pdfs/web programming/html basics.pdf" }
    ],
    "computer network": [
        { name: "Chapter 1.pdf", type: "file", path: "pdfs/computer network/chapter1.pdf" }
    ],
    "system analysis": [
        { name: "Lecture Notes.pdf", type: "file", path: "pdfs/system analysis/lecture notes.pdf" }
    ],
    "human rights": [
        { name: "Book.pdf", type: "file", path: "pdfs/human rights/book.pdf" }
    ]
};
```

## أسماء المواد الموجودة في الجدول

لو مش عارف اسم المادة بالظبط، دي قائمة بأسماء المواد من `data.json`:

1. **Business Administration 💼** → `business administration`
2. **Data Structure 🌳** → `data structure`
3. **Web Programming 🌐** → `web programming`
4. **Computer Network 🔌** → `computer network`
5. **System Analysis 📊** → `system analysis`
6. **Human Rights ⚖️** → `human rights`

## ملاحظات مهمة

1. **الأسماء حساسة للحروف الكبيرة والصغيرة** - استخدم حروف صغيرة (lowercase)
2. **شيل الإيموجيز** من اسم المجلد
3. **المسافات** مسموح بيها في أسماء الملفات والمجلدات
4. **الملفات اللي مالهاش بيانات** هتظهر رسالة "No files yet"

## مثال كامل

لو عايز تضيف ملفات لمادة "Data Structure":

1. اعمل المجلد:
   ```
   pdfs/data structure/
   ```

2. حط الملفات:
   ```
   pdfs/data structure/
   ├── lecture1.pdf
   ├── lecture2.pdf
   └── midterm review.pdf
   ```

3. عدل `script.js`:
   ```javascript
   "data structure": [
       { name: "Lecture 1.pdf", type: "file", path: "pdfs/data structure/lecture1.pdf" },
       { name: "Lecture 2.pdf", type: "file", path: "pdfs/data structure/lecture2.pdf" },
       { name: "Midterm Review.pdf", type: "file", path: "pdfs/data structure/midterm review.pdf" }
   ]
   ```

## الملفات اللي اتعدلت

| الملف | التعديل |
|-------|---------|
| `index.html` | إضافة Subject Files Modal |
| `style.css` | إضافة CSS للـ Modal والـ PDF Viewer |
| `script.js` | إضافة Long Press Detection و File Browser |

## الملفات اللي ماتعدلتش

- `data.json` - مفيش تعديل
- `students-names-data.js` - مفيش تعديل
- `english-schedule-data.json` - مفيش تعديل
- `manifest.json` - مفيش تعديل
- `sw.js` - مفيش تعديل
