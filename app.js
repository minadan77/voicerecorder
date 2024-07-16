let mediaRecorder;
let audioChunks = [];
let recordingBlob = null;

const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');
const saveButton = document.getElementById('saveButton');
const statusDiv = document.getElementById('status');
const recordingsDiv = document.getElementById('recordings');

recordButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);
saveButton.addEventListener('click', saveRecording);

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            recordingBlob = new Blob(audioChunks, { type: 'audio/wav' });
            saveButton.disabled = false;
            updateStatus('Grabación finalizada. Puedes guardarla ahora.');
        };

        audioChunks = [];
        mediaRecorder.start();
        updateStatus('Grabando...');
        recordButton.disabled = true;
        stopButton.disabled = false;
        saveButton.disabled = true;
    } catch (error) {
        console.error('Error al iniciar la grabación:', error);
        updateStatus('Error al iniciar la grabación. Por favor, verifica los permisos del micrófono.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        recordButton.disabled = false;
        stopButton.disabled = true;
    }
}

function saveRecording() {
    if (!recordingBlob) {
        updateStatus('No hay grabación para guardar.');
        return;
    }

    const fileName = `grabacion_${new Date().toISOString().replace(/[:.]/g, '-')}.wav`;
    const url = URL.createObjectURL(recordingBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);

    const listItem = document.createElement('div');
    listItem.innerHTML = `
        <p>${fileName} 
        <button onclick="playRecording('${url}')" aria-label="Reproducir grabación">▶️</button>
        </p>
    `;
    recordingsDiv.prepend(listItem);

    updateStatus('Grabación guardada como ' + fileName);
    saveButton.disabled = true;
}

function playRecording(url) {
    const audio = new Audio(url);
    audio.play();
}

function updateStatus(message) {
    statusDiv.textContent = message;
}

// Registro del Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('Service Worker registrado', reg))
        .catch(err => console.log('Error al registrar Service Worker', err));
}
