import os
from gtts import gTTS
from moviepy.editor import *
import requests

# CONFIG
script_text = "Did you know that octopuses have three hearts? Here's why."
output_file = "tiktok_video.mp4"
webhook_url = "https://hooks.zapier.com/hooks/catch/XXXXXXX/YYYYYYY"  # Replace with your Zapier webhook

# Step 1: Generate voiceover
tts = gTTS(script_text)
tts.save("voice.mp3")

# Step 2: Create base video (background + voice)
background = ColorClip(size=(1080, 1920), color=(10, 10, 30), duration=10)
audioclip = AudioFileClip("voice.mp3")
background = background.set_duration(audioclip.duration).set_audio(audioclip)

# Step 3: Add text caption
caption = TextClip(script_text, fontsize=60, color='white', size=(1000, None), method='caption')
caption = caption.set_position(("center", 100)).set_duration(audioclip.duration)

# Combine
final = CompositeVideoClip([background, caption])
final.write_videofile(output_file, fps=24)

# Step 4: Send to Zapier webhook
with open(output_file, 'rb') as f:
    response = requests.post(webhook_url, files={'file': f}, data={'caption': script_text})
    print("Zapier response:", response.text)
