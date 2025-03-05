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
	const [ttsAudio, setTtsAudio] = useState<Blob | null>(null);
	const recognitionRef = useRef<typeof SpeechRecognition | null>(null);
	const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
	useEffect(() => {
		const messageHandler = ({ text }: { text: string }) => {
			ttsGenerator(text, TTSLanguages.EN).then((res) => {
				if (res.status) {
					setTtsAudio(res.audio);
					setReceivedMessage(text);
				}
			});
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
		setTranslatedText("");
		setText("");
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

	const ttsGenerator = async (text: string, targetLang: TTSLanguages) => {
		try {
			const res = await axios.post(
				"/api/tts",
				{
					text,
					targetLang,
				},
				{
					responseType: "blob",
				}
			);
			return { status: true, audio: res.data };
		} catch (error) {
			console.log("Error while generating tts:", error);
			return { status: false, error: "Bir hata oluştu" };
		}
	};

	const ttsHandler = () => {
		ttsAudioRef.current?.play();
	};

	const sourceLangHandler = (lang: DeeplLanguages) => {
		if (lang == DeeplLanguages.TR) {
			setSourceLang(DeeplLanguages.TR);
			setTargetLang(DeeplLanguages.EN);
		} else {
			setSourceLang(DeeplLanguages.EN);
			setTargetLang(DeeplLanguages.TR);
		}
	};
	const targetLangHandler = (lang: DeeplLanguages) => {
		if (lang == DeeplLanguages.TR) {
			setTargetLang(DeeplLanguages.TR);
			setSourceLang(DeeplLanguages.EN);
		} else {
			setTargetLang(DeeplLanguages.EN);
			setSourceLang(DeeplLanguages.TR);
		}
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
						sourceLangHandler(val as DeeplLanguages);
					}}
					value={sourceLang}
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
						targetLangHandler(val as DeeplLanguages);
					}}
					value={targetLang}
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
					<Button onClick={ttsHandler}>Sesli Oku</Button>
				</div>
			)}
			{ttsAudio && (
				<div className="hidden">
					<audio
						ref={ttsAudioRef}
						controls
						src={URL.createObjectURL(ttsAudio)}
					/>
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
	EN = "EN",
	TR = "TR",
}
