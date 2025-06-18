# Design Specification Document: Seriously AI

## Design Principles

### Brand Personality
Seriously AI embodies **professional authority** through design—conveying credibility, expertise, and trustworthiness while remaining approachable for busy professionals. The visual language balances sophistication with clarity, ensuring users feel confident in the platform's ability to elevate their thought leadership.

### Design Philosophy
- **Authority Through Simplicity**: Clean, uncluttered interfaces that respect users' time and intelligence
- **Data-Driven Confidence**: Visualizations and metrics that reinforce credibility and impact
- **Professional Polish**: Refined details that reflect the quality of content being created
- **Mobile-First Efficiency**: Optimized for professionals checking insights between meetings

### Accessibility Standards
- **Target Level**: WCAG 2.1 AA compliance
- **Key Requirements**:
  - Color contrast ratio minimum 4.5:1 for normal text, 3:1 for large text
  - All interactive elements keyboard accessible
  - Clear focus indicators throughout
  - Semantic HTML structure for screen readers
  - Touch targets minimum 44x44px for mobile

## Design System Foundations

### Color Palette

#### Primary Colors
```css
--primary-950: hsl(222, 47%, 11%);    /* Deep Navy - Headers */
--primary-900: hsl(221, 39%, 17%);    /* Dark Navy */
--primary-800: hsl(220, 35%, 25%);    /* Navy */
--primary-700: hsl(220, 33%, 35%);    /* Medium Navy */
--primary-600: hsl(220, 30%, 46%);    /* Muted Blue */
--primary-500: hsl(220, 25%, 58%);    /* Professional Blue */
--primary-400: hsl(220, 23%, 69%);    /* Light Blue */
--primary-300: hsl(220, 20%, 80%);    /* Pale Blue */
--primary-200: hsl(220, 18%, 88%);    /* Very Pale Blue */
--primary-100: hsl(220, 15%, 94%);    /* Near White Blue */
--primary-50: hsl(220, 12%, 97%);     /* Faint Blue */
```

#### Accent Colors
```css
--accent-success: hsl(142, 71%, 45%);    /* Green - Approvals/Success */
--accent-warning: hsl(38, 92%, 50%);     /* Amber - Warnings/Alerts */
--accent-error: hsl(0, 72%, 51%);        /* Red - Errors/Critical */
--accent-info: hsl(199, 89%, 48%);       /* Sky Blue - Information */
```

#### Neutral Colors
```css
--neutral-950: hsl(0, 0%, 9%);          /* Near Black */
--neutral-900: hsl(0, 0%, 13%);         /* Dark Gray */
--neutral-800: hsl(0, 0%, 20%);         /* Charcoal */
--neutral-700: hsl(0, 0%, 32%);         /* Medium Dark Gray */
--neutral-600: hsl(0, 0%, 45%);         /* Medium Gray */
--neutral-500: hsl(0, 0%, 58%);         /* Gray */
--neutral-400: hsl(0, 0%, 70%);         /* Light Gray */
--neutral-300: hsl(0, 0%, 81%);         /* Pale Gray */
--neutral-200: hsl(0, 0%, 90%);         /* Very Light Gray */
--neutral-100: hsl(0, 0%, 95%);         /* Near White */
--neutral-50: hsl(0, 0%, 98%);          /* Off White */
```

### Typography

#### Font Stack
```css
--font-sans: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
--font-mono: "JetBrains Mono", "SF Mono", Consolas, monospace;
```

#### Type Scale (Mobile-First)
```css
/* Mobile Base */
--text-xs: 0.75rem;     /* 12px - Captions */
--text-sm: 0.875rem;    /* 14px - Secondary text */
--text-base: 1rem;      /* 16px - Body text */
--text-lg: 1.125rem;    /* 18px - Emphasized text */
--text-xl: 1.25rem;     /* 20px - Section headers */
--text-2xl: 1.5rem;     /* 24px - Page headers */
--text-3xl: 1.875rem;   /* 30px - Major headers */

/* Desktop Scale (min-width: 1024px) */
@media (min-width: 1024px) {
  --text-base: 1.0625rem;  /* 17px */
  --text-lg: 1.25rem;      /* 20px */
  --text-xl: 1.5rem;       /* 24px */
  --text-2xl: 2rem;        /* 32px */
  --text-3xl: 2.5rem;      /* 40px */
}
```

#### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing & Sizing

#### Base Unit
```css
--base-unit: 0.25rem; /* 4px */
```

#### Spacing Scale
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

#### Grid System
```css
/* Mobile First Grid */
--grid-cols-mobile: 4;
--grid-gutter-mobile: var(--space-4);
--container-padding-mobile: var(--space-4);

/* Tablet (min-width: 768px) */
--grid-cols-tablet: 8;
--grid-gutter-tablet: var(--space-5);
--container-padding-tablet: var(--space-6);

/* Desktop (min-width: 1024px) */
--grid-cols-desktop: 12;
--grid-gutter-desktop: var(--space-6);
--container-padding-desktop: var(--space-8);
--max-width-desktop: 1280px;
```

## Component Specifications

### 1. **Button Component**

#### Purpose
Primary interactive element for user actions throughout the platform.

#### Anatomy
- Container (rounded corners)
- Label text
- Optional leading/trailing icon
- Focus ring
- Loading spinner (when applicable)

#### Variants
- **Primary**: Main CTAs (Generate Content, Publish)
- **Secondary**: Secondary actions (Save Draft, Preview)
- **Ghost**: Tertiary actions (Cancel, Skip)
- **Destructive**: Dangerous actions (Delete, Reject)

#### States
- **Default**: Base interactive state
- **Hover**: Subtle background shift, cursor pointer
- **Active**: Pressed appearance
- **Focus**: Visible focus ring (2px, primary-500)
- **Disabled**: Reduced opacity (0.5), cursor not-allowed
- **Loading**: Spinner replaces text, disabled interaction

#### Behavior
- Click/tap triggers action
- Enter/Space key activation when focused
- Minimum touch target 44x44px on mobile

#### Accessibility
- Clear focus indicators
- Descriptive aria-labels for icon-only buttons
- Loading state announced to screen readers

### 2. **Insight Card Component**

#### Purpose
Display discovered insights with source attribution and actions.

#### Anatomy
- Card container with subtle shadow
- Insight headline (truncated to 2 lines)
- Source attribution with favicon
- Preview text (3-4 lines)
- Relevance score indicator
- Action buttons (Approve, Generate Content, Dismiss)
- Timestamp

#### Variants
- **Default**: Standard insight display
- **Approved**: Green accent border
- **Generated**: Blue accent indicator
- **Trending**: Fire icon for hot topics

#### States
- **Default**: Base card appearance
- **Hover**: Slight elevation increase
- **Active**: Pressed shadow state
- **Focus**: Border highlight
- **Loading**: Skeleton loader
- **Error**: Red border with retry option

#### Behavior
- Click expands full insight view
- Swipe gestures on mobile (approve/dismiss)
- Batch selection mode for multiple insights

#### Accessibility
- Semantic article tags
- Screen reader announcements for actions
- Keyboard navigation support

### 3. **Content Editor Component**

#### Purpose
AI-powered content creation interface with template selection.

#### Anatomy
- Template selector dropdown
- Writing canvas with rich text support
- AI suggestions panel (collapsible)
- Character/word counter
- Platform preview toggle
- Reference citations sidebar
- Action toolbar (Save, Generate, Publish)

#### Variants
- **Draft Mode**: Full editing capabilities
- **Review Mode**: Readonly with comments
- **Preview Mode**: Platform-specific preview

#### States
- **Empty**: Placeholder text and tips
- **Editing**: Active cursor and controls
- **Generating**: AI loading animation
- **Saved**: Success indicator
- **Error**: Inline error messages

#### Behavior
- Auto-save every 30 seconds
- AI suggestions appear inline
- Keyboard shortcuts for formatting
- Mobile-optimized toolbar

#### Accessibility
- Proper heading hierarchy
- Alt text for inserted images
- High contrast mode support

### 4. **Publishing Calendar Component**

#### Purpose
Visual scheduling interface for content distribution.

