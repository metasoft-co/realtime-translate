import elevenlabs from "@/lib/elevenlabs";
import { NextRequest } from "next/server";

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

	return new Response(content, {
		headers: {
			"Content-Type": "audio/mpeg",
		},
	});
}
