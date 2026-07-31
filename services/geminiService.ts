import { GoogleGenAI, Type } from '@google/genai';
import type { SubtitleSegment } from '../types';
import { getApiKey } from './apiKeyStore';

const fileToBase64 = async (file: File): Promise<{ base64: string; type: string; name: string }> => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as Base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

  let mimeType = file.type;
  if (!mimeType) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp3': mimeType = 'audio/mp3'; break;
      default: mimeType = 'application/octet-stream';
    }
  }

  return { base64: base64EncodedData, type: mimeType, name: file.name };
};

const subtitleSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      start: {
        type: Type.STRING,
        description: 'The start timestamp of the subtitle segment in HH:MM:SS,ms format.',
      },
      end: {
        type: Type.STRING,
        description: 'The end timestamp of the subtitle segment in HH:MM:SS,ms format.',
      },
      text: {
        type: Type.STRING,
        description: 'The transcribed text. ABSOLUTE LIMIT: 12 words per segment. Split longer sentences into multiple segments.',
      },
    },
    required: ['start', 'end', 'text'],
  },
};

const modelMap: Record<string, string> = {
  'gemini-2.5-flash': 'gemini-2.5-flash',
  'gemini-3.1-flash-lite': 'gemini-3.1-flash-lite',
  'gemini-3.5-flash': 'gemini-3.5-flash',
  'gemini-3.1-pro-preview': 'gemini-3.1-pro-preview',
};

const handleGeminiError = (error: any): never => {
  const errorString = JSON.stringify(error) || '';
  const errorMessage = error.message || '';
  const combinedMessage = `${errorMessage} ${errorString}`.toLowerCase();

  console.error('Gemini API error details:', error);

  if (combinedMessage.includes('api key not valid') || combinedMessage.includes('api_key_invalid')) {
    throw new Error(
      'INVALID API KEY: The Gemini API key you entered was rejected. Double-check it was copied correctly from Google AI Studio (Get API key), then try again.'
    );
  }

  if (combinedMessage.includes('denied access') || combinedMessage.includes('permission_denied') || combinedMessage.includes('403')) {
    throw new Error(
      "ACCESS DENIED (403): Your Google Cloud project tied to this API key doesn't have access to the Gemini API, or has billing/policy issues.\n\n" +
      'RECOVERY:\n' +
      "1. Go to https://aistudio.google.com/\n" +
      "2. Tap 'Get API key' > 'Create API key in a new project'\n" +
      '3. Paste the new key into this app\n' +
      "4. Retry with 'Stable Flash (gemini-2.5-flash)'"
    );
  }

  if (combinedMessage.includes('rate_limit') || combinedMessage.includes('quota') || combinedMessage.includes('exhausted') || combinedMessage.includes('overloaded') || combinedMessage.includes('429')) {
    throw new Error(
      'QUOTA EXHAUSTED: Your Gemini API key has hit its rate limit or quota. Switch to "Stable Flash (gemini-2.5-flash)" for higher limits, or wait a bit and retry.'
    );
  }

  throw error;
};

