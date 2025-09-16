# Features Documentation

Comprehensive guide to all features available in the Notes package.

## Note Types

### 1. Text Notes
Basic plain text notes with simple formatting.

**Features:**
- Plain text input
- Auto-save
- Character count
- Quick editing

**Use Cases:**
- Quick thoughts
- Simple reminders
- Meeting notes

### 2. Markdown Notes
Rich text notes with Markdown support.

**Features:**
- Full Markdown syntax
- Live preview
- Syntax highlighting
- Export to HTML/PDF
- Table support
- Code blocks
- Lists and checkboxes

**Supported Markdown:**
```markdown
# Headers
**Bold** and *italic* text
- Bullet lists
1. Numbered lists
[Links](url)
![Images](url)
`inline code`
```

### 3. Code Notes
Syntax-highlighted code snippets.

**Features:**
- Syntax highlighting for 100+ languages
- Line numbers
- Code folding
- Copy to clipboard
- Language detection
- Theme selection

**Supported Languages:**
- JavaScript/TypeScript
- Python
- Java
- C/C++
- Go
- Rust
- And many more...

### 4. Todo Lists
Interactive checkbox lists with progress tracking.

**Features:**
- Interactive checkboxes
- Progress bar
- Nested todos
- Due dates (optional)
- Priority levels
- Completion tracking

**Todo Syntax:**
```
○ Unchecked item
● Checked item
  ○ Nested item
```

### 5. HTML Notes
Rich HTML content with WYSIWYG editing.

**Features:**
- Visual editor
- HTML source view
- Media embedding
- Table editor
- Custom styling

## Organization Features

### Folders

Organize notes into hierarchical folders.

**Features:**
- Unlimited folders
- Nested folders support
- Custom colors
- Icons
- Drag and drop
- Bulk move operations

**Default Folders:**
- All Notes
- Unsorted
- Archive
- Trash (auto-cleanup after 30 days)

### Tags

Flexible tagging system for categorization.

**Features:**
- Unlimited tags per note
- Custom tag colors
- Tag clouds
- Quick tag filtering
- Auto-suggestions
- Tag statistics

**Tag Customization:**
- Text color
- Background color
- Border color
- Icon (optional)

### Pin & Archive

Keep important notes accessible or hide old ones.

**Pinning:**
- Pinned notes appear at the top
- Visual pin indicator
- Quick pin/unpin toggle
- Bulk pin operations

**Archiving:**
- Hide completed/old notes
- Maintain note history
- Quick archive/unarchive
- Bulk archive operations
- Archive search

## View Modes

### 1. Masonry Layout
Pinterest-style dynamic grid that optimizes space.

**Features:**
- Responsive columns
- Auto-adjust to content
- Smooth animations
- Optimal space usage

**Best For:**
- Mixed content types
- Visual browsing
- Large collections

### 2. Grid Layout
Traditional uniform grid with consistent sizing.

**Features:**
- Fixed card sizes
- Predictable layout
- Clean alignment
- Customizable columns

**Best For:**
- Consistent content
- Professional appearance
- Quick scanning

### 3. List View
Compact single-column list.

**Features:**
- Maximum density
- Quick scanning
- Minimal scrolling
- Bulk selection

**Best For:**
- Todo lists
- Quick review
- Mobile devices

## Search & Filter

### Full-Text Search
Search across all note content.

**Features:**
- Real-time search
- Highlight matches
- Search history
- Advanced operators
- Fuzzy matching

**Search Operators:**
- `"exact phrase"` - Exact match
- `title:keyword` - Search in title only
- `tag:name` - Search by tag
- `folder:name` - Search in folder
- `type:markdown` - Filter by type

### Filters

**Available Filters:**
- Note type
- Folders
- Tags
- Date range
- Color
- Pinned status
- Archive status

**Filter Combinations:**
- AND/OR logic
- Save filter presets
- Quick filter buttons
- Clear all filters

## Editor Features

### Auto-Save
Notes are automatically saved as you type.

**Configuration:**
- Save delay: 1-5 seconds
- Conflict resolution
- Version history
- Offline support

### Live Preview
Real-time preview for Markdown and HTML notes.

**Features:**
- Side-by-side view
- Synchronized scrolling
- Toggle preview
- Full-screen mode

### Keyboard Shortcuts

**Global Shortcuts:**
- `Ctrl/Cmd + N` - New note
- `Ctrl/Cmd + S` - Save note
- `Ctrl/Cmd + F` - Search
- `Ctrl/Cmd + P` - Quick switcher
- `Esc` - Close modal/editor

**Editor Shortcuts:**
- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + K` - Insert link
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo

### Rich Text Formatting

**Text Formatting:**
- Bold, italic, underline
- Strikethrough
- Superscript/subscript
- Highlight
- Text color

**Paragraph Formatting:**
- Headers (H1-H6)
- Blockquotes
- Code blocks
- Horizontal rules
- Alignment

**Lists:**
- Bullet lists
- Numbered lists
- Nested lists
- Checklists

## Mobile Features

### Touch Gestures
- Swipe to delete
- Pull to refresh
- Pinch to zoom
- Long press for options
- Drag to reorder

### Mobile-Optimized UI
- Bottom navigation
- Floating action button
- Compact cards
- Thumb-friendly controls
- Responsive typography

### Offline Support
- Local storage
- Sync when online
- Conflict resolution
- Queue actions

## Collaboration Features (Optional)

### Sharing
- Share via link
- Public/private notes
- Read-only access
- Expiring links
- Password protection

### Real-time Sync
- Live updates
- Presence indicators
- Conflict resolution
- Activity feed

### Comments
- Inline comments
- Threaded discussions
- Mentions
- Notifications

## Import/Export

### Import Formats
- Plain text (.txt)
- Markdown (.md)
- HTML (.html)
- JSON (.json)
- CSV (.csv)
- Evernote (.enex)
- OneNote (.one)

### Export Formats
- Markdown
- HTML
- PDF
- JSON
- Plain text
- Archive (.zip)

### Backup
- Automatic backups
- Manual backup
- Cloud sync
- Version history
- Restore points

## Customization

### Themes
- Light/Dark mode
- Custom themes
- Color schemes
- Font selection
- Layout density

### Preferences
- Default note type
- Default folder
- Sort order
- View mode
- Editor settings
- Keyboard shortcuts

### Extensions (Optional)
- Plugin system
- Custom note types
- Third-party integrations
- API access
- Webhooks

## Performance Features

### Optimization
- Virtual scrolling
- Lazy loading
- Image optimization
- Code splitting
- Cache management

### Limits
- Max note size: 10MB
- Max attachments: 25MB
- Notes per folder: Unlimited
- Tags per note: Unlimited
- Concurrent edits: 10

## Security Features

### Data Protection
- Encryption at rest
- Secure transmission
- Password protection
- Two-factor auth
- Audit logs

### Privacy
- Private by default
- No tracking
- Local-first
- Data ownership
- Export everything

## Accessibility

### Standards Compliance
- WCAG 2.1 Level AA
- Keyboard navigation
- Screen reader support
- High contrast mode
- Font scaling

### Assistive Features
- Voice input
- Read aloud
- Focus indicators
- Skip links
- ARIA labels