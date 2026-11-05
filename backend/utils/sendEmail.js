module.exports = async function sendEmail(to, subject, text) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { email: process.env.EMAIL_FROM },
      to: [{ email: to }],
      subject,
      textContent: text
    })
  });
  if (!res.ok) throw new Error(`Email failed: ${res.status} ${await res.text()}`);
};
//sends one email through Brevo's web API since digital ocean would block it