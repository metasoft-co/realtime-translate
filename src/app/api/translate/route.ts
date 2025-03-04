import * as deepl from "deepl-node";
import { NextRequest, NextResponse } from "next/server";

const authKey = "ffb6334a-8e05-47bc-9c9b-22b3fb217457:fx";
const translator = new deepl.Translator(authKey);

export async function POST(req: NextRequest) {
	const { text, targetLang } = await req.json();

	const result = await translator.translateText(text, null, targetLang) as deepl.TextResult;
	console.log(result.text);
	return NextResponse.json({ text: result.text });
}
