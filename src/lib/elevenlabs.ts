import { ElevenLabsClient } from 'elevenlabs';
const ELEVENLABS_API_KEY = "sk_f20719d6cfd1403b214f0b487bc05e04cac906a66ee779eb";

const elevenlabs = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

export default elevenlabs;