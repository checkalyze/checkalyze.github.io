let data = ''; // Declare data in the global scope

document.getElementById('uploadArea').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', handleFile);

function handleFile(event) {
    // Clear old data and summary
    data = ''; // Clear the data variable
    document.getElementById('qualitySummary').innerHTML = ''; // Clear the old summary

    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            data = e.target.result; // Store the loaded data
            processCSV(data);
        };
        reader.readAsText(file);
    }
}
function processCSV(data) {
    // Use regex to split rows while respecting quotes
    const rows = data.split('\n').map(row => {
        const regex = /(?:,|\n)(?=(?:[^"]*"[^"]*")*[^"]*$)/; // Split on commas not inside quotes
        return row.split(regex).map(cell => cell.replace(/^"|"$/g, '').replace(/\\"/g, '"')); // Remove quotes and unescape
    });

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
                    ${detectedType || 'Drag Field Type'}
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
    if (headerLower.includes('name')) return 'Characters Only';
    if (headerLower.includes('number')) return 'Numeric Only';
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
                dropzone.textContent = 'Drag Field Type'; // Reset text
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
                dropzone.textContent = 'Drag Field Type here'; // Reset text
                dropzone.removeAttribute('data-field-type'); // Remove the field type attribute
                dropzone.style.backgroundColor = '#e0e0e0'; // Set background to gray
                dropzone.style.color = '#000'; // Set text color to black
                dropzone.classList.remove('applied'); // Remove applied class
            }
        });
    });
}

document.getElementById('analyzeBtn').addEventListener('click', () => {
    analyzeData(); // Analyze data on each button click
});

let columnQualityData = {};  // Object to store quality data for each column

function analyzeData() {
    const dropzones = document.querySelectorAll('.dropzone');
    const rows = data.split('\n').map(row => row.split(','));
    const headers = rows[0];
    const summaryContainer = document.getElementById('qualitySummary');

    let summaryHtml = '';

    dropzones.forEach((dropzone, index) => {
        const fieldType = dropzone.getAttribute('data-field-type');
        const columnValues = rows.slice(1).map(row => row[index]);
        
        // Call calculateFieldQuality to get valid and invalid rows
        const { validCount, totalCount, invalidRows } = calculateFieldQuality(fieldType, columnValues);
        const correctPercentage = ((validCount / totalCount) * 100).toFixed(2);

        // Store the quality data for this column in the object
        columnQualityData[headers[index]] = {
            validCount: validCount,
            invalidRows: invalidRows,  // Store invalid rows
            totalCount: totalCount,
            correctPercentage: correctPercentage
        };

        // Create a button element within each div with an onclick event
        summaryHtml += `<button class="summary-button" type="button" onclick="showDetail('${headers[index]}', ${correctPercentage})">
                            <strong>${headers[index]}:</strong> ${correctPercentage}% valid
                        </button>`;
    });

    summaryContainer.innerHTML = summaryHtml;
    document.getElementById('results').classList.remove('hidden');
}


function showDetail(header, percentage) {
    const columnData = columnQualityData[header];
    let modalText = `Validity: ${percentage}%\n`;
    
    if (columnData.invalidRows.length > 0) {
        modalText += `Invalid rows: ${columnData.invalidRows.join(', ')}`;
    } else {
        modalText += 'No invalid rows.';
    }

    document.getElementById('modalHeader').innerText = header;
    document.getElementById('modalText').innerText = modalText;
    document.getElementById('myModal').style.display = "block";
}

// Function to close the modal
function closeModal() {
    document.getElementById('myModal').style.display = "none";
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('myModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
function calculateFieldQuality(fieldType, columnValues) {
    let validCount = 0;
    const totalCount = columnValues.length;
    const invalidRows = [];  // Array to store invalid rows

    if (fieldType) {
        columnValues.forEach((value, rowIndex) => {
            if (value !== undefined) { // Check if value is defined
                switch (fieldType) {
                    case 'Characters Only':
                        if (/^[a-zA-Z]+$/.test(value.trim())) {
                            validCount++;
                        } else {
                            invalidRows.push(rowIndex + 1);  // Store row index of invalid rows
                        }
                        break;
                    case 'Numeric Only':
                        if (/^\d+$/.test(value.trim())) {
                            validCount++;
                        } else {
                            invalidRows.push(rowIndex + 1);
                        }
                        break;
                    case 'Phone':
                        if (/^\d{10}$/.test(value.trim())) {
                            validCount++;
                        } else {
                            invalidRows.push(rowIndex + 1);
                        }
                        break;
                    case 'Date':
                        if (!isNaN(Date.parse(value))) {
                            validCount++;
                        } else {
                            invalidRows.push(rowIndex + 1);
                        }
                        break;
                    case 'Email':
                        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
                            validCount++;
                        } else {
                            invalidRows.push(rowIndex + 1);
                        }
                        break;
                    case 'Zip Code':
                        if (/^\d{5}(-\d{4})?$/.test(value.trim())) {
                            validCount++;
                        } else {
                            invalidRows.push(rowIndex + 1);
                        }
                        break;
                    // Add other cases for different field types here
                    default:
                        break;
                }
            }
        });
    } else {
            // If no field type is specified, check for null/undefined values
    validCount = columnValues.filter(value => value !== undefined && value !== null && value.trim() !== '').length;

    invalidRows.push(...columnValues.map((value, rowIndex) => {
        // Check if the value is undefined or empty after trimming
        if (value === undefined || value === null || value.trim() === '') {
            return rowIndex + 1; // Return 1-based row index for invalid rows
        }
        return null; // Valid value, return null
    }).filter(row => row !== null)); // Filter out null values from the invalid row list

    }

    return { validCount, totalCount, invalidRows };
}

