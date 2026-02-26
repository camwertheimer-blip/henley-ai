# Henley AI

kyle is awesome

A single-page Next.js app that sends your case narrative and uploaded documents to the Claude API and shows the analysis in a formatted panel.

## Setup

1. **Install dependencies**

   ```bash
   cd case-narrative-app
   npm install
   ```

2. **Set your Anthropic API key**

   Create a `.env.local` file in the project root:

   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

   Get a key from [Anthropic Console](https://console.anthropic.com/).

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Usage

- Paste or type your case narrative in the text box.
- Optionally click **Choose files** to attach documents (`.txt`, `.md`, `.json`, or images). Text files are sent as-is; images are sent as base64.
- Click **Submit** to send the narrative and documents to Claude using the system prompt in `system_prompt.txt`.
- The analysis appears in the **Analysis** panel below.

## Customizing the system prompt

Edit `system_prompt.txt` in the project root. Its contents are sent as the system prompt for every request.
