import elevenlabs from "@/lib/elevenlabs";
import axios from "axios";
import * as deepl from "deepl-node";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	const { text, targetLang } = await req.json();

	const voiceId = targetLang === "EN" ? "JBFqnCBsd6RMkjVDRZzb" : "IuRRIAcbQK5AQk1XevPj";

	const audioStream = await elevenlabs.textToSpeech.convertAsStream(voiceId, {
		model_id: "eleven_multilingual_v2",
		text,
		output_format: "mp3_44100_128",
	});
	const chunks: Buffer[] = [];
	for await (const chunk of audioStream) {
		chunks.push(chunk);
	}
	const content = Buffer.concat(chunks);
	// const ttsReq = await axios.post(
	// 	`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
	// 	{
	// 		model_id: "eleven_multilingual_v2",
	// 		text,
	// 	},
	// 	{
	// 		headers: {
	// 			"xi-api-key": "sk_f20719d6cfd1403b214f0b487bc05e04cac906a66ee779eb",
	// 			"Content-Type": "application/json",
	// 		},
	// 	}
	// );
	// const content = await ttsReq.data;

	return new Response(content, {
		headers: {
			"Content-Type": "audio/mpeg",
		},
	});
}
