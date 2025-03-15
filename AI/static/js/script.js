document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab-button");
    const sections = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            sections.forEach(sec => sec.classList.remove("active"));

            tab.classList.add("active");
            document.getElementById(tab.dataset.tab).classList.add("active");
        });
    });
});

// Function to get selected language
function getSelectedLanguage(id) {
    return document.getElementById(id).value;
}

// Function for audio transcription
document.getElementById("transcribeAudio").addEventListener("click", async () => {
    const file = document.getElementById("audioFile").files[0];
    const language = getSelectedLanguage("audioLanguage");

    if (!file) return alert("Select an audio file.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);

    const response = await fetch("/transcribe/audio", {
        method: "POST",
        body: formData,
    });

    const result = await response.json();
    document.getElementById("audioResult").innerText = result.transcription;
});

// Function for video transcription
document.getElementById("transcribeVideo").addEventListener("click", async () => {
    const file = document.getElementById("videoFile").files[0];
    const language = getSelectedLanguage("videoLanguage");

    if (!file) return alert("Select a video file.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);

    const response = await fetch("/transcribe/video", {
        method: "POST",
        body: formData,
    });

    const result = await response.json();
    document.getElementById("videoResult").innerText = result.transcription;
});

// Function for YouTube transcription
document.getElementById("transcribeYouTube").addEventListener("click", async () => {
    const url = document.getElementById("youtubeLink").value;
    const language = getSelectedLanguage("youtubeLanguage");

    if (!url) return alert("Enter a YouTube URL.");

    const response = await fetch("/transcribe/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, language }),
    });

    const result = await response.json();
    document.getElementById("youtubeResult").innerText = result.transcription;
});

// Text-to-Speech
document.getElementById("convertToSpeech").addEventListener("click", () => {
    const text = document.getElementById("textToSpeech").value;
    const language = getSelectedLanguage("ttsLanguage");

    if (!text) return alert("Enter text.");

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = language;
    window.speechSynthesis.speak(speech);
});

// Translation Feature
async function translateText(inputId, outputId, languageId) {
    const text = document.getElementById(inputId).innerText;
    const targetLanguage = getSelectedLanguage(languageId);

    if (!text) return alert("No text available for translation.");

    const response = await fetch("/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: targetLanguage }),
    });

    const result = await response.json();
    document.getElementById(outputId).innerText = result.translation;
}

// Attach event listeners for translation buttons
document.getElementById("translateAudio").addEventListener("click", () => translateText("audioResult", "audioResult", "audioLanguage"));
document.getElementById("translateVideo").addEventListener("click", () => translateText("videoResult", "videoResult", "videoLanguage"));
document.getElementById("translateYouTube").addEventListener("click", () => translateText("youtubeResult", "youtubeResult", "youtubeLanguage"));

// Real-Time Transcription (WebSocket)
let socket = io.connect("http://localhost:5000");
let mediaRecorder;
let isRecording = false;

document.getElementById("startRealtime").addEventListener("click", async () => {
    const language = getSelectedLanguage("realtimeLanguage");

    if (!navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support audio recording.");
        return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    isRecording = true;

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && isRecording) {
            let reader = new FileReader();
            reader.onloadend = function () {
                let audioBuffer = reader.result;
                let bufferLength = audioBuffer.byteLength;
                if (bufferLength % 2 !== 0) {
                    let adjustedBuffer = new ArrayBuffer(bufferLength + 1);
                    let view = new DataView(adjustedBuffer);
                    new Uint8Array(adjustedBuffer).set(new Uint8Array(audioBuffer));
                    audioBuffer = adjustedBuffer;
                }
                socket.emit("audio_chunk", { audioBuffer, language });
            };
            reader.readAsArrayBuffer(event.data);
        }
    };

    mediaRecorder.start(5000); // Send chunks every 500ms
});

document.getElementById("stopRealtime").addEventListener("click", () => {
    if (mediaRecorder) {
        isRecording = false;
        mediaRecorder.stop();
    }
});

socket.on("transcription", (data) => {
    document.getElementById("realtimeResult").innerText += data.text + " ";
});

socket.on("error", (data) => {
    console.error("Error:", data.message);
});
