export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL || "https://ueyoxtaracgkppzerqvv.supabase.co";
  const key = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVleW94dGFyYWNna3BwemVycXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjA2NDgsImV4cCI6MjA5NTc5NjY0OH0.QcnGeU1ul0mnnmFdKtutHRJlP9zBnEAWERG9q4DmqSU";

  const response = await fetch(`${url}/rest/v1/sheets?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });

  res.status(response.ok ? 200 : 502).json({ ok: response.ok, status: response.status });
}
