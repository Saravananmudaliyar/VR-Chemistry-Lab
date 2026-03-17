import asyncio
import pyttsx3
import speech_recognition as sr
import threading
import logging
from typing import Optional
import io
import wave

logger = logging.getLogger(__name__)

class VoiceAssistant:
    def __init__(self):
        self.tts_engine = pyttsx3.init()
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
        # Configure TTS
        voices = self.tts_engine.getProperty('voices')
        self.tts_engine.setProperty('voice', voices[0].id)  # Female voice if available
        self.tts_engine.setProperty('rate', 180)
        
        # Calibrate microphone
        with self.microphone as source:
            self.recognizer.adjust_for_ambient_noise(source)
    
    async def speak(self, text: str):
        """Speak text asynchronously"""
        def _speak():
            self.tts_engine.say(text)
            self.tts_engine.runAndWait()
        
        # Run TTS in separate thread
        threading.Thread(target=_speak, daemon=True).start()
    
    async def listen(self, timeout: float = 5.0) -> Optional[str]:
        """Listen for speech and return text"""
        try:
            with self.microphone as source:
                audio = self.recognizer.listen(source, timeout=timeout)
            
            text = self.recognizer.recognize_google(audio)
            logger.info(f"Speech recognized: {text}")
            return text
            
        except sr.UnknownValueError:
            logger.debug("Speech not understood")
            return None
        except sr.RequestError as e:
            logger.error(f"Speech recognition error: {str(e)}")
            return None
        except sr.WaitTimeoutError:
            return None
    
    def stop(self):
        """Stop voice assistant"""
        self.tts_engine.stop()