#### Anatomy
- Calendar grid (week/month views)
- Scheduled post cards
- Platform indicators (LinkedIn, Twitter)
- Time zone selector
- Bulk actions toolbar
- Quick reschedule drag-and-drop

#### Variants
- **Week View**: Detailed time slots
- **Month View**: Overview with counts
- **List View**: Mobile-optimized list

#### States
- **Scheduled**: Future posts
- **Published**: Completed with metrics
- **Failed**: Error state with retry
- **Draft**: Unscheduled content

#### Behavior
- Drag to reschedule
- Click to edit post
- Platform-specific best time suggestions
- Conflict warnings

#### Accessibility
- Keyboard navigation through dates
- Screen reader date announcements
- High contrast grid lines

### 5. **Navigation Component**

#### Purpose
Primary navigation structure for mobile and desktop.

#### Anatomy
- Logo/Brand mark
- Navigation items with icons
- User profile menu
- Credits/usage indicator
- Mobile hamburger menu

#### Variants
- **Mobile**: Bottom tab bar
- **Tablet**: Collapsible sidebar
- **Desktop**: Persistent sidebar

#### States
- **Active**: Current page indicator
- **Hover**: Background highlight
- **Collapsed**: Icon-only mode
- **Expanded**: Full labels visible

#### Behavior
- Smooth transitions between states
- Persistent active indicators
- Quick access to key features
- Credit balance always visible

#### Accessibility
- ARIA navigation landmarks
- Clear active page indicators
- Keyboard navigation support

## Layout Patterns

### Mobile Layout (320px - 767px)
```
┌─────────────────────────┐
│      Status Bar         │ 44px
├─────────────────────────┤
│      App Header         │ 56px
├─────────────────────────┤
│                         │
│     Main Content        │ Fluid
│                         │
├─────────────────────────┤
│    Bottom Tab Bar       │ 56px
└─────────────────────────┘
```

### Tablet Layout (768px - 1023px)
```
┌────┬────────────────────┐
│Nav │                    │
│    │   Main Content     │
│80px│                    │
│    │                    │
└────┴────────────────────┘
```

### Desktop Layout (1024px+)
```
┌──────┬──────────────────┬────────┐
│      │                  │        │
│ Nav  │  Main Content    │Context │
│240px │    Flexible      │ 320px  │
│      │                  │        │
└──────┴──────────────────┴────────┘
```

### Responsive Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px  
- **Desktop**: 1024px - 1279px
- **Wide**: 1280px+

### Container Widths
- **Mobile**: 100% - 32px padding
- **Tablet**: 100% - 48px padding
- **Desktop**: Max 1280px centered
- **Wide**: Max 1440px with sidebars

## Interaction Patterns

### Transition Timing
```css
--transition-fast: 150ms ease-out;
--transition-base: 250ms ease-out;
--transition-slow: 350ms ease-out;
--transition-bezier: cubic-bezier(0.4, 0, 0.2, 1);
```

### Micro-interactions
1. **Button Press**: Scale 0.98 transform
2. **Card Hover**: 2px elevation increase
3. **Success State**: Checkmark animation
4. **Loading**: Pulsing skeleton screens
5. **Error Shake**: Horizontal shake animation

### Feedback Patterns
- **Inline Validation**: Real-time field validation
- **Toast Notifications**: Bottom-right positioning
- **Progress Indicators**: Linear for determinate, circular for indeterminate
- **Success Confirmations**: Green check with subtle animation

### Loading States
1. **Skeleton Screens**: For content areas
2. **Spinner**: For button actions
3. **Progress Bar**: For multi-step processes
4. **Shimmer Effect**: For card placeholders

### Error Handling
- **Field Errors**: Red border with message below
- **Form Errors**: Summary at top with anchors
- **System Errors**: Full-page fallback with retry
- **Network Errors**: Offline indicator with queue

## Screen Specifications

### 1. **Onboarding Flow**

#### Screen: Welcome
- **Default**: Brand introduction with value props
- **Loading**: Button spinner during account creation
- **Error**: OAuth failure with email fallback
- **Success**: Redirect to profile setup

