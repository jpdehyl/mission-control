# Agent Management UI - Implementation Plan

## Overview
Add agent management to Houston similar to OpenClaw Admin.

## Current State
- `/api/agents` - Basic agents API exists
- `/api/agents/heartbeat` - Heartbeat endpoint exists
- Kanban board for tasks working
- UI components: Button, Modal, Badge, Input

## Required Features

### 1. Agent List Page (`/agents`)
- List all agents with:
  - Avatar/icon
  - Name
  - Description (from SOUL.md)
  - Skills count
  - Status indicator (active/idle)

### 2. Agent Detail Page (`/agents/[id]`)
**Tabs:**
- Soul - Display/edit SOUL.md
- User - Display USER.md
- Memory - Display MEMORY.md
- Tools - Tool access toggles
- Skills - List of skills

**Tool Access Panel:**
- Categories: Fs, Runtime, Web, Memory, Sessions, UI, Messaging
- Individual toggles per tool
- Quick Presets: Status, Coding, Messaging, Full
- Enable All / Disable All buttons

### 3. API Endpoints Needed

```typescript
// GET /api/agents - List all agents (already exists, may need enhancement)
// GET /api/agents/[id] - Get agent details
// PATCH /api/agents/[id] - Update agent config
// GET /api/agents/[id]/files - Get agent files (SOUL.md, etc.)
// PUT /api/agents/[id]/files/[filename] - Update agent file
```

### 4. OpenClaw Gateway Integration

Need to read/write agent configs via:
- `gateway.config.get` - Read current config
- `gateway.config.patch` - Update agent settings

**Gateway URL:** `http://localhost:18789` (or via Tailscale)
**Auth:** Token in config

## File Structure

```
src/
├── app/
│   └── agents/
│       ├── page.tsx           # Agent list
│       └── [id]/
│           └── page.tsx       # Agent detail
├── components/
│   └── agents/
│       ├── AgentCard.tsx      # Card for list view
│       ├── AgentDetail.tsx    # Detail view container
│       ├── ToolAccessPanel.tsx # Tool toggles
│       ├── FileEditor.tsx     # Edit SOUL/USER/etc
│       └── index.ts
└── lib/
    └── openclaw.ts            # Gateway API client
```

## Implementation Order

1. **Phase 1: Read-only list**
   - Create `/agents` page
   - Create AgentCard component
   - Fetch from existing `/api/agents`

2. **Phase 2: Agent detail view**
   - Create `/agents/[id]` page
   - Create tab navigation
   - Display agent files (read-only)

3. **Phase 3: Tool access panel**
   - Create ToolAccessPanel component
   - Implement toggles UI
   - Add presets

4. **Phase 4: Write capabilities**
   - Implement gateway integration
   - Enable saving changes
   - Add file editing

## UI Reference

Based on OpenClaw Admin screenshot:
- Dark theme (already have)
- Left sidebar with agent list
- Main content shows selected agent
- Tool toggles are simple on/off switches
- Categories collapsible

## Tech Notes

- Use existing UI components (Button, Modal, Badge)
- Follow existing code patterns from Kanban
- Tailwind for styling
- Server components where possible
- Client components for interactivity

---
*Created: 2026-02-02*
*Status: Ready for implementation*
