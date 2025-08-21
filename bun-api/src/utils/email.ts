import nodemailer from "nodemailer";

// Konfigurasi transporter dengan setting yang lebih lengkap
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Fungsi untuk test koneksi email
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("Email connection is ready to send emails");
    return true;
  } catch (error) {
    console.error("Email connection failed:", error);
    return false;
  }
};

export const sendMitraApprovalEmail = async (
  email: string,
  namaMitra: string,
  password: string = "mitrasagawagroup"
) => {
  // Test koneksi dulu sebelum mengirim
  const isConnected = await testEmailConnection();
  if (!isConnected) {
    throw new Error(
      "Email service tidak dapat terhubung. Periksa konfigurasi EMAIL_USER dan EMAIL_PASS di file .env"
    );
  }

  const htmlContent = `
    Halo ${namaMitra},

    Selamat! Registrasi Anda di PT SAGAWA PANGAN NUSANTARA telah berhasil.
    Berikut detail akun Anda:

    <ul>
    <li><strong>Email:</strong> ${email}</li>
    <li><strong>Password:</strong> ${password}</li>
    </ul>

    Silakan login melalui [link login].

    Remainder :
    Password tidak bisa di ubah, kecuali oleh admin pusat.

    Terima kasih,
    Admin Support`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Registrasi Akun Anda di PT SAGAWA PANGAN NUSANTARA – Berhasil",
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email approval berhasil dikirim:", info.response);
    console.log("Email dikirim ke:", email);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (err: any) {
    console.error("Gagal mengirim email approval:", err);

    // Berikan pesan error yang lebih spesifik
    let errorMessage = "Gagal mengirim email";
    if (err.code === "EAUTH") {
      errorMessage =
        "Email authentication gagal. Periksa EMAIL_USER dan EMAIL_PASS di file .env. Pastikan menggunakan App Password Gmail.";
    } else if (err.code === "ECONNECTION") {
      errorMessage = "Gagal terhubung ke server email Gmail.";
    } else if (err.code === "EMESSAGE") {
      errorMessage = "Format email tidak valid.";
    }

    throw new Error(errorMessage);
  }
};
