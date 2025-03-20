require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const multer = require('multer');
const app = express();
const port = 3000;

// OAuth2 setup
const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'https://bulk-mailer-web-app.vercel.app/oauth2callback' // Redirect URI
);

// Scopes required by Gmail API
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Middleware to parse incoming data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up file upload storage using multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Redirect user to Google OAuth page immediately
app.get('/', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    res.redirect(authUrl);
});

// OAuth2 callback route
app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        console.log('Tokens:', tokens);
        res.redirect('/send-email');
    } catch (error) {
        console.error('Error getting token:', error);
        res.send('Error during authentication');
    }
});

// Email sending form with multi-email input
app.get('/send-email', (req, res) => {
    res.send(`
       <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Send Email</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .tag {
      display: inline-flex;
      align-items: center;
      background-color: #e2e8f0;
      border-radius: 0.375rem;
      padding: 0.25rem 0.5rem;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .tag span {
      margin-right: 0.5rem;
    }
    .tag button {
      background: transparent;
      border: none;
      cursor: pointer;
    }
  </style>
</head>
<body class="bg-gray-100">
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-8">Send Email via Gmail API</h1>
    <form id="email-form" action="/send-email" method="POST" enctype="multipart/form-data" class="bg-white p-6 rounded-lg shadow-md">
      <!-- Multi-email input for Recipients -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700">Recipients' Emails</label>
        <div id="tags-container" class="flex flex-wrap p-2 border border-gray-300 rounded-md"></div>
        <input
          id="email-input"
          type="text"
          placeholder="Enter email and press Enter"
          class="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <!-- Hidden field to store the emails in comma-separated form -->
        <input type="hidden" name="to" id="to-hidden">
      </div>
      <div class="mb-4">
        <label for="subject" class="block text-sm font-medium text-gray-700">Subject</label>
        <input value="Inquiry Regarding Available Roles for MERN Stack & AI Developer" type="text" name="subject" id="subject" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
      </div>
      <div class="mb-4">
        <label for="message" class="block text-sm font-medium text-gray-700">Message</label>
        <textarea name="message" id="message" rows="6" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">Dear Hiring Manager,

I hope you're doing well. I am reaching out to express my interest in any opportunities within your organization that match my skills. With 2 years of experience as a MERN Stack Developer, I have built dynamic web applications and thrive in fast-paced environments.
Additionally, I have explored multi-agent AI systems through relevant courses and personal projects, and I am eager to apply this knowledge further. I’m passionate about learning and would love the chance to contribute to your team.
Please let me know if there are any roles that align with my background. I look forward to hearing from you.

Attached is my latest resume for your reference.

Best regards,
Chinmay Satish Vyawahare
+91 7620846379</textarea>
      </div>
      <div class="mb-4">
        <label for="attachment" class="block text-sm font-medium text-gray-700">Attachment</label>
        <input type="file" name="attachment" id="attachment" class="mt-1 block w-full text-sm text-gray-500 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
      </div>
      <button type="submit" class="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Send Email to All</button>
    </form>
  </div>
  <script>
    const emailInput = document.getElementById('email-input');
    const tagsContainer = document.getElementById('tags-container');
    const toHidden = document.getElementById('to-hidden');
    let emails = [];

    // Function to render email tags
    function renderTags() {
      tagsContainer.innerHTML = '';
      emails.forEach(email => {
        const tag = document.createElement('div');
        tag.classList.add('tag');
        tag.innerHTML = \`<span>\${email}</span><button type="button" onclick="removeEmail('\${email}')">&times;</button>\`;
        tagsContainer.appendChild(tag);
      });
    }

    // Function to add a valid email
    function addEmail(email) {
      const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailPattern.test(email)) {
        alert("Invalid email address!");
        return;
      }
      if (emails.includes(email)) {
        alert("Email already added!");
        return;
      }
      emails.push(email);
      renderTags();
    }

    // Function to remove an email
    function removeEmail(email) {
      emails = emails.filter(e => e !== email);
      renderTags();
    }

    // Listen for Enter key press in the email input
    emailInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (email !== '') {
          addEmail(email);
          emailInput.value = '';
        }
      }
    });

    // On form submission, update the hidden input with the comma-separated emails
    const form = document.getElementById('email-form');
    form.addEventListener('submit', function(e) {
      if(emails.length === 0) {
        alert("Please add at least one email address.");
        e.preventDefault();
      } else {
        toHidden.value = emails.join(',');
      }
    });
  </script>
</body>
</html>
    `);
});

