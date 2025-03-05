"use client";
import { socket } from "@/socket";
import axios from "axios";
import { useState, useRef, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";

declare global {
	interface Window {
		SpeechRecognition: typeof SpeechRecognition;
		webkitSpeechRecognition: typeof SpeechRecognition;
	}
	let SpeechRecognition: any;
	let webkitSpeechRecognition: any;
}

export default function SpeechToText() {
	const [text, setText] = useState("");
	const [translatedText, setTranslatedText] = useState("");
	const [isListening, setIsListening] = useState(false);
	const [sourceLang, setSourceLang] = useState<DeeplLanguages>(DeeplLanguages.TR);
	const [targetLang, setTargetLang] = useState<DeeplLanguages>(DeeplLanguages.EN);
	const [receivedMessage, setReceivedMessage] = useState<string>("");

	const recognitionRef = useRef<typeof SpeechRecognition | null>(null);

	useEffect(() => {
		const messageHandler = ({ text }: { text: string }) => {
			setReceivedMessage(text);
		};

		socket.on("message", messageHandler);

		return () => {
			socket.off("message", messageHandler); // Cleanup listener
		};
	}, [receivedMessage]);

	const startListening = async () => {
		if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
			toast.error("Tarayıcınız ses dinleme özelliğini desteklemiyor");
			return;
		}
		if (!sourceLang && !targetLang) {
			toast.error("Konuşulan ve hedef dili seçmelisiniz");
			return;
		}
		let transcript = "";
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		const recognition = new SpeechRecognition();
		recognitionRef.current = recognition;

		recognition.lang = sourceLang; // Change language if needed
		recognition.continuous = true; // Keep listening
		recognition.interimResults = true; // Get real-time results

		recognition.onstart = () => setIsListening(true);
		recognition.onresult = async (event: any) => {
			let finalTranscript = "";
			for (let i = 0; i < event.results.length; i++) {
				finalTranscript += event.results[i][0].transcript + " ";
			}
			setText(finalTranscript);
			transcript = finalTranscript;
			console.log(finalTranscript);
		};

		recognition.onerror = (event: any) => {
			console.error("Speech recognition error:", event.error);
		};

		recognition.onend = async () => {
			if (isListening) {
				recognition.start();
			} else {
				setIsListening(false);
				const translatedText = await translate(transcript, targetLang!);
				if (translatedText.status) {
					console.log("Translated text: socket emit", translatedText.text);
					setTranslatedText(translatedText.text);
					socket.emit("message", { text: translatedText.text, targetLang });
				}
			}
		};

		recognition.start();
	};

	const translate = async (text: string, targetLang: DeeplLanguages) => {
		try {
			const res = await axios.post("/api/translate", {
				text,
				targetLang,
			});
			return { status: true, text: res.data.text };
		} catch (error) {
			console.log("Error while translating:", error);
			return { status: false, error: "Bir hata oluştu" };
		}
	};

	const stopListening = () => {
		if (recognitionRef.current) {
			recognitionRef.current.stop();
			setIsListening(false);
		}
	};

	const ttsHandler = ({ targetLang }: { targetLang: DeeplLanguages }) => {
		const voicesList = window.speechSynthesis.getVoices();
		const msg = new SpeechSynthesisUtterance();
		const ttsLang = targetLang === DeeplLanguages.TR ? TTSLanguages.TR : TTSLanguages.EN;
		msg.text = receivedMessage;
		msg.lang = ttsLang;
		msg.voice = voicesList.find((voice) => voice.lang === ttsLang) || null;
		window.speechSynthesis.speak(msg);
	};

	return (
		<div className="w-full min-h-screen flex flex-col items-center py-20 gap-5">
			<Toaster
				position="top-center"
				reverseOrder={false}
			/>
			{/* KONUŞULAN DİL */}
			<div>
				<Label className="mb-2">KONUŞULAN DİL:</Label>
				<Select
					onValueChange={(val) => {
						setSourceLang(val as DeeplLanguages);
					}}
					defaultValue={DeeplLanguages.TR}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Konuşulan Dil" />
					</SelectTrigger>
					<SelectContent className="bg-black">
						{Object.entries(deeplLanguages).map(([code, name]) => (
							<SelectItem
								value={code}
								key={code}>
								{name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			{/* HEDEF DİL */}
			<div>
				<Label className="mb-2">HEDEF Dil:</Label>
				<Select
					onValueChange={(val) => {
						setTargetLang(val as DeeplLanguages);
					}}
					defaultValue={DeeplLanguages.EN}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Konuşulan Dil" />
					</SelectTrigger>
					<SelectContent className="bg-black">
						{Object.entries(deeplLanguages).map(([code, name]) => (
							<SelectItem
								value={code}
								key={code}>
								{name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<Button onClick={isListening ? stopListening : startListening}>
				{isListening ? "Dinlemeyi durdur" : "Dinlemeyi başlat"}
			</Button>
			{isListening && <div className="-z-10">Transkript: {text}</div>}
			{translatedText && <div className="-z-10">Çeviri: {translatedText}</div>}
			{receivedMessage && (
				<div>
					<Button onClick={() => ttsHandler({ targetLang })}>Sesli Oku</Button>
				</div>
			)}
		</div>
	);
}

enum DeeplLanguages {
	EN = "en-US",
	TR = "TR",
}

const deeplLanguages = {
	TR: "Türkçe",
	"en-US": "İngilizce",
};

enum TTSLanguages {
	EN = "en-US",
	TR = "tr-TR",
}