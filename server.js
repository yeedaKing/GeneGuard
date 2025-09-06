require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

//server used to send emails 
const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://lisa-cho.com",
    "https://www.lisa-cho.com"
  ]
}));

app.get("/health", (_req, res) => res.send("ok"));
app.use((req, _res, next) => { console.log(req.method, req.url); next(); });
const contactEmail = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

contactEmail.verify((error) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Ready to Send");
    }
});

router.post("/contact", async (req, res) => {
    try {
        const first = req.body.firstName || "";
        const last = req.body.lastName || "";
        const name = `${first} ${last}`.trim();
        const email = req.body.email || "";
        const phone = req.body.phone || "";
        const message = req.body.message || "";
        const mail = {
            from: process.env.EMAIL_USER, 
            replyTo: email || process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: "Contact Form Submission - Portfolio",
            html: `
                <p><strong>Name:</strong> ${name || "(no name)"}</p>
                <p><strong>Email:</strong> ${email || "(no email)"}</p>
                <p><strong>Phone:</strong> ${phone || "(no phone)"}</p>
                <p><strong>Message:</strong> ${message || "(no message)"}</p>
            `
        };
        await contactEmail.sendMail(mail);
        return res.status(200).json( { code: 200, status: "Message Sent" });
        } catch (err) {
            console.error("sendMail error: ", err);
            return res.status(500).json({ code: 500, status: "Email failed", error: String(err) });
        }
    });

    app.get("/health", (_req, res) => res.type("text").send("ok"));
    app.use("/", router);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log("Server running on", PORT));


