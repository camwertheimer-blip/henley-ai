/**
 * Shared Google Sheets and Google Docs helpers.
 * Used by /api/analyze to atomically log intake + analysis output.
 *
 * The original implementations lived in /api/log-submission/route.ts.
 * They were moved here so /api/analyze can call them directly,
 * eliminating the client-side fire-and-forget logging step.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Google service account auth — generates a short-lived access token via JWT
// ─────────────────────────────────────────────────────────────────────────────

export async function getAccessToken(email: string, privateKey: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: email,
      scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };
  
    const encode = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString("base64url");
  
    const signingInput = `${encode(header)}.${encode(payload)}`;
  
    const key = privateKey.replace(/\\n/g, "\n");
    const pemBody = key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, "");
    const binaryKey = Buffer.from(pemBody, "base64");
  
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
  
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      Buffer.from(signingInput)
    );
  
    const jwt = `${signingInput}.${Buffer.from(signature).toString("base64url")}`;
  
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
  
    if (!tokenRes.ok) {
      throw new Error(`Failed to obtain Google access token: ${tokenRes.status}`);
    }
  
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error("Google token response missing access_token");
    }
    return tokenData.access_token;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Google Docs — create a doc and insert content
  // ─────────────────────────────────────────────────────────────────────────────
  
  export async function createGoogleDoc(title: string, content: string, token: string): Promise<string> {
    const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  
    if (!createRes.ok) {
      throw new Error(`Failed to create Google Doc: ${createRes.status}`);
    }
  
    const doc = await createRes.json();
    const docId = doc.documentId;
    if (!docId) {
      throw new Error("Google Doc creation response missing documentId");
    }
  
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{ insertText: { location: { index: 1 }, text: content } }],
      }),
    });
  
    if (!updateRes.ok) {
      // Doc was created but content insert failed. Return the URL anyway —
      // an empty doc is recoverable; failing the whole submission is not.
      console.error(`Google Doc content insert failed for ${docId}: ${updateRes.status}`);
    }
  
    return `https://docs.google.com/document/d/${docId}/edit`;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Sheet writes — three operations, designed for the three-layer safety model
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Append a new row to the sheet with intake data + status="analyzing".
   * Returns the row number that was written, so we can update it later.
   *
   * Columns: A=timestamp, B=name, C=email, D=phone, E=intakeUrl, F=outputUrl(blank),
   *          G=status, H=completeness(blank), I=fundability(blank), J=nextStep(blank),
   *          K=rawOutput(blank), L=submissionId
   */
  export async function appendIntakeRow(
    token: string,
    sheetId: string,
    row: {
      timestamp: string;
      name: string;
      email: string;
      phone: string;
      intakeUrl: string;
      submissionId: string;
    }
  ): Promise<number> {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:L:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          values: [[
            row.timestamp,
            row.name,
            row.email,
            row.phone,
            row.intakeUrl,
            "",                    // F: outputUrl (filled in later)
            "analyzing",           // G: status
            "",                    // H: completeness (filled in later)
            "",                    // I: fundability (filled in later)
            "",                    // J: nextStep (filled in later)
            "",                    // K: raw output (only filled if parse fails)
            row.submissionId,      // L: submission ID
          ]],
        }),
      }
    );
  
    if (!res.ok) {
      throw new Error(`Failed to append intake row to sheet: ${res.status}`);
    }
  
    const data = await res.json();
    // The append response includes updates.updatedRange like "Sheet1!A42:L42".
    // Extract the row number (42) so we can update it later.
    const updatedRange: string | undefined = data?.updates?.updatedRange;
    if (!updatedRange) {
      throw new Error("Sheet append response missing updatedRange");
    }
    const match = updatedRange.match(/!A(\d+):/);
    if (!match) {
      throw new Error(`Could not parse row number from updatedRange: ${updatedRange}`);
    }
    return parseInt(match[1], 10);
  }
  
  /**
   * Update an existing row with successful analysis results.
   * Updates F (outputUrl), G (status="complete"), H, I, J (the three rankings).
   */
  export async function updateRowWithResults(
    token: string,
    sheetId: string,
    rowNumber: number,
    outputUrl: string,
    rankings: { completeness: string; fundability: string; nextStep: string }
  ): Promise<void> {
    // Update F:J in one batch (six columns including the gap from F to J).
    const range = `Sheet1!F${rowNumber}:J${rowNumber}`;
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          values: [[
            outputUrl,                // F
            "complete",               // G
            rankings.completeness,    // H
            rankings.fundability,     // I
            rankings.nextStep,        // J
          ]],
        }),
      }
    );
  
    if (!res.ok) {
      throw new Error(`Failed to update row ${rowNumber} with results: ${res.status}`);
    }
  }
  
  /**
   * Update an existing row with raw output + status="parse_failed".
   * Used when the model returned text we couldn't parse as valid JSON,
   * even after a retry. Form data is preserved; raw output is saved for
   * manual review.
   */
  export async function updateRowWithParseFailure(
    token: string,
    sheetId: string,
    rowNumber: number,
    rawOutput: string
  ): Promise<void> {
    // Update G (status) and K (raw output).
    // Sheets doesn't let us update non-contiguous columns in one call,
    // so we make two updates.
    const updateStatus = fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!G${rowNumber}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [["parse_failed"]] }),
      }
    );
  
    // Truncate raw output to stay under Sheets' 50,000 char per-cell limit.
    const truncated = rawOutput.length > 49000
      ? rawOutput.slice(0, 49000) + "\n\n[TRUNCATED — full output exceeded sheet cell limit]"
      : rawOutput;
  
    const updateRaw = fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!K${rowNumber}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [[truncated]] }),
      }
    );
  
    const [statusRes, rawRes] = await Promise.all([updateStatus, updateRaw]);
  
    if (!statusRes.ok) {
      throw new Error(`Failed to set parse_failed status on row ${rowNumber}: ${statusRes.status}`);
    }
    if (!rawRes.ok) {
      throw new Error(`Failed to save raw output to row ${rowNumber}: ${rawRes.status}`);
    }
  }
  
  /**
   * Mark a row as analysis_failed. Used when the Anthropic API call itself
   * failed (network error, rate limit, etc.) and we never got any output.
   * Best-effort — if the sheet itself is unreachable, we just log and move on.
   */
  export async function markRowAnalysisFailed(
    token: string,
    sheetId: string,
    rowNumber: number
  ): Promise<void> {
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!G${rowNumber}?valueInputOption=RAW`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ values: [["analysis_failed"]] }),
        }
      );
    } catch (err) {
      console.error(`Failed to mark row ${rowNumber} as analysis_failed:`, err);
      // Don't rethrow — this is best-effort cleanup.
    }
  }