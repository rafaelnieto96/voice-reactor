document.addEventListener('DOMContentLoaded', function () {
    const textInput = document.getElementById('text');
    const voiceInput = document.getElementById('voice');
    const voiceSelector = document.getElementById('voice-selector');
    const selectTrigger = voiceSelector.querySelector('.select-trigger');
    const selectOptions = voiceSelector.querySelector('.select-options');
    const selectedOption = voiceSelector.querySelector('.selected-option');
    const options = voiceSelector.querySelectorAll('.option');
    
    const speedSlider = document.getElementById('speed');
    const speedValue = document.getElementById('speed-value');
    const claritySlider = document.getElementById('clarity');
    const clarityValue = document.getElementById('clarity-value');
    
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const generatedAudio = document.getElementById('generated-audio');
    const audioPlayer = document.getElementById('audio-player');
    const audioPlaceholder = document.getElementById('audio-placeholder');
    
    const charCount = document.getElementById('char-count');
    const voiceInfo = document.getElementById('voice-info');
    const textLength = document.getElementById('text-length');

    let currentAudioData = null;

    // Character counter
    textInput.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = length;
        
        if (length > 2500) {
            charCount.style.color = '#ff5e5e';
        } else if (length > 2000) {
            charCount.style.color = '#f4b942';
        } else {
            charCount.style.color = '#f4b942';
        }
    });

    // Custom select functionality
    selectTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('open');
        selectOptions.classList.toggle('open');
    });

    // Close select when clicking outside
    document.addEventListener('click', function() {
        selectTrigger.classList.remove('open');
        selectOptions.classList.remove('open');
    });

    // Handle option selection
    options.forEach(option => {
        option.addEventListener('click', function() {
            // Remove previous selection
            options.forEach(opt => opt.classList.remove('selected'));
            
            // Select current option
            this.classList.add('selected');
            
            // Update display and hidden input
            const value = this.getAttribute('data-value');
            const text = this.textContent.trim();
            
            selectedOption.textContent = text;
            voiceInput.value = value;
            
            // Close dropdown
            selectTrigger.classList.remove('open');
            selectOptions.classList.remove('open');
        });
    });

    // Update slider values
    speedSlider.addEventListener('input', function () {
        speedValue.textContent = this.value;
    });

    claritySlider.addEventListener('input', function () {
        clarityValue.textContent = this.value;
    });

    // Loading state management
    function setLoadingState(isLoading) {
        const btnText = generateBtn.querySelector('.btn-text');
        const loadingDots = generateBtn.querySelector('.loading-dots');
        
        generateBtn.disabled = isLoading;
        
        if (isLoading) {
            btnText.classList.add('hidden');
            loadingDots.classList.remove('hidden');
            
            audioPlaceholder.classList.add('loading');
            audioPlaceholder.innerHTML = `
                <div class="sound-waves">
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                </div>
                <p>Generating your audio...</p>
                <small>This may take 10-15 seconds</small>
            `;
            
            audioPlayer.classList.add('hidden');
            downloadBtn.classList.add('hidden');
        } else {
            btnText.classList.remove('hidden');
            loadingDots.classList.add('hidden');
            audioPlaceholder.classList.remove('loading');
        }
    }

    function handleError(errorMessage) {
        console.error("Error:", errorMessage);
        
        audioPlaceholder.classList.add('error');
        audioPlaceholder.innerHTML = `
            <div class="sound-waves">
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
            </div>
            <p>Error: ${errorMessage}</p>
            <small>Please try again</small>
        `;
        
        audioPlayer.classList.add('hidden');
        downloadBtn.classList.add('hidden');
        setLoadingState(false);
    }

    function resetPlaceholder() {
        audioPlaceholder.classList.remove('loading', 'error');
        audioPlaceholder.innerHTML = `
            <div class="sound-waves">
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
            </div>
            <p>Your audio will appear here</p>
            <small>Enter text and generate to create speech</small>
        `;
    }

    // Generate audio
    generateBtn.addEventListener('click', async function () {
        const text = textInput.value.trim();
        
        if (!text) {
            handleError('Please enter some text to convert to speech');
            return;
        }

        if (text.length > 2500) {
            handleError('Text is too long. Maximum 2500 characters allowed');
            return;
        }

        setLoadingState(true);

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    voice: voiceInput.value,
                    speed: parseFloat(speedSlider.value) / 100,
                    clarity: parseFloat(claritySlider.value) / 100
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Set up audio
                generatedAudio.src = data.audio_data;
                currentAudioData = data.audio_data;
                
                // Update info
                voiceInfo.textContent = data.voice_name;
                textLength.textContent = text.length;
                
                // Show audio player
                audioPlaceholder.classList.add('hidden');
                audioPlayer.classList.remove('hidden');
                downloadBtn.classList.remove('hidden');
                setLoadingState(false);

            } else {
                throw new Error(data.error || 'Failed to generate audio');
            }
        } catch (error) {
            handleError(error.message);
        }
    });

    // Download audio
    downloadBtn.addEventListener('click', async function () {
        if (!currentAudioData) {
            alert('No audio to download. Please generate audio first.');
            return;
        }

        try {
            const response = await fetch('/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audio_data: currentAudioData
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'voice-reactor-audio.mp3';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                throw new Error('Failed to download audio');
            }
        } catch (error) {
            alert('Failed to download audio: ' + error.message);
        }
    });

    // Reset placeholder when audio ends
    generatedAudio.addEventListener('ended', function() {
        // Optional: Could reset to placeholder after audio ends
    });
});