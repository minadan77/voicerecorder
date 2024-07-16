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
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                channelCount: 1,
                sampleRate: 44100,
                sampleSize: 16
            }
        });

        const options = {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 128000
        };

        mediaRecorder = new MediaRecorder(stream, options);
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            recordingBlob = new Blob(audioChunks, { type: 'audio/webm' });
            saveButton.disabled = false;
            updateStatus('Grabación finalizada. Puedes guardarla ahora.');
        };

        audioChunks = [];
        mediaRecorder.start(10); // Captura datos cada 10ms para mayor sensibilidad
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

    const fileName = `grabacion_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
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

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./service-worker.js').then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
