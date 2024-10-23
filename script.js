let data = ''; // Declare data in the global scope

document.getElementById('uploadArea').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', handleFile);

function handleFile(event) {
    document.getElementById('qualitySummary').innerHTML = ''; // Clear the old summary

    const fileInput = document.getElementById('fileInput'); // Update with your file input ID

    // Create a new file input element to trigger change
    const newFileInput = document.createElement('input');
    newFileInput.type = 'file';
    newFileInput.id = 'fileInput';
    newFileInput.addEventListener('change', handleFile); // Re-attach the event listener

    // Replace the old file input with the new one
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
    
  
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            data = e.target.result; // Store the loaded data
            processCSV(data);
        };
        reader.readAsText(file);
    }
    document.getElementById('analyzeBtn').classList.remove('hidden');
    document.getElementById('analyzeBtn').disabled = false; // Enable the button again
    document.getElementById('uploadMessage').classList.add('hidden'); // Hide upload message
    document.getElementById('results').classList.add('hidden'); // Hide upload message
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
    document.getElementById('columnsUploaded').innerText = `Schema Fields Detected: ${headers.length}`;

    // Create the table for the first five rows
    const firstThreeRowsHtml = createRowsTable(rows.slice(1, 4), headers); // Skip header row

    // Display the first three rows table
    document.getElementById('firstThreeRows').innerHTML = firstThreeRowsHtml;
    document.getElementById('totalRows').innerText = `Rows Uploaded: ${totalRows}`;

    // Set up the schema display
    schemaContainer.innerHTML = headers.map(header => {
        const detectedType = detectFieldType(header);
      
        return `
            <div class="schema-field">
                <div class="column-name">${header}</div>
                <div class="dropzone ${detectedType ? 'applied' : ''}" data-column="${header}" draggable="true" data-field-type="${detectedType || ''}">
                    ${detectedType || 'Drag Field Type'}
                </div>
            </div>
        `;
    }).join('');

    fileDetails.classList.remove('hidden');
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
                dropzone.removeAttribute('data-field-type'); // Remove the field type attribute
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
    // Show the upload message
    document.getElementById('analyzeBtn').disabled = true;
  document.getElementById('uploadMessage').classList.remove('hidden');
});

let columnQualityData = {};  // Object to store quality data for each column

function analyzeData() {
    //let columnQualityData = {};  // Object to store quality data for each column
    const dropzones = document.querySelectorAll('.dropzone');
    const rows = data.split('\n').map(row => row.split(','));
    const headers = rows[0];
    const summaryContainer = document.getElementById('qualitySummary');
    let summaryHtml = '';

    dropzones.forEach((dropzone, index) => {
        const fieldType = dropzone.getAttribute('data-field-type');
        const columnValues = rows.slice(1).map(row => row[index]);
        
        // Check if columnValues are available
        if (columnValues.length === 0) return; // Skip if no values

        // Pass all rows to calculateFieldQuality to get valid and invalid rows
        const { validCount, totalCount, invalidRows } = calculateFieldQuality(fieldType, columnValues, rows);
        
        // Check for total count to avoid division by zero
        const correctPercentage = totalCount > 0 ? ((validCount / totalCount) * 100).toFixed(2) : 0;

        // Store the quality data for this column in the object
        columnQualityData[headers[index]] = {
            validCount: validCount,
            invalidRows: invalidRows,  // Store invalid rows (index + data)
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
    
    // Create a scrollable table
    let tableHtml = `
        <div class="table-container" style="width: 100%; overflow-x: auto;">
            <table border="1" style="width: 100%; border-collapse: collapse;">
                <tr>
                    <th>Row Number</th>
    `;

    // Add column headers from the main dataset
    const headers = Object.keys(columnQualityData); // Assuming all headers are keys in columnQualityData
    headers.forEach(colHeader => {
        tableHtml += `<th>${colHeader}</th>`;
    });
    tableHtml += '</tr>';
    
    if (columnData.invalidRows.length > 0) {
        columnData.invalidRows.forEach(rowInfo => {
            tableHtml += '<tr>';
            tableHtml += `<td>${rowInfo.rowIndex}</td>`; // Add the row number
            
            rowInfo.rowData.forEach(data => {
                tableHtml += `<td>${data !== undefined && data !== null ? data : ''}</td>`; // Show empty if data is null or undefined
            });
            tableHtml += '</tr>';
        });
    } else {
        modalText += 'No invalid rows.';
    }

    tableHtml += '</table></div>'; // Close the div container
    
    document.getElementById('modalHeader').innerText = header;
    document.getElementById('modalText').innerHTML = modalText + tableHtml; // Use innerHTML to include the table
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

function calculateFieldQuality(fieldType, columnValues, allRows) {
    const totalCount = columnValues.length;
    const invalidRows = []; // Array to store invalid row data (index + full row)
    let validCount = 0;

    columnValues.forEach((value, rowIndex) => {
        let isValid = true; // Assume valid until proven otherwise

        // Check for null or undefined values first
        if (value === null || value === undefined || value.trim() === '') {
            isValid = false; // Null, undefined, or empty values are invalid
        } else if (fieldType) {
            // Validate based on the specified field type
            switch (fieldType) {
                case 'Characters Only':
                    isValid = /^[A-Za-z\s,'-]+$/.test(value.trim());
                    break;
                case 'Numeric Only':
                    isValid = /^\d+$/.test(value.trim());
                    break;
                case 'Phone':
                    isValid = /^\d{10}$/.test(value.trim());
                    break;
                case 'Date':
                    isValid = !isNaN(Date.parse(value));
                    break;
                case 'Email':
                    isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
                    break;
                case 'Zip Code':
                    isValid = /^\d{5}(-\d{4})?$/.test(value.trim());
                    break;
                // Add other cases for different field types here
                default:
                    isValid = false; // If an unrecognized field type is provided, consider it invalid
                    break;
            }
        }

        // Push invalid rows if the value is invalid (either null or failed field type check)
        if (!isValid) {
            invalidRows.push({ rowIndex: rowIndex + 1, rowData: allRows[rowIndex + 1] }); // Store row index + row data
        } else {
            validCount++; // Count valid entries
        }
    });

    return { validCount, totalCount, invalidRows };
}
