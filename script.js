document.getElementById('uploadArea').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', handleFile);

function handleFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            processCSV(content);
        };
        reader.readAsText(file);
    }
}

function processCSV(data) {
    const rows = data.split('\n').map(row => row.split(','));
    const headers = rows[0];
    const fileDetails = document.getElementById('fileDetails');
    const schemaFields = document.getElementById('schemaFields');
    
    // Show schema details
    document.getElementById('columnsUploaded').innerText = `${headers.length} columns out of ${headers.length} were successfully uploaded.`;
    
    schemaFields.innerHTML = headers.map(header => `
        <div>
            <label>${header}</label>
            <select>
                <option value="">None</option>
                <option value="Phone">Phone</option>
                <option value="Date">Date</option>
                <option value="Email">Email</option>
                <option value="Zip Code">Zip Code</option>
                <option value="Name">Name</option>
            </select>
        </div>
    `).join('');

    fileDetails.classList.remove('hidden');
    document.getElementById('analyzeBtn').classList.remove('hidden');

    document.getElementById('analyzeBtn').addEventListener('click', () => analyzeData(rows));
}

// Validation Logic

function isValidPhone(phone) {
    const phoneRegex = /^(\d{3}-\d{3}-\d{4}|\(\d{3}\)\s\d{3}-\d{4}|\d{10})$/;
    return phoneRegex.test(phone);
}

function isValidDate(date) {
    const dateRegex = /^(0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])[\/\-](\d{4})$/; // MM/DD/YYYY or MM-DD-YYYY
    return dateRegex.test(date);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidZip(zip) {
    const zipRegex = /^\d{5}(?:-\d{4})?$/; // 12345 or 12345-6789
    return zipRegex.test(zip);
}

function isValidName(name) {
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name);
}

function analyzeData(rows) {
    const headers = rows[0];
    const schemaSelects = document.querySelectorAll('#schemaFields select');
    const qualitySummary = document.getElementById('qualitySummary');
    let summary = '';

    headers.forEach((header, index) => {
        const columnValues = rows.slice(1).map(row => row[index]);
        const totalValues = columnValues.length;
        const fieldType = schemaSelects[index].value;

        let incorrectValues = 0;

        // Validation based on field type
        columnValues.forEach(value => {
            value = value.trim();
            if (fieldType === "Phone" && !isValidPhone(value)) incorrectValues++;
            else if (fieldType === "Date" && !isValidDate(value)) incorrectValues++;
            else if (fieldType === "Email" && !isValidEmail(value)) incorrectValues++;
            else if (fieldType === "Zip Code" && !isValidZip(value)) incorrectValues++;
            else if (fieldType === "Name" && !isValidName(value)) incorrectValues++;
            else if (!value) incorrectValues++; // For null or empty values
        });

        const qualityScore = ((totalValues - incorrectValues) / totalValues) * 100;
        summary += `${header}: ${qualityScore.toFixed(2)}% quality\n`;
    });

    qualitySummary.textContent = summary;
    document.getElementById('results').classList.remove('hidden');
}
