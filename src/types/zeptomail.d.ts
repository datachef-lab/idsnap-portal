declare module 'zeptomail' {
    interface MailOptions {
        from: {
            address: string;
            name?: string;
        };
        to: Array<{
            email_address: {
                address: string;
                name?: string;
            };
        }>;
        subject: string;
        htmlbody?: string;
        textbody?: string;
    }

    interface MailResponse {
        status: string;
        data?: Record<string, unknown>;
        error?: {
            code: string;
            message: string;
        };
    }

    export class SendMailClient {
        constructor(options: { url: string; token: string });
        sendMail(options: MailOptions): Promise<MailResponse>;
    }
} 