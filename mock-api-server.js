// mock-api-server.js

const express = require("express");
const app = express();
const port = 3000;

const cors = require("cors");
app.use(cors());
app.use(express.json());

// === Dynamic: Domains with optional ?days filter ===
app.get("/domains/renewals", (req, res) => {
  const daysParam = req.query.days;
  const allDomains = [
    {
      domain: "myexampledomain.com",
      expires_on: "2025-08-15",
      days_left: 53,
    },
    {
      domain: "clientsite.net",
      expires_on: "2025-09-02",
      days_left: 71,
    },
    {
      domain: "serversite.net",
      expires_on: "2026-09-02",
      days_left: 436,
    },
  ];

  let result = allDomains;

  if (daysParam !== undefined) {
    const maxDays = parseInt(daysParam);
    if (!isNaN(maxDays)) {
      result = allDomains.filter((domain) => domain.days_left <= maxDays);
    }
  }

  res.json({
    status: "success",
    count: result.length,
    domains: result,
  });
});

// === Client lookup from HaloPSA ===
app.get("/client-lookup", (req, res) => {
  const domain = req.query.domain;

  const mockClients = {
    "clientsite.net": {
      status: "found",
      client: {
        name: "ClientSite Ltd",
        id: 1010,
        site: "Main HQ",
        site_id: 501,
      },
    },
    "myexampledomain.com": {
      status: "not_found",
      message: "No matching client record",
    },
    "serversite.net": {
      status: "found",
      client: {
        name: "ServerSite Inc",
        id: 2020,
        site: "Data Center",
        site_id: 502,
      },
    },
  };

  const response = mockClients[domain] || {
    status: "not_found",
    message: "Domain not recognized in mock database",
  };

  res.json(response);
});

// === Create invoice in HaloPSA ===
app.post("/invoices", (req, res) => {
  const { client_id, site_id, domain } = req.body;
  res.json({
    status: "invoice_created",
    invoice_id: `INV-${Math.floor(Math.random() * 10000)}`,
    amount: 19.99,
    client_id,
    site_id,
    domain,
  });
});

// === Simulate payment processing ===
app.post("/payments", (req, res) => {
  const { invoice_id } = req.body;
  res.json({
    status: "paid",
    invoice_id,
    transaction_id: `TXN-${Math.floor(Math.random() * 100000)}`,
  });
});

// === Renew domain via Synergy Wholesale ===
app.post("/synergy/renew-domain", (req, res) => {
  const { domain } = req.body;
  const newExpiry = "2026-08-15"; // example value
  res.json({
    status: "renewed",
    domain,
    new_expiry: newExpiry,
  });
});

// === Update HaloPSA asset/notes with new expiry ===
app.post("/halo/update-asset", (req, res) => {
  const { domain, new_expiry } = req.body;
  res.json({
    status: "updated",
    domain,
    new_expiry,
    notes: `Domain expiry updated to ${new_expiry}`,
  });
});

// === Send summary notification ===
app.post("/notify", (req, res) => {
  const { domain, status, client, invoice_id, transaction_id } = req.body;
  res.json({
    status: "notified",
    sent_to: ["slack", "email"],
    domain,
    summary: `Renewal for ${domain} completed successfully. Invoice: ${invoice_id}, TXN: ${transaction_id}`,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
});
