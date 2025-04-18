const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Create a sample worksheet
const ws = xlsx.utils.aoa_to_sheet([
    // Headers
    ['Name', 'UID', 'Email', 'Phone', 'DOB', 'Semester', 'Course', 'Shift', 'Section', 'Reg. No.', 'Roll No.', 'ABC Id'],

    // Sample data row 1
    ['John Doe', 'ST12345', 'john.doe@example.com', '9876543210', '01-01-1998', '3', 'B.Tech Computer Science', 'DAY', 'A', 'REG123456', 'CS123', 'ABC123456'],

    // Sample data row 2
    ['Jane Smith', 'ST67890', 'jane.smith@example.com', '9876543211', '15-05-1999', '5', 'B.Tech Electronics', 'MORNING', 'B', 'REG789012', 'EC456', 'ABC789012'],

    // Sample data row 3
    ['Robert Johnson', 'ST45678', 'robert.johnson@example.com', '9876543212', '23-11-2000', '7', 'MCA', 'EVENING', 'C', 'REG456789', 'MCA789', 'ABC456789']
]);

// Create workbook
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, 'Students');

// Set column widths for better readability
const colWidth = [
    { wch: 20 }, // Name
    { wch: 10 }, // UID
    { wch: 25 }, // Email
    { wch: 15 }, // Phone
    { wch: 12 }, // DOB
    { wch: 10 }, // Semester
    { wch: 25 }, // Course
    { wch: 10 }, // Shift
    { wch: 10 }, // Section
    { wch: 15 }, // Reg. No.
    { wch: 15 }, // Roll No.
    { wch: 15 }  // ABC Id
];
ws['!cols'] = colWidth;

// Create templates directory if it doesn't exist
const templatesDir = path.join(__dirname, '../public/templates');
if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
}

// Write to file
const filePath = path.join(templatesDir, 'student-upload-template.xlsx');
xlsx.writeFile(wb, filePath);

console.log(`Excel template created at: ${filePath}`); 