// Handle email sending (POST request)
app.post('/send-email', upload.single('attachment'), async (req, res) => {
    const { to, subject, message } = req.body;
    let attachment = req.file ? req.file.buffer : null;
    let attachmentMimeType = req.file ? req.file.mimetype : null;
    let attachmentFilename = req.file ? req.file.originalname : null;

    // Parse the recipient emails from the hidden input (comma separated)
    const recipients = to.split(',').map(email => email.trim());

    try {
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        // Send emails to all recipients
        for (let i = 0; i < recipients.length; i++) {
            const raw = createEmailMessage(
                recipients[i],
                subject,
                message,
                attachment,
                attachmentMimeType,
                attachmentFilename
            );

            await gmail.users.messages.send({
                userId: 'me',
                resource: {
                    raw: raw,
                },
            });
        }

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Sent Successfully</title>
              <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-gray-50 font-sans leading-normal tracking-normal">
              <div class="min-h-screen flex items-center justify-center">
                <div class="bg-white shadow-xl rounded-lg p-8 max-w-lg w-full text-center">
                  <h1 class="text-3xl font-bold text-gray-800 mb-6">Emails Sent Successfully!</h1>
                  <p class="text-lg text-gray-600 mb-6">Your emails have been sent successfully via the Gmail API.</p>
                  <a href="/" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-200 transform hover:scale-105">Back to Home</a>
                </div>
              </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error sending email:', error);
        res.send('Error sending email.');
    }
});

// Helper function to create a raw email message with attachment and HTML content
function createEmailMessage(to, subject, message, attachment, attachmentMimeType, attachmentFilename) {
    // Define boundaries for outer and inner MIME parts
    const outerBoundary = "outer-boundary";
    const innerBoundary = "inner-boundary";
    const newLine = "\r\n";

    // Convert plain text message to HTML (replace newlines with <br>)
    const htmlMessage = `<html><body style="font-family: Arial, sans-serif; line-height:1.5;">${message.replace(/\n/g, '<br>')}</body></html>`;

    // Build the MIME message parts
    let rawMessage = [
        `Content-Type: multipart/mixed; boundary="${outerBoundary}"`,
        `To: ${to}`,
        `From: chinmayvyawahare94036@gmail.com`,  // Replace with your authenticated email address
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        "",
        `--${outerBoundary}`,
        `Content-Type: multipart/alternative; boundary="${innerBoundary}"`,
        "",
        `--${innerBoundary}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `Content-Transfer-Encoding: 7bit`,
        "",
        message,
        "",
        `--${innerBoundary}`,
        `Content-Type: text/html; charset="UTF-8"`,
        `Content-Transfer-Encoding: 7bit`,
        "",
        htmlMessage,
        "",
        `--${innerBoundary}--`,
        ""
    ];

    // Append attachment if provided
    if (attachment) {
        rawMessage = rawMessage.concat([
            `--${outerBoundary}`,
            `Content-Type: ${attachmentMimeType}; name="${attachmentFilename}"`,
            `Content-Transfer-Encoding: base64`,
            `Content-Disposition: attachment; filename="${attachmentFilename}"`,
            "",
            attachment.toString('base64'),
            ""
        ]);
    }

    rawMessage.push(`--${outerBoundary}--`);

    // Return the base64url encoded string
    return Buffer.from(rawMessage.join(newLine))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Start the server
app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
});
