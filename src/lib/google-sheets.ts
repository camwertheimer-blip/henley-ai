/**
 * Shared Google Sheets and Google Docs helpers.
 * Used by /api/analyze to atomically log intake + analysis output.
 *
 * Docs are created inside a specified Drive folder so the service account
 * can manage them. The folder must be shared with the service account
 * (Editor role) and its ID provided via GOOGLE_DRIVE_FOLDER_ID.
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
      const errBody = await tokenRes.text().catch(() => "(no body)");
      throw new Error(`Failed to obtain Google access token: ${tokenRes.status} - ${errBody}`);
    }
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error("Google token response missing access_token");
    }
    return tokenData.access_token;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Google Docs — create a doc inside a given Drive folder, then insert content
  // ─────────────────────────────────────────────────────────────────────────────
  //
  // We use the Drive API (not the Docs API) to create the file because Drive
  // supports a `parents` parameter that places the new file in a specific
  // folder. The Docs API's `documents.create` endpoint creates files in the
  // service account's own Drive root, which is inaccessible to humans and
  // returns 403 on bare service accounts.
  //
  // Once the empty Doc exists, we use the Docs API's batchUpdate to insert
  // the content text. This call works fine on an existing Doc the service
  // account has access to.
  
  export async function createGoogleDoc(
    title: string,
    content: string,
    token: string,
    folderId: string,
  ): Promise<string> {
    // Step 1: Create the Doc inside the target folder via the Drive API.
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: title,
        mimeType: "application/vnd.google-apps.document",
        parents: [folderId],
      }),
    });
  
    if (!createRes.ok) {
      const errBody = await createRes.text().catch(() => "(no body)");
      throw new Error(`Failed to create Google Doc: ${createRes.status} - ${errBody}`);
    }
  
    const created = await createRes.json();
    const docId = created.id;
    if (!docId) {
      throw new Error("Drive API create response missing file id");
    }
  
    // Step 2: Insert content into the new Doc via the Docs API batchUpdate.
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
      const errBody = await updateRes.text().catch(() => "(no body)");
      console.error(`Google Doc content insert failed for ${docId}: ${updateRes.status} - ${errBody}`);
    }
  
    return `https://docs.google.com/document/d/${docId}/edit`;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Sheet writes — three operations, designed for the three-layer safety model
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Append a new row to the sheet with intake data + status="analyzing".
   * Returns the row number that was written, so we can update it later.
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
      const errBody = await res.text().catch(() => "(no body)");
      throw new Error(`Failed to append intake row to sheet: ${res.status} - ${errBody}`);
    }
  
    const data = await res.json();
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
    const range = `Sheet1!F${rowNumber}:J${rowNumber}`;
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          values: [[
            outputUrl,
            "complete",
            rankings.completeness,
            rankings.fundability,
            rankings.nextStep,
          ]],
        }),
      }
    );
  
    if (!res.ok) {
      const errBody = await res.text().catch(() => "(no body)");
      throw new Error(`Failed to update row ${rowNumber} with results: ${res.status} - ${errBody}`);
    }
  }
  
  /**
   * Update an existing row with raw output + status="parse_failed".
   */
  export async function updateRowWithParseFailure(
    token: string,
    sheetId: string,
    rowNumber: number,
    rawOutput: string
  ): Promise<void> {
    const updateStatus = fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!G${rowNumber}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [["parse_failed"]] }),
      }
    );
  
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
   * Mark a row as analysis_failed. Best-effort.
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
    }
  }