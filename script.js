const imageInput = document.getElementById('imageInput');
const securityKeyInput = document.getElementById('securityKeyInput');
const messageInput = document.getElementById('messageInput');
const encodeBtn = document.getElementById('encodeBtn');
const decodeBtn = document.getElementById('decodeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const canvas = document.getElementById('canvas');
const decodedMessage = document.getElementById('decodedMessage');
const functionPopup = document.getElementById('functionPopup');
const selectEncode = document.getElementById('selectEncode');
const selectDecode = document.getElementById('selectDecode');
const imagePreview = document.getElementById('imagePreview');
const errorMessage = document.getElementById('errorMessage');

let mode = "";
const infoButton = document.getElementById('infoButton');
const instructionsPopup = document.getElementById('instructionsPopup');
const closePopup = document.getElementById('closePopup');

// Show Instructions Popup
infoButton.addEventListener('click', () => {
    instructionsPopup.style.display = 'block';
});

// Close Instructions Popup
closePopup.addEventListener('click', () => {
    instructionsPopup.style.display = 'none';
});

// ✅ Show function selection popup when an image is selected
imageInput.addEventListener('change', () => {
    functionPopup.style.display = 'block';
    messageInput.value = "";
    securityKeyInput.value = "";
    decodedMessage.textContent = "";
    errorMessage.textContent = "";
    errorMessage.style.display = "none";

    const file = imageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// ✅ Handle function selection
selectEncode.addEventListener('click', () => {
    mode = "encode";
    functionPopup.style.display = 'none';
    encodeBtn.style.display = 'block';
    decodeBtn.style.display = 'none';
    downloadBtn.style.display = 'none';
    resetBtn.style.display = 'block';
    messageInput.style.display = 'block';
});

selectDecode.addEventListener('click', () => {
    mode = "decode";
    functionPopup.style.display = 'none';
    encodeBtn.style.display = 'none';
    decodeBtn.style.display = 'block';
    downloadBtn.style.display = 'none';
    resetBtn.style.display = 'block';
    messageInput.style.display = 'none';
});

// ✅ **Fixed Encoding Process**
encodeBtn.addEventListener('click', () => {
    if (mode !== "encode") return alert("Please select encoding mode.");

    const message = messageInput.value.trim();
    const key = securityKeyInput.value.trim();
    if (!message || !key) return alert("Enter both a message and security key!");

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = URL.createObjectURL(imageInput.files[0]);

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = new Uint8ClampedArray(imageData.data);

        let fullMessage = key + "---" + message;
        let binaryMessage = [...fullMessage]
            .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
            .join('');
        
        binaryMessage += "00000000"; // Stop indicator

        for (let i = 0; i < binaryMessage.length && i * 4 < data.length; i++) {
            data[i * 4] = (data[i * 4] & ~1) | parseInt(binaryMessage[i], 2);
        }

        imageData.data.set(data);
        ctx.putImageData(imageData, 0, 0);

        downloadBtn.style.display = 'block';
    };
});

// ✅ **Download Encoded Image**
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png', 0.9);
    link.download = 'encoded_image.png';
    link.click();
});

// ✅ **Fully Fixed Decoding Process**
decodeBtn.addEventListener('click', () => {
    if (mode !== "decode") return alert("Please select decoding mode.");

    const key = securityKeyInput.value.trim();
    if (!key) return alert("Please enter a security key!");

    const ctx = canvas.getContext('2d');

    // ✅ Make sure the image is drawn on the canvas before decoding
    const img = new Image();
    img.src = URL.createObjectURL(imageInput.files[0]);

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = new Uint8ClampedArray(imageData.data);

        let binaryMessage = "";
        for (let i = 0; i < data.length; i += 4) {
            binaryMessage += (data[i] & 1).toString();
        }

        const stopIndex = binaryMessage.indexOf("00000000");
        if (stopIndex === -1) {
            errorMessage.textContent = "Invalid encoded image!";
            errorMessage.style.display = "block";
            return;
        }

        // ✅ Ensure we extract the **FULL** message without missing the last character
        binaryMessage = binaryMessage.substring(0, stopIndex + 8);

        let extractedText = binaryMessage.match(/.{8}/g)
            .map(bin => String.fromCharCode(parseInt(bin, 2)))
            .join('');

        // ✅ Split using "---" and handle missing characters
        const separatorIndex = extractedText.indexOf("---");
        if (separatorIndex === -1) {
            errorMessage.textContent = "Invalid encoded image!";
            errorMessage.style.display = "block";
            return;
        }

        const extractedKey = extractedText.substring(0, separatorIndex);
        const secretMessage = extractedText.substring(separatorIndex + 3);

        if (key !== extractedKey) {
            errorMessage.textContent = "Incorrect security key!";
            errorMessage.style.display = "block";
            return;
        }

        decodedMessage.textContent = `Decoded Message: ${secretMessage}`;
    };
});

// ✅ **Reset Button**
resetBtn.addEventListener('click', () => {
    location.reload();
});
