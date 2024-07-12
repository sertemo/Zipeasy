document.addEventListener('DOMContentLoaded', function () {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileElem');
    const fileList = document.getElementById('file-list');
    const removeAllButton = document.getElementById('clearBtn');
    const message = document.getElementById('error-message');
    const compressButton = document.getElementById('compressBtn');
    const fileSizeIndicator = document.getElementById('file-size-indicator');
    let files = [];
    const maxTotalSize = 10 * 1024 * 1024; // 10 MB

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
    });

    dropArea.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        let dt = e.dataTransfer;
        let droppedFiles = dt.files;
        handleFiles(droppedFiles);
    }

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(filesToHandle) {
        message.style.display = 'none'; // Ocultar el mensaje de error cuando se agregan archivos
        [...filesToHandle].forEach(file => {
            files.push(file);
        });
        updateFileList();
    }

    compressButton.addEventListener('click', function (event) {
        event.preventDefault();
        message.style.display = 'none';

        let totalSize = files.reduce((acc, file) => acc + file.size, 0);
        if (totalSize > maxTotalSize) {
            message.textContent = 'Se ha superado el tamaño máximo permitido.';
            message.style.display = 'block';
            return;
        }

        if (files.length === 0) {
            message.textContent = 'Añade archivos para comprimir.';
            message.style.display = 'block';
            return;
        }

        let formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        fetch('/', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Mala respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            const zipFilename = data.zip_filename;
            const downloadUrl = `/download/${zipFilename}`;
            let a = document.createElement('a');
            a.href = downloadUrl;
            a.download = zipFilename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            files = [];
            updateFileList();
        })
        .catch(error => {
            console.error('Error:', error);
            message.textContent = 'Se ha producido un error al comprimir los archivos.';
            message.style.display = 'block';
        });
    });

    removeAllButton.addEventListener('click', () => {
        files = [];
        updateFileList();
    });

    function updateFileList() {
        fileList.innerHTML = '';
        let totalSize = files.reduce((acc, file) => acc + file.size, 0);
        files.forEach((file, index) => {
            const li = document.createElement('li');
            li.textContent = file.name;

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Eliminar';
            removeButton.addEventListener('click', () => {
                files.splice(index, 1);
                updateFileList();
            });

            li.appendChild(removeButton);
            fileList.appendChild(li);
        });
        removeAllButton.style.display = files.length > 1 ? 'inline-block' : 'none';
        fileSizeIndicator.textContent = `${(totalSize / (1024 * 1024)).toFixed(1)}M / 10M`;
        fileSizeIndicator.style.color = totalSize > maxTotalSize ? 'red' : '#ddd';
    }
});








