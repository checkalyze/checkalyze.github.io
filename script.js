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
    
    document.getElementById('columnsUploaded').innerText = `${headers.length} columns uploaded.`;

    schemaContainer.innerHTML = headers.map(header => {
        const detectedType = detectFieldType(header);
        return `
            <div class="schema-field">
                <div class="column-name">${header}</div>
                <div class="dropzone" data-column="${header}">${detectedType || 'Drag field type here'}</div>
            </div>
        `;
    }).join('');

    fileDetails.classList.remove('hidden');
    document.getElementById('analyzeBtn').classList.remove('hidden');
    setupDragAndDrop();
}

function detectFieldType(header) {
    const headerLower = header.toLowerCase();
    if (headerLower.includes('phone')) return 'Phone';
    if (headerLower.includes('date')) return 'Date';
    if (headerLower.includes('email')) return 'Email';
    if (headerLower.includes('zip')) return 'Zip Code';
    if (headerLower.includes('name')) return 'Name';
    return null;
}

function setupDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable-field');
    const dropzones = document.querySelectorAll('.dropzone');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
        });
    });

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
            dropzone.textContent = dragging.textContent;
            dropzone.classList.remove('dragover');
            dropzone.setAttribute('data-field-type', dragging.dataset.field);
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
        const correctPercentage = calculateCorrectPercentage(fieldType, columnValues);
        
        summaryHtml += `<div><strong>${headers[index]}:</strong> ${correctPercentage}% correct</div>`;
    });
    
    summaryContainer.innerHTML = summaryHtml;
    document.getElementById('results').classList.remove('hidden');
}

function calculateCorrectPercentage(fieldType, values) {
    const randomAccuracy = Math.floor(Math.random() * 100); // Mock random accuracy
    return randomAccuracy;
}