#### Screen: Profile Setup
- **Default**: Name, expertise, content goals form
- **Loading**: Validating LinkedIn connection
- **Empty**: Prompt to complete all fields
- **Error**: Validation messages inline
- **Success**: Progress to style analysis

#### Screen: Writing Style Analysis
- **Default**: LinkedIn connection or manual style selection
- **Loading**: Analyzing writing samples
- **Empty**: No posts found, manual selection
- **Error**: Connection failed, retry option
- **Success**: Style profile created

#### Screen: Topic Selection
- **Default**: Suggested topics based on profile
- **Loading**: Fetching trending topics
- **Empty**: Search for topics to add
- **Error**: Failed to load suggestions
- **Success**: Subscribed to selected topics

### 2. **Insight Discovery Dashboard**

#### Screen: Insights Feed
- **Default**: Grid/list of discovered insights
- **Loading**: Skeleton cards while fetching
- **Empty**: "No insights yet" with topic suggestions
- **Error**: "Unable to load" with retry
- **Success**: Populated feed with filters

#### Screen: Insight Detail
- **Default**: Full article with highlights
- **Loading**: Content streaming in
- **Empty**: Not applicable
- **Error**: Source unavailable message
- **Success**: Interactive insight view

### 3. **Content Generation Interface**

#### Screen: Content Creator
- **Default**: Template selector with editor
- **Loading**: AI generating content
- **Empty**: Blank canvas with prompts
- **Error**: Generation failed, retry option
- **Success**: Draft ready for editing

#### Screen: Content Preview
- **Default**: Platform-specific preview
- **Loading**: Rendering preview
- **Empty**: No content to preview
- **Error**: Preview unavailable
- **Success**: Accurate platform mockup

### 4. **Publishing Queue**

#### Screen: Calendar View
- **Default**: Monthly calendar with scheduled posts
- **Loading**: Fetching scheduled content
- **Empty**: "No posts scheduled" CTA
- **Error**: Calendar sync failed
- **Success**: Interactive scheduling interface

#### Screen: Publishing Status
- **Default**: List of pending/published posts
- **Loading**: Publishing in progress
- **Empty**: No posts in queue
- **Error**: Publishing failed with reason
- **Success**: Published with metrics link

## Component Implementation Notes

### Shadcn/ui Integration
All components should extend shadcn/ui base components with custom styling:

```tsx
// Example Button extension
import { Button as ShadcnButton } from "@/components/ui/button"

export const Button = styled(ShadcnButton, {
  // Custom design tokens
  '--button-height': 'var(--space-11)',
  '--button-padding': 'var(--space-4) var(--space-6)',
  '--button-font': 'var(--font-medium)',
  
  // Mobile optimizations
  '@mobile': {
    minHeight: '44px',
    fontSize: 'var(--text-base)'
  }
})
```

### Mobile-First Responsive Approach
```css
/* Base mobile styles */
.component {
  padding: var(--space-4);
  font-size: var(--text-base);
}

/* Tablet enhancement */
@media (min-width: 768px) {
  .component {
    padding: var(--space-6);
  }
}

/* Desktop enhancement */
@media (min-width: 1024px) {
  .component {
    padding: var(--space-8);
    font-size: var(--text-lg);
  }
}
```

### v0.dev Component Patterns
When creating v0.dev prompts, specify:
- Mobile-first responsive behavior
- Shadcn/ui component usage
- Professional, authority-driven styling
- Specific interaction states
- Accessibility requirements

Example v0.dev prompt structure:
```
Create a [component name] using shadcn/ui that:
- Uses mobile-first responsive design (320px, 768px, 1024px breakpoints)
- Follows professional/authority design with [primary-navy] color scheme
- Includes states: default, hover, active, focus, disabled, loading
- Has [specific micro-interactions]
- Meets WCAG AA accessibility standards
- Integrates with [specific data/props structure]
```

---

*This Design Specification Document provides the visual and interaction foundation for Seriously AI's MVP implementation. It prioritizes mobile-first professional design while maintaining the authority and credibility essential for the target audience of aspiring thought leaders.* 