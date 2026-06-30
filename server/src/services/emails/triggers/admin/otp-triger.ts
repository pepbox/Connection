import { EmailService } from '../../EmailService';

const EmailVerficationOtp = async (
    otp: string,
    email: string
) => {
    const subject = `OTP for Email Verification`;
    const templateName = "email-verification-otp";

    await EmailService.getInstance().sendEmail({
        to: email,
        subject,
        templateName,
        templateCategory: 'admin/auth',
        variables: {
            OTP: otp
        },
    });
};

export default EmailVerficationOtp;