# Excel Upload Format for Course Chapters

## Overview
You can upload an Excel file (.xlsx or .xls) to automatically create chapters for your course. This feature allows you to bulk import chapter data instead of adding chapters one by one.

## Excel File Format

### Required Columns
Your Excel file should contain the following columns (column names are case-insensitive):

| Column Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| `order` or `Order` or `OrderNumber` | Chapter sequence number | Yes | 1, 2, 3, 4... |
| `title` or `Title` or `ChapterTitle` or `chapter` or `Chapter` or `Topic` | Chapter title | Yes | "Introduction to JavaScript" |
| `topics` or `Topics` or `Description` | Chapter topics/description | No | "Variables, Functions, Loops" |
| `video` or `Video` or `VideoURL` | Video URL | No | "https://youtube.com/watch?v=..." |
| `liveClassLink` or `LiveClassLink` or `LiveClass` | Live class link | No | "https://meet.google.com/..." |
| `recordedClassLink` or `RecordedClassLink` or `RecordedClass` | Recorded class link | No | "https://youtube.com/watch?v=..." |
| `pdfDocument` or `PDFDocument` or `PDF` | PDF document link | No | "https://drive.google.com/file/..." |
| `classDocs` or `ClassDocs` or `PPT` or `PPTs` | Class documents/PPT link | No | "https://drive.google.com/file/..." |

### Example Excel Data

| order | Topic | topics | video | liveClassLink | recordedClassLink | pdfDocument | classDocs |
|-------|-------|--------|-------|---------------|-------------------|-------------|-----------|
| 1 | Introduction to Programming | Basic concepts, variables, data types | https://youtube.com/watch?v=abc123 | https://meet.google.com/xyz | https://youtube.com/watch?v=def456 | https://drive.google.com/file/ghi789 | https://drive.google.com/file/jkl012 |
| 2 | Variables and Data Types | String, Number, Boolean, Array | https://youtube.com/watch?v=mno345 | | https://youtube.com/watch?v=pqr678 | https://drive.google.com/file/stu901 | |
| 3 | Control Structures | If-else, loops, switch | | https://meet.google.com/vwx234 | | | https://drive.google.com/file/yza567 |

## How to Use

1. **Prepare your Excel file** with the columns mentioned above
2. **Go to Admin Dashboard** → Tutorials
3. **Click "Add New Course"**
4. **Fill in course details** (Title, Code, Description, Syllabus)
5. **Upload Excel file** using the file input in the Excel Upload section
6. **Review the preview** that shows all chapters to be created
7. **Click "Add Course"** to create the course with all chapters automatically

## Tips

- **Order column**: Use sequential numbers (1, 2, 3, 4...) for proper chapter ordering
- **Title column**: This is the only required field besides order
- **Empty rows**: Will be automatically filtered out
- **Column names**: The system is flexible with column naming (case-insensitive)
- **File size**: Keep Excel files under 10MB for best performance

## Supported File Formats
- `.xlsx` (Excel 2007 and later)
- `.xls` (Excel 97-2003)

## Error Handling
- If the Excel file format is incorrect, you'll see an error message
- Empty rows are automatically skipped
- Missing required fields (order, title) will cause the row to be skipped
- The system will show you exactly how many chapters will be created before proceeding

## Benefits
- **Bulk import**: Create multiple chapters at once
- **Time saving**: No need to add chapters manually one by one
- **Consistent format**: Ensures all chapters follow the same structure
- **Preview before creation**: Review all data before creating chapters
