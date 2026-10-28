# UN Digital Hub CRM — Final Static Project

**Brand:** UN Digital Hub — Your Digital Growth Partner  
**Stack:** HTML, CSS, vanilla JavaScript, browser `localStorage`  
**Database/server:** None required. No PostgreSQL, Supabase, Node server or Lovable required.

## Included modules
- Dashboard with business snapshots and upcoming follow-ups
- Customer records and customer profile views
- Service catalogue and pricing
- Orders/projects with status history and delivery tracking
- Payment records and manual verification
- Invoice creation, preview, logo, payment details, QR image and print / Save as PDF
- Expenses
- Reports and CSV exports for Excel
- Follow-up reminders: calls, quotations, payments, delivery check-ins and feedback
- Settings and business profile
- JSON backup and restore
- Excel-compatible CSV export
- Fictional demo data for testing

## Run locally in VS Code (Windows)
1. Extract the ZIP to a folder.
2. In VS Code, choose **File → Open Folder** and open `UN-Digital-Hub-CRM-Final`.
3. Open `index.html` with Live Server (right-click → **Open with Live Server**) or open it directly in a browser.
4. Add a test customer, create an order, record a test payment, create an invoice and try a follow-up reminder.
5. Before entering real records, open **Settings & Backup → Export full JSON backup** and keep a backup copy.

## Publish to GitHub and Vercel
1. Test the local project first.
2. Export a full JSON backup from the CRM before changing folders or deployments.
3. Create a new GitHub repository and upload the contents of this folder (the files themselves, not the ZIP).
4. In Vercel, choose **Add New → Project**, import the GitHub repository, and deploy as a static site. No build command is required; the output is the project root.
5. After deployment, open the Vercel URL and test with a fictional customer first.
6. To transfer local records to the deployed site's browser, use **Settings & Backup → Export full JSON backup** on the local version, then **Import backup** on the deployed version. Import replaces the current browser data, so back up first.

## Important storage and security limitations
This is a **browser-local CRM**, not a shared online database. `localStorage` is isolated by browser and site origin. The data in your local Live Server site will not automatically appear at the Vercel URL, and records do not sync across devices or staff accounts. Vercel deployment publishes the app files only; it does not upload customer records into a server database.

There is no real login, server-side access control, automatic WhatsApp/email notifications, or payment processing. Do not treat this version as secure multi-user software or use it for sensitive data. For online shared records and staff access, a backend database and authentication will be required.

The app can store your logo and payment QR image in browser storage. Use only your real, verified payment details. Check the QR by scanning it from another device before sending invoices. Invoice tax is configurable in invoice entries; verify actual tax obligations before issuing invoices.

## Recommended final test checklist
- [ ] Add a fictional customer and confirm it appears in Customers
- [ ] Create an order and verify the customer and service links
- [ ] Record a payment as Pending, then verify only after confirming receipt
- [ ] Create and print an invoice; check logo, payment details and QR
- [ ] Create a reminder due today and see it on the dashboard
- [ ] Update an order's delivery status and dates
- [ ] Add an expense and confirm reports reflect it
- [ ] Export all CSVs and open one in Excel
- [ ] Export a full JSON backup and test restoring it only after saving a separate copy



## Fixes: reports export and WhatsApp invoice sharing
- **Export report CSV** now exports report summary rows plus filtered orders, verified payments, expenses, invoices, and service totals, respecting the selected From/To dates.
- CSV downloads keep their temporary browser URL alive long enough for the download to start.
- **Export all records** now produces one Excel-compatible CSV containing a `record_type` column, rather than triggering several downloads that browsers may block.
- In the invoice list and invoice preview, **WhatsApp / Send via WhatsApp** opens the customer's chat with a prefilled invoice summary (invoice number, order, service, total, verified payments, balance due, due date and UPI ID).
- Browser security does not let a static website silently attach or send a PDF to WhatsApp. To include the PDF, click **Print / Save PDF**, save the invoice PDF, then attach that file in the opened WhatsApp chat and tap Send. The CRM does not send a message without your confirmation.
