# Project: karasu

## Quick Reference

- **Language**: JavaScript
- **Framework**: Svelte, Tailwind CSS
- **Package Manager**: npm

## Project Overview

**karasu** is a client-side web application written in Svelte targeting both PCs and mobile phones, that allows users to make table sorting their 櫻坂46/日向坂46 raw photos ("生写真") using, with the ability to export CSVs.

Users can edit the table by toggling on an "edit" option, or by using a generation -> member -> cut selection system.

It also provides tools such as photo draw simulator that let users estimate how many they'll get if they buy a specific amount.

## Data Structure

- **Groups**: sakurazaka (櫻坂46), hinatazaka (日向坂46)
- **Files**: Pure JS modules in `src/lib/*.js`, Svelte wrappers in `src/lib/*.svelte`

### Storage Format

**Photo Counts** (`localStorage: sortedPhotos20250716`)

```json
{
  "sakurazaka": {
    "井上 梨名": [0, 0, 0, 0],
    "遠藤 光莉": [1, 2, 0, 0]
  },
  "hinatazaka": {
    "金村 美玖": [2, 0, 0, 0]
  }
}
```

- Nested by group, then member
- Internal keys: `groupId:fullname` (composite)
- Auto-migrates from legacy formats

**Group Settings** (`localStorage: karasu-group-state`)

```json
{
  "sakurazaka": {
    "enabled": true,
    "generations": { "二期生": true, "三期生": false }
  },
  "hinatazaka": { "enabled": true, "generations": {...} }
}
```

- Persists group/generation enabled state
- Loaded on app initialization

### CSV Export

Format: `メンバー,ヨリ,チュウ,ヒキ,座り`

- No group column (member names are unique)
- Only includes enabled groups/generations

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