const buildSystemInstruction = (language: string): string => {
  const isIndo = language === 'Bahasa Indonesia';
  const targetLanguage = isIndo ? 'Bahasa Indonesia' : 'English';

  const grammarRules = isIndo
    ? `- **Connector Words Rule:** NEVER end a line with a preposition or conjunction (e.g., 'dan', 'atau', 'di', 'ke', 'untuk', 'tetapi', 'karena', 'yang').
- **Word Choice Rule:** ALWAYS use "nggak" instead of "enggak" for the word "no/not".`
    : `- **Connector Words Rule:** Avoid ending lines with small prepositions or conjunctions (e.g., 'and', 'but', 'for', 'the', 'a', 'to').`;

  const contextRules = isIndo
    ? `    -   **Language:** Transcribe everything into Bahasa Indonesia.
    -   **Capitalization:** The following words MUST ALWAYS be capitalized: "Pembeli", "Seller", "Buyer", "Penjual", "Affiliate".
    -   **Italicization:** Use HTML italic tags (<i>...</i>) for foreign words (mostly English) that are not common loanwords in Bahasa Indonesia.
    -   **EXCEPTIONS (DO NOT ITALICIZE):** "Shopee", "Shopee Ads", "Seller Centre", "Flash Sale", "Town Hall", "Affiliate Marketing Solution", "Affiliate Marketplace", "Livestream", "Voucher" and any acronyms.`
    : `    -   **Language:** Transcribe everything into English.
    -   **Capitalization:** Capitalize "Shopee", "Seller", "Buyer", "Affiliate", "Seller Centre" appropriately.`;

  return `You are a professional audio transcriptionist. Transcribe the audio from the provided file into timed subtitle segments in ${targetLanguage}.

**CRITICAL RULES:**
1. **ACCURACY:** Exact representation of speech. Timestamps must be perfectly synchronized.
2. **STRICT LINE LENGTH:** Each segment MUST NOT exceed 12 words. If a sentence is longer, split it into multiple segments with precise timestamps. Ideal length: 7-9 words.
${grammarRules}
3. **FORMATTING:**
${contextRules}

**TEMPORAL PRECISION & FORMATTING:**
- DO NOT let timestamps drift or shift.
- Ensure that the start of a segment matches the exact millisecond the first word is spoken.
- Use the audio's internal timeline strictly.
- **CRITICAL**: Use the exact format 'HH:MM:SS,ms' (Hours:Minutes:Seconds,Milliseconds).
- **NEVER MIX UP MINUTES AND SECONDS**. For example, 12 seconds is '00:00:12,000', NOT '00:12:00' (which is 12 minutes). 1 minute 5 seconds is '00:01:05,000'. Double-check every single timestamp to ensure seconds are placed in the seconds column and minutes in the minutes column.`;
};

const getClient = (): GoogleGenAI => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('CONFIG ERROR: VITE_GEMINI_API_KEY is not set for this deployment. Contact whoever manages this app.');
  }
  return new GoogleGenAI({ apiKey });
};

export const generateTranscription = async (
  file: File,
  language: string,
  engineChoice: string = 'gemini-2.5-flash',
  onProgress?: (status: string) => void
): Promise<SubtitleSegment[]> => {
  try {
    if (onProgress) onProgress('Mang Sueb mempersiapkan berkas MP3...');
    const base64File = await fileToBase64(file);
    if (onProgress) onProgress('Mang Sueb menuangkan konsentrasi...');

    const ai = getClient();
    const model = modelMap[engineChoice] || 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: base64File.type, data: base64File.base64 } },
        ],
      },
      config: {
        systemInstruction: buildSystemInstruction(language),
        responseMimeType: 'application/json',
        responseSchema: subtitleSchema,
      },
    });

    const jsonText = response.text || '[]';
    return JSON.parse(jsonText.trim()) as SubtitleSegment[];
  } catch (error: any) {
    return handleGeminiError(error);
  }
};

export const alignSubtitles = async (
  file: File,
  lines: string[],
  language: string,
  engineChoice: string = 'gemini-2.5-flash'
): Promise<SubtitleSegment[]> => {
  try {
    const base64File = await fileToBase64(file);
    const ai = getClient();
    const model = modelMap[engineChoice] || 'gemini-2.5-flash';

    const systemInstruction = `You are an expert subtitle synchronizer. Align the following text blocks to the provided audio precisely.

**CRITICAL:** Output exactly one segment for each input text block. Do not change the text.`;

    const prompt = `Input Text Blocks: ${JSON.stringify(lines)}`;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: base64File.type, data: base64File.base64 } },
        ],
      },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: subtitleSchema,
      },
    });

    const jsonText = response.text || '[]';
    return JSON.parse(jsonText.trim()) as SubtitleSegment[];
  } catch (error: any) {
    return handleGeminiError(error);
  }
};
