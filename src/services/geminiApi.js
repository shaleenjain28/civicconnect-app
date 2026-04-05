import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyCyo31JWOWATeZ74Vv80EhXDb1Pg7GM4aA';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function fileToGenerativePart(dataUrl) {
    const [mimeType, base64Data] = dataUrl.split(';base64,');
    return {
        inlineData: {
            data: base64Data,
            mimeType: mimeType.replace('data:', ''),
        },
    };
}

export const geminiApiService = {
    generateDescriptionFromImage: async (imageDataUrl) => {
        if (!imageDataUrl) {
            return { title: 'No Image Provided', description: 'Please upload an image to generate a complaint.' };
        }

        try {
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-pro-latest',
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                ],
            });

            const imagePart = fileToGenerativePart(imageDataUrl);
            const prompt =
                'Analyze this image and generate a concise complaint title (maximum 7 words) and a detailed description. Format the output as a JSON object with \'title\' and \'description\' keys. Example: { "title": "Pothole on Main Road", "description": "There is a large pothole..." }';

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            try {
                const parsedResult = JSON.parse(text);
                const titleWords = parsedResult.title.split(' ');
                const formattedTitle = titleWords.length > 7 ? `${titleWords.slice(0, 7).join(' ')}...` : parsedResult.title;
                return { title: formattedTitle, description: parsedResult.description };
            } catch (jsonError) {
                console.error('Failed to parse Gemini response as JSON:', text, jsonError);
                return {
                    title: 'AI Generation Error: Check Console',
                    description: `Could not parse AI response. Raw output: ${text}`,
                };
            }
        } catch (error) {
            console.error('Error generating description from image with Gemini:', error);
            return {
                title: 'AI Generation Failed',
                description: 'Could not generate complaint details. Please try again or enter manually.',
            };
        }
    },
    draftOfficialComplaint: async (issue) =>
        new Promise((resolve) =>
            setTimeout(
                () =>
                    resolve(
                        `To,\nThe Commissioner,\nJaipur Municipal Corporation,\n\nSubject: Formal Complaint - "${issue.title}"\n\nRespected Sir/Madam,\n\nThis is to bring to your attention the issue titled "${issue.title}", with ${issue.upvotes} upvotes. Please take action.\n\nSincerely,\nA Concerned Citizen`
                    ),
                1500
            )
        ),
};
