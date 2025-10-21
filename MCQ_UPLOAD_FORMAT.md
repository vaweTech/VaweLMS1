# MCQ Bulk Upload Format Guide

## CSV/Excel File Format

Upload CSV or Excel files (.csv, .xlsx, .xls) with MCQ questions to quickly add multiple questions at once.

### Required Columns

| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| `question` | Text (Required) | The question text | "What is the capital of France?" |
| `description` | Text (Optional) | Additional context or explanation | "Geography question about European capitals" |
| `option1` | Text (Required) | First answer option | "Paris" |
| `option2` | Text (Required) | Second answer option | "London" |
| `option3` | Text (Optional) | Third answer option | "Berlin" |
| `option4` | Text (Optional) | Fourth answer option | "Madrid" |
| `option5` | Text (Optional) | Fifth answer option (if needed) | "Rome" |
| `option6` | Text (Optional) | Sixth answer option (if needed) | "Vienna" |
| `answer` | Text (Required) | Correct answer(s) | "Paris" or "Python,JavaScript" |

### Important Notes

1. **Minimum Requirements:**
   - At least 2 options are required (option1 and option2)
   - At least 1 correct answer is required

2. **Multiple Correct Answers:**
   - Separate multiple answers with commas
   - Example: `"Python,JavaScript,Java"`
   - Make sure the answer text matches the option text exactly

3. **Column Names:**
   - Column names are case-insensitive
   - `question`, `Question`, and `QUESTION` all work
   - Same applies to all column names

4. **Empty Rows:**
   - Empty rows are automatically skipped

### Sample CSV Format

```csv
question,description,option1,option2,option3,option4,answer
What is the capital of France?,Geography question about European capitals,Paris,London,Berlin,Madrid,Paris
Which of the following are programming languages?,Multiple correct answers example,Python,HTML,JavaScript,CSS,"Python,JavaScript"
What is 2 + 2?,Simple math question,3,4,5,6,4
Which are web technologies?,"Frontend technologies",HTML,Python,CSS,Ruby,"HTML,CSS"
```

### Sample Excel Format

Create an Excel file with the same structure:

| question | description | option1 | option2 | option3 | option4 | answer |
|----------|-------------|---------|---------|---------|---------|--------|
| What is the capital of France? | Geography question | Paris | London | Berlin | Madrid | Paris |
| Which are programming languages? | Multiple answers | Python | HTML | JavaScript | CSS | Python,JavaScript |

## How to Use

1. **Prepare Your File:**
   - Create a CSV or Excel file with the format above
   - Or download the sample template from the MCQ management page

2. **Select Course and Chapter:**
   - Choose the course where questions should be added
   - Choose the chapter/category for the questions

3. **Upload File:**
   - Click the file input and select your CSV/Excel file
   - The system will automatically parse and preview the questions

4. **Review Preview:**
   - Check the parsed questions in the preview section
   - Verify that all questions, options, and answers are correct
   - Correct answers are highlighted in green

5. **Upload Questions:**
   - Click "Upload All Questions" to add them to the database
   - Wait for the success confirmation

## Troubleshooting

### "No valid questions found in the file"
- Check that your column names match the expected format
- Ensure each row has a question, at least 2 options, and an answer

### "Less than 2 options found"
- Make sure you have at least option1 and option2 filled in
- Check for empty cells

### "No answer found"
- Verify the answer column is not empty
- Make sure answer text matches one of the options exactly

### Multiple answers not working
- Ensure answers are separated by commas without spaces
- Or use `"Python,JavaScript"` with quotes in CSV

## Download Sample Template

You can download a pre-formatted sample template directly from the MCQ management page by clicking the "📥 Download Sample CSV Template" button.

