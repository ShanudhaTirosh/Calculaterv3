const canvas = document.getElementById('mathCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;

// API keys
const APPLICATION_KEY = '83784a43-b6e1-4349-98a0-0b423046519a';
const HMAC_KEY = '82015238-95a7-496c-a459-ad50947b4b0d';

// Canvas drawing (handwriting recognition mode)
function startDrawing(e) {
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
}

function draw(e) {
  if (!drawing) return;
  ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
  ctx.stroke();
}

function stopDrawing() {
  drawing = false;
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch events for mobile devices
canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    startDrawing(touch);
});

canvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    draw(touch);
    e.preventDefault(); // Prevent scrolling while drawing
});

canvas.addEventListener('touchend', stopDrawing);

// Function to generate the HMAC signature (you can later move this to server-side for more security)
function generateHmacSignature(message, secret) {
  return CryptoJS.HmacSHA256(message, secret).toString();
}

// Function to send canvas data to MyScript API for math recognition
function recognizeMath() {
  const dataURL = canvas.toDataURL('image/png');
  const timestamp = Math.floor(Date.now() / 1000);
  const hmacSignature = generateHmacSignature(`${APPLICATION_KEY}:${timestamp}`, HMAC_KEY);

  fetch('https://webdemoapi.myscript.com/api/v4.0/iink/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hmacSignature}`,
    },
    body: JSON.stringify({
      "applicationKey": APPLICATION_KEY,
      "hmac": hmacSignature,
      "image": dataURL,
      "format": "text",
    })
  })
  .then(response => response.json())
  .then(data => {
    const recognizedText = data.result;
    document.getElementById('displayHandwriting').value = recognizedText;
  })
  .catch(err => {
    console.error('Error recognizing math:', err);
    alert('Error recognizing math!');
  });
}

document.getElementById('recognizeMath').addEventListener('click', recognizeMath);
document.getElementById('clearCanvas').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Normal calculator logic
let currentInput = '';
let operator = null;
let firstValue = null;

document.querySelectorAll('.btn').forEach(button => {
  button.addEventListener('click', () => {
    const value = button.dataset.value;
    
    if (value === 'C') {
      currentInput = '';
      firstValue = null;
      operator = null;
    } else if (value === '=') {
      if (firstValue !== null && operator !== null) {
        currentInput = eval(`${firstValue}${operator}${currentInput}`);
        firstValue = null;
        operator = null;
      }
    } else if (['+', '-', '*', '/'].includes(value)) {
      if (firstValue === null) {
        firstValue = currentInput;
        currentInput = '';
        operator = value;
      }
    } else {
      currentInput += value;
    }

    document.getElementById('display').value = currentInput;
  });
});

// Mode toggle functionality
document.getElementById('toggleMode').addEventListener('click', () => {
  document.querySelector('.normal-mode').classList.toggle('hidden');
  document.querySelector('.handwriting-mode').classList.toggle('hidden');
  
  const modeText = document.querySelector('.normal-mode').classList.contains('hidden') ? 
                   'Switch to Normal Calculator' : 'Switch to Handwriting';
  
  document.getElementById('toggleMode').textContent = modeText;
});
