document.addEventListener('DOMContentLoaded', function () {
    const textInput = document.getElementById('text');
    const voiceInput = document.getElementById('voice');
    const voiceSelectorHeader = document.querySelector('#voice-selector .style-selector-header');
    const voiceOptions = document.querySelectorAll('#voice-selector .style-option');
    const stabilitySlider = document.getElementById('stability');
    const stabilityValue = document.getElementById('stability-value');
    const similaritySlider = document.getElementById('similarity');
    const similarityValue = document.getElementById('similarity-value');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const generatedAudio = document.getElementById('generated-audio');
    const audioPlayer = document.getElementById('audio-player');
    const placeholder = document.querySelector('.placeholder');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const charCount = document.getElementById('char-count');
    const voiceInfo = document.getElementById('voice-info');
    const textLength = document.getElementById('text-length');

    let currentAudioData = null;

    // Character counter
    textInput.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = length;
        
        if (length > 2500) {
            charCount.style.color = 'var(--alert-color)';
        } else if (length > 2000) {
            charCount.style.color = '#ffaa00';
        } else {
            charCount.style.color = 'var(--accent-color)';
        }
    });

    // Voice selector functionality
    voiceSelectorHeader.addEventListener('click', function () {
        this.classList.toggle('open');
        this.nextElementSibling.classList.toggle('open');
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function (event) {
        const voiceSelector = event.target.closest('#voice-selector');
        if (!voiceSelector) {
            voiceSelectorHeader.classList.remove('open');
            voiceSelectorHeader.nextElementSibling.classList.remove('open');
        }
    });

    // Handle voice selection
    voiceOptions.forEach(option => {
        option.addEventListener('click', function () {
            // Update active class
            voiceOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');

            // Update header text and hidden input
            const selectedText = this.textContent;
            const selectedValue = this.getAttribute('data-value');

            // Update header content
            voiceSelectorHeader.innerHTML = selectedText + '<span class="icon">▼</span>';

            // Update hidden input value
            voiceInput.value = selectedValue;

            // Close dropdown
            this.parentElement.classList.remove('open');
            voiceSelectorHeader.classList.remove('open');
        });
    });

    // Update slider values
    stabilitySlider.addEventListener('input', function () {
        stabilityValue.textContent = this.value;
    });

    similaritySlider.addEventListener('input', function () {
        similarityValue.textContent = this.value;
    });

    // Functions to handle loading state
    function setLoadingState(isLoading) {
        generateBtn.disabled = isLoading;
        if (isLoading) {
            loadingSpinner.classList.remove('hidden');
            generateBtn.classList.add('disabled');
            placeholder.innerHTML = `
                <i class="fas fa-cog fa-spin"></i>
                <p>Generating your audio, please wait...</p>
                <p class="small-text">(This may take 10-15 seconds)</p>
            `;
            placeholder.classList.add('loading');
            placeholder.classList.remove('hidden');
            audioPlayer.classList.add('hidden');
            downloadBtn.classList.add('hidden');
        } else {
            loadingSpinner.classList.add('hidden');
            generateBtn.classList.remove('disabled');
            placeholder.classList.remove('loading');
        }
    }

    function handleError(errorMessage) {
        console.error("Error:", errorMessage);
        placeholder.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error: ${errorMessage}</p>
        `;
        placeholder.classList.add('error');
        placeholder.classList.remove('hidden');
        audioPlayer.classList.add('hidden');
        downloadBtn.classList.add('hidden');
        setLoadingState(false);
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

        // Set loading state
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
                    stability: parseFloat(stabilitySlider.value) / 100,
                    similarity_boost: parseFloat(similaritySlider.value) / 100
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
                placeholder.classList.add('hidden');
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
});