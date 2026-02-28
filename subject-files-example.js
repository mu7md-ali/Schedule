// ============================================
// SUBJECT FILES DATA - EXAMPLE
// ============================================
// انسخ الكود ده وحطه في ملف script.js مكان subjectFilesData
// أو عدل على حسب ملفاتك

const subjectFilesData = {
    // Business Administration 💼
    "business administration": [
        // { name: "Lecture 1.pdf", type: "file", path: "pdfs/business administration/lecture1.pdf" },
        // { name: "Lecture 2.pdf", type: "file", path: "pdfs/business administration/lecture2.pdf" },
        // {
        //     name: "Exams",
        //     type: "folder",
        //     children: [
        //         { name: "Midterm.pdf", type: "file", path: "pdfs/business administration/exams/midterm.pdf" },
        //         { name: "Final.pdf", type: "file", path: "pdfs/business administration/exams/final.pdf" }
        //     ]
        // }
    ],

    // Data Structure 🌳
    "data structure": [
        // { name: "Slides.pdf", type: "file", path: "pdfs/data structure/slides.pdf" },
        // { name: "Notes.pdf", type: "file", path: "pdfs/data structure/notes.pdf" },
        // {
        //     name: "Labs",
        //     type: "folder",
        //     children: [
        //         { name: "Lab 1.pdf", type: "file", path: "pdfs/data structure/labs/lab1.pdf" },
        //         { name: "Lab 2.pdf", type: "file", path: "pdfs/data structure/labs/lab2.pdf" }
        //     ]
        // }
    ],

    // Web Programming 🌐
    "web programming": [
        // { name: "HTML Basics.pdf", type: "file", path: "pdfs/web programming/html basics.pdf" },
        // { name: "CSS Guide.pdf", type: "file", path: "pdfs/web programming/css guide.pdf" },
        // { name: "JavaScript.pdf", type: "file", path: "pdfs/web programming/javascript.pdf" }
    ],

    // Computer Network 🔌
    "computer network": [
        // { name: "Chapter 1.pdf", type: "file", path: "pdfs/computer network/chapter1.pdf" },
        // { name: "Chapter 2.pdf", type: "file", path: "pdfs/computer network/chapter2.pdf" },
        // {
        //     name: "Assignments",
        //     type: "folder",
        //     children: [
        //         { name: "Assignment 1.pdf", type: "file", path: "pdfs/computer network/assignments/assignment1.pdf" }
        //     ]
        // }
    ],

    // System Analysis 📊
    "system analysis": [
        // { name: "Lecture Notes.pdf", type: "file", path: "pdfs/system analysis/lecture notes.pdf" },
        // { name: "Case Studies.pdf", type: "file", path: "pdfs/system analysis/case studies.pdf" }
    ],

    // Human Rights ⚖️
    "human rights": [
        // { name: "Book.pdf", type: "file", path: "pdfs/human rights/book.pdf" },
        // { name: "Summary.pdf", type: "file", path: "pdfs/human rights/summary.pdf" }
    ]
};

// ============================================
// HOW TO ADD FILES:
// ============================================
// 1. Create folder: pdfs/[subject name]/
// 2. Put PDF files in the folder
// 3. Uncomment and modify the lines above
// 4. Make sure paths match your folder structure
//
// FOLDER STRUCTURE EXAMPLE:
// 📁 pdfs/
// ├── 📁 business administration/
// │   ├── 📄 lecture1.pdf
// │   └── 📁 exams/
// │       └── 📄 midterm.pdf
// ├── 📁 data structure/
// │   └── 📄 slides.pdf
// └── ... etc
