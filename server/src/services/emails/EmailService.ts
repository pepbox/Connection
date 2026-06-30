// import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
// import { EmailTemplateManager } from './EmailTemplateManager';

// export interface SendEmailOptions {
//   to: string | string[];
//   subject: string;
//   templateName: string;
//   templateCategory: string;
//   variables: Record<string, any>;
// }

// export class EmailService {
//   private static instance: EmailService;
//   private sesClient: SESClient;

//   private constructor() {
//     this.sesClient = new SESClient({
//       region: process.env.AWS_REGION!,
//       credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//       },
//     });
//     console.log("Access key",process.env.AWS_SECRET_ACCESS_KEY)
//   }

//   public static getInstance(): EmailService {
//     if (!EmailService.instance) {
//       EmailService.instance = new EmailService();
//     }
//     return EmailService.instance;
//   }

//   public async sendEmail(options: SendEmailOptions): Promise<void> {
//     const html = EmailTemplateManager.compileTemplate(
//       options.templateCategory,
//       options.templateName,
//       options.variables,
//       true  // true here indicates HTML
//     );

//     // Ensure 'to' is an array for consistency
//     const recipients = Array.isArray(options.to) ? options.to : [options.to];

//     const command = new SendEmailCommand({
//       Source: process.env.EMAIL_FROM!,
//       Destination: {
//         ToAddresses: recipients,
//       },
//       Message: {
//         Subject: {
//           Data: options.subject,
//           Charset: 'UTF-8',
//         },
//         Body: {
//           Html: {
//             Data: html,
//             Charset: 'UTF-8',
//           },
//         },
//       },
//     });

//     try {
//       await this.sesClient.send(command);
//     } catch (error) {
//       console.error('Failed to send email:', error);
//       throw new Error('Failed to send email');
//     }
//   }
// }

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { EmailTemplateManager } from './EmailTemplateManager';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  templateName: string;
  templateCategory: string;
  variables: Record<string, any>;
}

export class EmailService {
  private static instance: EmailService;
  private sesClient: SESClient;

  private constructor() {
    // Validate environment variables
    if (!process.env.AWS_REGION) {
      throw new Error('Missing AWS_REGION environment variable');
    }

    // Try explicit credentials first, fall back to default provider chain
    const config: any = {
      region: process.env.AWS_REGION.trim(),
    };

    if (process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET_KEY) {
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY.trim(),
        secretAccessKey: process.env.AWS_SECRET_KEY.trim(),
      };
    }
    console.log(config);

    this.sesClient = new SESClient(config);
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendEmail(options: SendEmailOptions): Promise<void> {
    const html = EmailTemplateManager.compileTemplate(
      options.templateCategory,
      options.templateName,
      options.variables,
      true  // true here indicates HTML
    );

    // Ensure 'to' is an array for consistency
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    const command = new SendEmailCommand({
      Source: `Quickk <${process.env.EMAIL_FROM}>`,
      Destination: {
        ToAddresses: recipients,
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
    });

    try {
      const result = await this.sesClient.send(command);
      console.log('Email sent successfully:', result.MessageId);
    } catch (error: any) {
      console.error('AWS SES Error Details:', {
        code: error.Code,
        message: error.message,
        type: error.Type,
        requestId: error.$metadata?.requestId,
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID?.substring(0, 8) + '...',
      });
      
      if (error.Code === 'SignatureDoesNotMatch') {
        throw new Error('AWS credentials are invalid. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
      } else if (error.Code === 'MessageRejected') {
        throw new Error('Email was rejected. Make sure your sender email is verified in AWS SES');
      } else {
        throw new Error(`Failed to send email: ${error.message}`);
      }
    }
  }
}