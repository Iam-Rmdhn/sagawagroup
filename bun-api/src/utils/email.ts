import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendMitraApprovalEmail = async (
  email: string,
  namaMitra: string,
  jenisUsaha: string,
  password: string = "mitrasagawagroup"
) => {
  const htmlContent = `
    <p>Halo! mitra <strong>${namaMitra}</strong>,</p>
    <p>Saat ini kamu telah bergabung dengan SagawaGroup sebagai <strong>${jenisUsaha}</strong>.</p>
    <p>Dan berikut adalah akun kamu untuk masuk ke dalam panel mitra SagawaGroup:</p>
    <ul>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Password:</strong> ${password}</li>
    </ul>
    <p>Silakan gunakan akun ini untuk mengakses panel mitra kami.</p>
    <p>Sekian, terima kasih.</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Selamat Bergabung - Panel Mitra SagawaGroup",
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email berhasil dikirim:", info.response);
  } catch (err) {
    console.error("Gagal mengirim email:", err);
    throw err;
  }
};
