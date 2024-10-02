// public/script.js
const startRecognition = document.getElementById('start-recognition');
const transcript = document.getElementById('transcript');
let recognition;

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = function(event) {
    const speechResult = event.results[0][0].transcript;
    transcript.textContent = speechResult;
    sendCommandToBackend(speechResult); // Send transcription to backend for AI processing
    startRecognition.disabled = false; // Re-enable the button after processing
  };

  recognition.onerror = function(event) {
    console.error(event.error);
    startRecognition.disabled = false; // Re-enable the button if there's an error
  };

  recognition.onend = function() {
    startRecognition.disabled = false; // Re-enable the button when recognition ends
  };
}

startRecognition.addEventListener('click', () => {
  if (recognition) {
    startRecognition.disabled = true; // Disable the button while recognizing
    recognition.start();
  }
});

function sendCommandToBackend(command) {
  fetch('/generate-website', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command }),
  })
  .then(response => response.json())
  .then(data => {
    console.log('Website generated:', data);
    // Show a link to preview the website
    if (data.previewLink) {
      transcript.innerHTML += `<br>Preview your website at: <a href="${data.previewLink}">${data.previewLink}</a>`;
    }
  });
}
