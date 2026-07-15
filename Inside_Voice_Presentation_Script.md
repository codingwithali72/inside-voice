# Inside Voice: Master Presentation Script

*Instructions: This script is designed for your 100-person audience. It is written to be delivered exactly as you click through the application. Pause where indicated, click the UI elements to show the extra information, and let the animations do the heavy lifting.*

---

## 0. Introduction (Home Screen)
**[Action: Start on the Home Page with the pulsing microphone]**

"Good morning, everyone. Thank you for being here.

Right now, as I am speaking to you, your brains are doing something incredibly complex, yet entirely effortless. You are capturing soundwaves traveling through the air, processing their frequencies, recognizing patterns, and instantly turning them into words and meaning. 

But what happens when you talk to Siri, Google Assistant, or ChatGPT? How does a piece of silicon and metal understand human speech? 

Today, I’m not just going to tell you how it works—I’m going to show you. Welcome to **Inside Voice**. Over the next few minutes, we are going to travel inside the computer. We are going to follow a single spoken sentence from a raw physical vibration in the air, through the exact scientific pipeline used today, all the way to recognized text."

**[Action: Click "Start Journey"]**

---

## Stage 1: Capture Voice
"It all begins right here: capturing the voice. When we speak, our vocal cords push the air, creating pressure waves. A microphone captures those physical vibrations and turns them into an electrical signal. 

I’m going to record a quick phrase right now to use as our example."

**[Action: Click 'Start Recording'. Say clearly: "Hello everyone, welcome to the presentation." Click 'Stop Recording']**

"As you can see on the screen, that blue wave was the raw electrical signal of my voice as I was speaking."

**[Action: Click 'Continue Journey']**

---

## Stage 2: Digital Audio
"But here is the first problem: Computers do not understand continuous waves. They only understand 1s and 0s. 

To fix this, the computer rapidly 'samples' the wave. It takes a snapshot of the wave's height usually 16,000 times every single second."

**[Action: Wait for the analog wave to animate into digital dots]**

"Watch the animation. See how the smooth line breaks down into thousands of tiny, discrete digital points? This process is called Pulse Code Modulation, or PCM audio. We have officially digitized my voice."

**[Action: Click 'Continue']**

---

## Stage 3: Time Domain
"Now we have our digital audio, and we can visualize it in what engineers call the **Time Domain**. Watch as my recorded sentence is mapped out."

**[Action: Let the waveform draw itself. Hover over a few peaks with your mouse to show the tooltip]**

"If you look at the graph, the horizontal axis is time, and the vertical axis is amplitude—or loudness. Large spikes mean I was speaking loudly; the flat areas are silence between words. 

This view is incredibly useful."

**[Action: Click 'Why is this useful?']**

"As you can see here, audio engineers use this for podcast editing, monitoring recording volume, and basic signal analysis. But for an AI trying to recognize words? The Time Domain is actually terrible. Time tells us *when* a sound happened, but it doesn't tell us *what* the sound actually is."

**[Action: Click 'Continue']**

---

## Stage 4: Frequency Domain
"To figure out *what* the sound is, we apply a mathematical process called the Fourier Transform to flip our perspective. We stop looking at Time, and we start looking at Pitch. 

Welcome to the **Frequency Domain**."

**[Action: Hover over the tallest peak (the cyan one)]**

"Instead of amplitude over time, we now see amplitude over frequency. The tallest peak you see here is the **Fundamental Frequency**—this is the core pitch of my voice. If I had a deep voice, this peak would be further left; if I had a high voice, it would be further right."

**[Action: Hover over the smaller orange peaks]**

"These smaller peaks are **Harmonics**. Harmonics give my voice its unique timbre. Every vowel you speak—whether it's an 'Ahh' or an 'Eee'—creates a completely distinct pattern of these harmonic peaks. That is how the computer tells words apart."

**[Action: Click 'Why Frequency Domain?']**

"Engineers use this exact view for pitch detection in music, noise cancellation—like filtering out the hum of an air conditioner—and vowel recognition."

**[Action: Click 'Continue']**

---

## Stage 5: Frame Splitting
"But speech is dynamic; it is constantly changing. If we analyze an entire sentence at once, all the frequencies blur together into a mess. 

Instead, the computer slices the audio into tiny, overlapping frames."

**[Action: Let the animation split the waveform and zoom into a 25ms frame]**

"It cuts the audio into windows of about 25 milliseconds each. Why 25 milliseconds? Because it is short enough that the sound of my voice remains mathematically constant, but long enough to extract meaningful frequency data."

**[Action: Click 'Continue']**

---

## Stage 6: STFT (Short-Time Fourier Transform)
"Next, the computer takes each one of those tiny 25-millisecond frames, and applies the Fourier Transform we just talked about. This process is called the Short-Time Fourier Transform.

It asks a simple question of every single frame: *'Exactly which frequencies are present in this tiny slice of time?'* 

Watch the animation. It extracts the frequency data, frame by frame, creating a sequence of spectrums."

**[Action: Wait for the line to connect the Time frame to the Frequency peaks]**

**[Action: Click 'Continue']**

---

## Stage 7: Log-Mel Spectrogram
"When we stitch all those individual frequency frames back together over time, we get this: The **Log-Mel Spectrogram**."

**[Action: Let the spectrogram scroll on screen]**

"This is arguably the most important preprocessing step in all of modern AI speech recognition. We map time on the horizontal axis and frequency on the vertical axis. The color brightness shows you the loudness. 

But notice it says 'Log-Mel'. We actually scale the frequencies mathematically to match human hearing. Humans are much better at hearing differences in low pitches than high pitches, so we warp the image to focus on what matters most. The 'Log' part means we use a logarithmic scale—decibels—to map loudness, exactly how our ears work.

To an AI, this isn't just a graph—it's an image. We have successfully turned sound into a picture."

**[Action: Click 'Learn More' to quickly show the axis breakdown, then click 'Continue']**

---

## Stage 8: AI Model
"Now we feed this image into a deep learning model—specifically, a Transformer Network. 

This neural network doesn't know what English is. But it has been trained on millions of hours of audio. It scans the spectrogram image, recognizing visual patterns that correspond to human phonemes—the building blocks of speech. 

It calculates the mathematical probabilities of which sounds are being spoken at any given millisecond."

**[Action: Click 'Continue']**

---

## Stage 9: Language Understanding
"But the model doesn’t just rely on sound. It relies on context. 

Notice how the words stream in. Sometimes the acoustic model isn't sure if I said the word 'two' (the number), 'to' (the preposition), or 'too' (also). 

But by looking at the surrounding words, the Language Model understands the grammar and the context, correcting itself dynamically to form a perfect sentence."

**[Action: Wait for the text to finish streaming, then click 'See Final Result']**

---

## Stage 10: Final Result & Outro
"And here we are. The final result.

*(Read the final result on screen, e.g., "Hello everyone, welcome to the presentation.")*

From a raw physical vibration in the air, converted to digital dots, mapped to the frequency domain, transformed into a visual spectrogram, and finally decoded by a Transformer AI... we have our final text. 

This exact pipeline is what powers Siri, ChatGPT Voice, medical dictation in hospitals, and the accessibility features we use every day. 

Thank you for joining me on this journey inside the computer. I hope you now have a crystal clear picture of exactly what happens when you speak to a machine."
