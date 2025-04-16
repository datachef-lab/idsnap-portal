import fetch from "node-fetch";
import { SendMailClient } from "zeptomail";

const interaktApiKey = process.env.INTERAKT_API_KEY!;
const interaktBaseUrl = process.env.INTERAKT_BASE_URL!;

const url = process.env.ZEPTOMAIL_URL!;
const token = `Zoho-enczapikey ${process.env.ZEPTOMAIL_TOKEN!}`;

const client = new SendMailClient({url, token});

export async function sendEmail(to: string, subject: string, body: string) {
    try {
        console.log("url:", url);
        console.log("token:", token);
        const response = await client.sendMail({
            from: {
                address: process.env.ZEPTOMAIL_FROM_EMAIL!,
                name: process.env.ZEPTOMAIL_FROM_NAME!,
            },
            to: [{ email_address: { address: to } }],
            subject,
            htmlbody: body,
        });

        console.log('Response Status:', response);
        console.log('Response Headers:', response.headers.raw());
        // const responseBody = await response.text();
        // console.log('Response Body:', responseBody);
        
    } catch (error) {
        console.error((error as Error).message);
        return { result: false };
    }
}

export const sendWhatsAppMessage = async (to: string, messageArr: string[] = [], templateName = 'logincode') => {
    try {
        // console.log("interaktApiKey:", interaktApiKey);
        // console.log("interaktBaseUrl:", interaktBaseUrl);
        // console.log("url:", url);
        // console.log("token:", token);

        const requestBody = {
            countryCode: '+91',
            phoneNumber: to,
            type: 'Template',
            template: {
                name: templateName,
                languageCode: 'en',
                headerValues: ['Alert'],
                bodyValues: messageArr,
            },
            data: {
                message: '',
            },
        };
        // 

        // console.log("sending wa request", interaktBaseUrl)
        const response = await fetch(interaktBaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${interaktApiKey}`,
            },
            body: JSON.stringify(requestBody)
        });

        // console.log('Response Status:', response);
        // console.log('Response Headers:', response.headers.raw());
        // const responseBody = await response.text();
        // console.log('Response Body:', responseBody);
        if (!response.ok) {
            const errorResponse = await response.json(); // Log the error response
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${JSON.stringify(errorResponse)}`);
        }

        const data = await response.json()
        console.log("wa data:", data)

        return data;

    } catch (error) {
        console.error((error as Error).message);
        return { result: false };
    }
}