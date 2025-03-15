import streamlit as st
import whisper
from deepgram import Deepgram
import yt_dlp as youtube_dl
from gtts import gTTS
import os
import subprocess
from libretranslatepy import LibreTranslateAPI

# Load Whisper Model
model = whisper.load_model("base")

# Deepgram API Key
DEEPGRAM_API_KEY = "c6405ba98eef90bdc74edd6b1ff9a03fb3752373"
dg_client = Deepgram(DEEPGRAM_API_KEY)

# LibreTranslate API
lt = LibreTranslateAPI("https://libretranslate.de")

st.title("🎤 AuraSpeak")
st.write("**Seamless AI-powered speech system**")

# Tab Navigation
tabs = ["🎧 Audio to Text", "📹 Video to Text", "🎬 YouTube to Text", "🔊 Text to Speech", "🌍 Translate Text"]
selected_tab = st.sidebar.radio("Choose a feature", tabs)

# Audio Transcription
if selected_tab == "🎧 Audio to Text":
    uploaded_file = st.file_uploader("Upload Audio File", type=["wav", "mp3", "m4a"])
    target_lang = st.selectbox("Translate To", ["original", "en", "ur", "fr", "es"], index=0)
    if st.button("Transcribe") and uploaded_file:
        result = model.transcribe(uploaded_file)
        text = result["text"]
        if target_lang != "original":
            text = lt.translate(text, "auto", target_lang)
        st.text_area("Transcription", text, height=200)

# Video Transcription
elif selected_tab == "📹 Video to Text":
    uploaded_video = st.file_uploader("Upload Video File", type=["mp4", "mkv", "avi"])
    target_lang = st.selectbox("Translate To", ["original", "en", "ur", "fr", "es"], index=0)
    if st.button("Transcribe") and uploaded_video:
        audio_path = "temp_audio.wav"
        subprocess.run(["ffmpeg", "-i", uploaded_video.name, "-q:a", "0", "-map", "a", audio_path], check=True)
        result = model.transcribe(audio_path)
        os.remove(audio_path)
        text = result["text"]
        if target_lang != "original":
            text = lt.translate(text, "auto", target_lang)
        st.text_area("Transcription", text, height=200)

# YouTube Transcription
elif selected_tab == "🎬 YouTube to Text":
    youtube_url = st.text_input("Enter YouTube URL")
    target_lang = st.selectbox("Translate To", ["original", "en", "ur", "fr", "es"], index=0)
    if st.button("Transcribe") and youtube_url:
        ydl_opts = {"format": "bestaudio/best", "postprocessors": [{"key": "FFmpegExtractAudio", "preferredcodec": "wav"}], "outtmpl": "temp/%(id)s.%(ext)s"}
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=True)
            audio_path = f"temp/{info['id']}.wav"
        result = model.transcribe(audio_path)
        os.remove(audio_path)
        text = result["text"]
        if target_lang != "original":
            text = lt.translate(text, "auto", target_lang)
        st.text_area("Transcription", text, height=200)

# Text to Speech
elif selected_tab == "🔊 Text to Speech":
    input_text = st.text_area("Enter Text")
    lang = st.selectbox("Select Language for Speech", ["en", "ur", "fr", "es"], index=0)
    target_lang = st.selectbox("Translate To Before Speech", ["original", "en", "ur", "fr", "es"], index=0)
    if st.button("Convert") and input_text:
        if target_lang != "original":
            input_text = lt.translate(input_text, "auto", target_lang)
        tts = gTTS(input_text, lang=lang)
        audio_path = "temp_tts.mp3"
        tts.save(audio_path)
        st.audio(audio_path)

# Text Translation
elif selected_tab == "🌍 Translate Text":
    input_text = st.text_area("Enter Text")
    source_lang = st.selectbox("Source Language", ["auto", "en", "ur", "fr", "es"], index=0)
    target_lang = st.selectbox("Target Language", ["en", "ur", "fr", "es"], index=0)
    if st.button("Translate") and input_text:
        translated_text = lt.translate(input_text, source_lang, target_lang)
        st.text_area("Translated Text", translated_text, height=200)

st.sidebar.write("✨ Powered by Whisper AI & LibreTranslate")
