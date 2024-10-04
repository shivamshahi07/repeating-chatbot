"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, MessageCirclePlus, Mic, MicOff} from "lucide-react";

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [messages, setMessages] = useState<Array<{ text: string; sender: string }>>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;

      if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
        const SpeechRecognitionConstructor = (window.SpeechRecognition || window.webkitSpeechRecognition) as new () => SpeechRecognition;
        recognitionRef.current = new SpeechRecognitionConstructor();
        
        if (recognitionRef.current) {
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;

          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            setTranscript(transcript);
          };

          recognitionRef.current.onend = () => {
            setIsListening(false);
          };
        }
      }

      const loadVoices = () => {
        const availableVoices = synthRef.current?.getVoices() || [];
        setVoices(availableVoices);
        if (availableVoices.length > 0 && !selectedVoice) {
          setSelectedVoice(availableVoices[0]);
        }
      };

      loadVoices();
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    } else {
      console.error("Speech recognition not supported");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (transcript.trim()) {
        addMessage(transcript, "user");
        speak(transcript);
      }
    }
  };

  const speak = (text: string) => {
    if (synthRef.current && selectedVoice) {
      // Cancel any ongoing speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      
      utterance.onend = () => {
        console.log("Speech finished");
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
      };

      synthRef.current.speak(utterance);
      addMessage(text, "bot");
    } else {
      console.error("Speech synthesis not supported or no voice selected");
      if (!synthRef.current) {
        console.error("synthRef.current is null");
      }
      if (!selectedVoice) {
        console.error("No voice selected");
      }
    }
  };

  const addMessage = (text: string, sender: string) => {
    setMessages((prevMessages) => [...prevMessages, { text, sender }]);
    setTranscript("");
  };

  const handleVoiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const voice = voices.find((v) => v.name === event.target.value);
    setSelectedVoice(voice || null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-purple-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <h1 className="text-2xl font-bold p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageCirclePlus />
            Voice-Enabled Chatbot
          </span>
          <Bot className="text-white" />
        </h1>
        <div className="p-4">
          <div className="mb-4">
            <label
              htmlFor="voice-select"
              className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"
            >
              Select Voice:
            </label>
            <select
              id="voice-select"
              className="w-full p-2 text-gray-700 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={selectedVoice?.name || ""}
              onChange={handleVoiceChange}
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>
          <div
            ref={chatContainerRef}
            className="h-80 overflow-y-auto mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-3 p-3 rounded-lg max-w-[80%] ${
                  message.sender === "user"
                    ? "ml-auto bg-blue-500 text-white"
                    : "mr-auto bg-gray-200 text-gray-800"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`flex-1 py-2 px-4 rounded-full ${
                isListening
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              } text-white font-bold transition-all duration-200 flex items-center justify-center`}
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? (
                <>
                  <MicOff className="mr-2" /> Stop
                </>
              ) : (
                <>
                  <Mic className="mr-2" /> Start
                </>
              )}
            </button>
            
          </div>
          {transcript && (
            <p className="mt-2 text-sm text-gray-600 italic">Listening: {transcript}</p>
          )}
        </div>
      </div>
    </main>
  );
}