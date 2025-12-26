# Quick Start Guide

## Testing the Frontend

### 1. Login Page
- Beautiful gradient background (green to blue)
- AskYialogo at top
- Email and password fields
- "Sign in" button
- Try entering any credentials (mock auth)

### 2. Dashboard (Empty State)
Once logged in, you'll see:
- Header with AskYialogo and user avatar (S)
- "My Stacks" title with "+ New Stack" button
- Empty state card with "Create New Stack" message

### 3. Create a Stack
Click "+ New Stack" to open modal:
- Enter name (e.g., "Chat With PDF")
- Enter description (e.g., "Chat with your pdf docs")
- Click "Create" button

### 4. Dashboard (With Stacks)
After creating stacks, you'll see:
- Grid of stack cards
- Each card shows name, description, and "Edit Stack ↗" button
- Hover effects on cards

### 5. Open Workflow Builder
Click "Edit Stack ↗" on any card to enter workflow builder:
- Top bar: Logo, stack name with 📝, Save button, user avatar
- Left sidebar: Component library with 5 draggable components
- Center canvas: Dotted background with "Drag & drop to start" message
- Floating action buttons (bottom right):
  - 💬 Chat button (white)
  - 🟢▶ Run button (green)

### 6. Build a Workflow
Drag components from sidebar to canvas:

**Example: Simple Chat Flow**
1. Drag "Input" node → place on left
2. Drag "LLM" node → place in middle
3. Drag "Output" node → place on right
4. Connect: Input (orange handle) → LLM (orange input)
5. Connect: LLM (blue output) → Output (green input)

**Example: PDF Chat with Web Search**
1. Drag "Input" → left
2. Drag "Knowledge Base" → middle-top
3. Drag "LLM" → middle-bottom
4. Drag "Output" → right
5. Connect: Input → Knowledge Base (query)
6. Connect: Input → LLM (query)
7. Connect: Knowledge Base → LLM (context)
8. Connect: LLM → Output

### 7. Configure Nodes
Click ⚙️ on any node to expand/collapse:

**Input Node:**
- Write query in text area

**LLM Node:**
- Select model (GPT-4o-Mini, etc.)
- Enter API key (use 👁 to show/hide)
- Edit prompt template
- Adjust temperature slider
- Toggle WebSearch on/off
- Enter SERP API key if web search enabled

**Knowledge Base:**
- Click "Upload File 📤" to select PDF/doc
- Choose embedding model
- Enter OpenAI API key

**Web Search:**
- Enter SERP API key
- Set max results (1-10)

**Output:**
- View only (shows preview text)

### 8. Test Chat Interface
Click 💬 button (bottom right) to open chat:
- Modal overlay appears
- Type message in input at bottom
- Press Enter or click ➤ to send
- See user message (right side, green background)
- See AI response (left side, gray background)
- Animated loading dots while "thinking"

### 9. Canvas Controls
Bottom-right controls:
- + Zoom in
- - Zoom out
- ⛶ Fit view
- 🔒 Lock/unlock

### 10. Save Workflow
Click "💾 Save" button in top bar:
- Saves current nodes and connections
- Shows success alert

### 11. Build Stack
Click 🟢▶ button (bottom right):
- Validates workflow
- Shows building alert

### 12. Return to Dashboard
Change URL hash to `#` or `#dashboard` (or create back button)

## Color Reference
- Primary actions: Green (#4CAF50)
- Query handles: Orange (#F59E0B)
- Context handles: Blue (#3B82F6)
- Output handles: Green (#4CAF50)
- Node headers have subtle colors:
  - Input: Light blue
  - LLM: Light purple
  - Knowledge: Light blue
  - Web Search: Light green
  - Output: Light orange

## Tips
- **Drag components**: Grab from sidebar, drop on canvas
- **Move nodes**: Click and drag nodes around
- **Connect nodes**: Click and drag from one handle to another
- **Pan canvas**: Click and drag on empty space
- **Zoom**: Use mouse wheel or controls
- **Delete nodes**: Select and press Delete key
- **Expand/collapse**: Click ⚙️ on node header

## Keyboard Shortcuts
- `Enter` in modals: Submit
- `Escape`: Close modals (add if needed)
- `Delete`: Remove selected node/edge

## Browser Testing
Works best in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Development URLs
- Development: http://localhost:5173
- Dashboard: http://localhost:5173/#
- Workflow: http://localhost:5173/#workflow

Enjoy building AI workflows! 🚀
