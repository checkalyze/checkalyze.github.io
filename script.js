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
    const schemaContainer = document.getElementById('schemaContainer');
    
    // Calculate total rows
    const totalRows = rows.length - 1; // Exclude header row
    document.getElementById('columnsUploaded').innerText = `Columns Detected: ${headers.length}`;
    
    // Create the table for the first five rows
    const firstFiveRowsHtml = createRowsTable(rows.slice(1, 6), headers); // Skip header row
    
    // Display the first five rows table
    document.getElementById('firstFiveRows').innerHTML = firstFiveRowsHtml;
    document.getElementById('totalRows').innerText = `Rows Uploaded: ${totalRows}`;

    // Set up the schema display
    schemaContainer.innerHTML = headers.map(header => {
        const detectedType = detectFieldType(header);
        return `
            <div class="schema-field">
                <div class="column-name">${header}</div>
                <div class="dropzone ${detectedType ? 'applied' : ''}" data-column="${header}" draggable="true">
                    ${detectedType || 'Drag field type here'}
                </div>
            </div>
        `;
    }).join('');

    fileDetails.classList.remove('hidden');
    document.getElementById('analyzeBtn').classList.remove('hidden');
    setupDragAndDrop();
}

// Function to create the table for the first five rows
function createRowsTable(rows, headers) {
    const tableHeaderHtml = headers.map(header => `<th>${header}</th>`).join('');
    const tableRowsHtml = rows.map(row => {
        const rowHtml = row.map(cell => `<td>${cell}</td>`).join('');
        return `<tr>${rowHtml}</tr>`;
    }).join('');

    return `
        <table>
            <thead>
                <tr>${tableHeaderHtml}</tr>
            </thead>
            <tbody>
                ${tableRowsHtml}
            </tbody>
        </table>
    `;
}


function detectFieldType(header) {
    const headerLower = header.toLowerCase();
    if (headerLower.includes('phone')) return 'Phone';
    if (headerLower.includes('date')) return 'Date';
    if (headerLower.includes('email')) return 'Email';
    if (headerLower.includes('zip')) return 'Zip Code';
    // Replace Name detection with Alphanumeric Only
    return null; // No default type applied
}

function setupDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable-field');
    const dropzones = document.querySelectorAll('.dropzone');

    // Set up draggable fields
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
        });
    });

    // Set up dropzones
    dropzones.forEach(dropzone => {
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            if (dragging) {
                // Set the text and style when a field type is dropped
                dropzone.textContent = dragging.textContent;
                dropzone.classList.remove('dragover');
                dropzone.setAttribute('data-field-type', dragging.dataset.field);
                dropzone.classList.add('applied'); // Add class to indicate it's applied
                dropzone.style.backgroundColor = '#007BFF'; // Set blue background
                dropzone.style.color = '#fff'; // Set white text color
            }
        });
    });

    // Allow dragging out of the dropzone to remove the field type
    dropzones.forEach(dropzone => {
        dropzone.addEventListener('dragstart', (e) => {
            if (dropzone.classList.contains('applied')) {
                dropzone.classList.remove('applied'); // Remove applied class on drag
                dropzone.textContent = 'Drag field type here'; // Reset text
                dropzone.style.backgroundColor = '#e0e0e0'; // Reset background color
                dropzone.style.color = '#000'; // Reset text color
                 // Prevent the default drag image from being shown
                const img = new Image();  // Create a blank image
                img.src = '';  // Empty image
                e.dataTransfer.setDragImage(img, 0, 0);  // Set the blank image as the drag image
            }
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedType = e.dataTransfer.getData('text/plain');
            if (draggedType) {
                // Reset text and attributes when dragged out
                dropzone.textContent = 'Drag field type here'; // Reset text
                dropzone.removeAttribute('data-field-type'); // Remove the field type attribute
                dropzone.style.backgroundColor = '#e0e0e0'; // Set background to gray
                dropzone.style.color = '#000'; // Set text color to black
                dropzone.classList.remove('applied'); // Remove applied class
            }
        });
    });
}

document.getElementById('analyzeBtn').addEventListener('click', () => {
    analyzeData();
});

function analyzeData() {
    const dropzones = document.querySelectorAll('.dropzone');
    const rows = data.split('\n').map(row => row.split(','));
    const headers = rows[0];
    const summaryContainer = document.getElementById('qualitySummary');

    let summaryHtml = '';

    dropzones.forEach((dropzone, index) => {
        const fieldType = dropzone.getAttribute('data-field-type');
        const columnValues = rows.slice(1).map(row => row[index]);
        const { validCount, totalCount } = calculateFieldQuality(fieldType, columnValues);
        const correctPercentage = ((validCount / totalCount) * 100).toFixed(2); // Percentage calculation
        summaryHtml += `<div><strong>${headers[index]}:</strong> ${correctPercentage}% valid</div>`;
    });

    summaryContainer.innerHTML = summaryHtml;
    document.getElementById('results').classList.remove('hidden');
}

// Function to check the validity of different field types
function calculateFieldQuality(fieldType, values) {
    let validCount = 0;
    let totalCount = 0;

    values.forEach(value => {
        if (value === '' || value === null) {
            totalCount++; // Count empty/null values
            return; // Skip to next value
        }
        
        totalCount++; // Count non-empty value

        // Check based on the field type
        switch (fieldType) {
            case 'Phone':
                if (validatePhone(value)) validCount++;
                break;
            case 'Email':
                if (validateEmail(value)) validCount++;
                break;
            case 'Zip Code':
                if (validateZipCode(value)) validCount++;
                break;
            case 'Date':
                if (validateDate(value)) validCount++;
                break;
            case 'Alphanumeric Only': // New validation for Alphanumeric
                if (validateAlphanumeric(value)) validCount++;
                break;
            case 'Numeric Only': // New validation for Numeric
                if (validateNumeric(value)) validCount++;
                break;
        }
    });

    return { validCount, totalCount };
}

// Validation functions
function validatePhone(phone) {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, '')); // Remove non-digit characters
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateZipCode(zip) {
    const zipRegex = /^\d{5}$/;
    return zipRegex.test(zip);
}

function validateDate(date) {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
}

// New validation function for Alphanumeric Only
function validateAlphanumeric(value) {
    const alphanumericRegex = /^[a-zA-Z0-9\s]+$/; // Only letters and numbers
    return alphanumericRegex.test(value);
}

// New validation function for Numeric Only
function validateNumeric(value) {
    const numericRegex = /^[0-9]+$/; // Only numbers
    return numericRegex.test(value);
}
