# Responsive Design Guidelines for DoProof Student Features

## Overview

This document outlines the responsive design approach and best practices for the DoProof student platform. We follow a mobile-first methodology with progressive enhancement for larger screens.

## Breakpoints

We use the following breakpoints matching Tailwind CSS defaults:

```typescript
const breakpoints = {
  sm: 640px,   // Small tablets and large phones
  md: 768px,   // Tablets
  lg: 1024px,  // Laptops and small desktops
  xl: 1280px,  // Desktops
  '2xl': 1536px // Large desktops
};
```

## Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```css
/* Mobile (default) */
.container {
  padding: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 1.5rem;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    padding: 2rem;
  }
}
```

## Using the Responsive Hook

```typescript
import { useResponsive } from '../hooks/useResponsive';

const MyComponent = () => {
  const {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    width,
    height,
    orientation,
    isTouchDevice,
    isBreakpoint,
    getResponsiveValue
  } = useResponsive();

  // Conditional rendering
  if (isMobile) {
    return <MobileView />;
  }

  // Responsive values
  const columns = getResponsiveValue({
    base: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4
  });

  // Check specific breakpoint
  const showSidebar = isBreakpoint('lg');

  return <DesktopView columns={columns} />;
};
```

## Responsive Components

### ResponsiveLayout

Wrapper component for consistent page layout:

```typescript
import ResponsiveLayout from '../components/student/ResponsiveLayout';

const MyPage = () => (
  <ResponsiveLayout pageTitle="My Page">
    <div>Page content</div>
  </ResponsiveLayout>
);
```

### ResponsiveCard

Card component with automatic padding adjustment:

```typescript
import ResponsiveCard from '../components/student/ResponsiveCard';

<ResponsiveCard
  title="Card Title"
  subtitle="Card subtitle"
  padding="md"
  elevation="md"
>
  <p>Card content</p>
</ResponsiveCard>
```

### ResponsiveGrid

Grid component with responsive columns:

```typescript
import ResponsiveGrid from '../components/student/ResponsiveGrid';

<ResponsiveGrid
  columns={{ base: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
  gap="md"
>
  {items.map(item => (
    <div key={item.id}>{item.content}</div>
  ))}
</ResponsiveGrid>
```

## Responsive Utilities

### CSS Classes

```css
/* Container */
.container-responsive {
  /* Automatically adjusts max-width and padding */
}

/* Typography */
.text-responsive-base { /* Scales from 0.875rem to 1rem */ }
.text-responsive-lg { /* Scales from 1rem to 1.125rem */ }
.text-responsive-xl { /* Scales from 1.125rem to 1.25rem */ }

/* Spacing */
.spacing-responsive-sm { /* Scales from 0.75rem to 1rem */ }
.spacing-responsive-md { /* Scales from 1rem to 1.5rem */ }
.spacing-responsive-lg { /* Scales from 1.5rem to 3rem */ }

/* Grid */
.grid-responsive { /* 1 column mobile, 2+ columns desktop */ }
.grid-responsive-2 { /* 2 columns on sm+ */ }
.grid-responsive-3 { /* 3 columns on md+ */ }
.grid-responsive-4 { /* 4 columns on lg+ */ }

/* Visibility */
.hide-mobile { /* Hidden on mobile, visible on tablet+ */ }
.show-mobile { /* Visible on mobile, hidden on tablet+ */ }
.hide-tablet { /* Hidden on tablet only */ }
.show-tablet { /* Visible on tablet only */ }
.hide-desktop { /* Hidden on desktop+ */ }
.show-desktop { /* Visible on desktop+ */ }
```

## Layout Patterns

### Navigation

#### Desktop Navigation
- Horizontal navigation bar
- All items visible
- Hover states

#### Mobile Navigation
- Hamburger menu
- Bottom navigation bar for primary actions
- Slide-out drawer for full menu

```typescript
<ResponsiveNavigation currentPath="/student/dashboard" />
```

### Cards and Lists

#### Desktop
- Multi-column grid layout
- Hover effects
- More detailed information

#### Mobile
- Single column stack
- Touch-friendly tap targets
- Condensed information

### Forms

#### Desktop
- Multi-column layouts for related fields
- Inline validation messages
- Side-by-side buttons

#### Mobile
- Single column layout
- Full-width inputs
- Stacked buttons

### Tables

#### Desktop
- Full table with all columns
- Sortable headers
- Hover row highlighting

#### Mobile
- Card-based layout
- Horizontal scroll for complex tables
- Collapsible rows

```typescript
<div className="table-responsive">
  <table>
    {/* Table content */}
  </table>
</div>
```

### Modals

#### Desktop
- Centered on screen
- Fixed max-width
- Backdrop overlay

#### Mobile
- Slide up from bottom
- Full width
- Optimized for touch

```css
.modal-responsive {
  /* Automatically adjusts positioning and size */
}
```

## Touch Optimization

### Touch Targets

Minimum touch target size: 44x44 pixels

```typescript
import { getTouchTargetSize } from '../utils/accessibility';

<button className={getTouchTargetSize()}>
  Tap Me
</button>
```

### Touch Gestures

- Swipe to dismiss modals
- Pull to refresh lists
- Pinch to zoom images
- Long press for context menus

### Touch Feedback

```css
.touch-feedback {
  transition: background-color 0.1s;
}

.touch-feedback:active {
  background-color: rgba(0, 0, 0, 0.05);
}
```

## Typography

### Responsive Font Sizes

```typescript
// Base sizes scale automatically
const fontSize = {
  xs: '0.75rem',      // 12px
  sm: '0.875rem',     // 14px
  base: '1rem',       // 16px (mobile) / 16px (desktop)
  lg: '1.125rem',     // 18px
  xl: '1.25rem',      // 20px
  '2xl': '1.5rem',    // 24px
  '3xl': '1.875rem',  // 30px
};
```

### Line Height

Maintain readable line heights:
- Body text: 1.5 (150%)
- Headings: 1.2 (120%)
- Tight text: 1.25 (125%)

### Text Wrapping

```css
/* Prevent orphans */
.text-balance {
  text-wrap: balance;
}

/* Truncate long text */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Multi-line truncation */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

## Images and Media

### Responsive Images

```typescript
<img
  src={imageSrc}
  alt="Description"
  className="img-responsive"
  loading="lazy"
/>
```

### Picture Element

```typescript
<picture>
  <source
    media="(min-width: 1024px)"
    srcSet="image-large.jpg"
  />
  <source
    media="(min-width: 768px)"
    srcSet="image-medium.jpg"
  />
  <img
    src="image-small.jpg"
    alt="Description"
    className="img-responsive"
  />
</picture>
```

### Video

```typescript
<video
  className="w-full h-auto"
  controls
  playsInline
>
  <source src="video.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
```

## Performance Optimization

### Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const MobileView = lazy(() => import('./MobileView'));
const DesktopView = lazy(() => import('./DesktopView'));

const MyComponent = () => {
  const { isMobile } = useResponsive();
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isMobile ? <MobileView /> : <DesktopView />}
    </Suspense>
  );
};
```

### Lazy Loading

```typescript
import LazyImage from '../components/LazyImage';

<LazyImage
  src="large-image.jpg"
  alt="Description"
  placeholder="placeholder.jpg"
/>
```

### Virtual Scrolling

For long lists on mobile:

```typescript
import VirtualizedJobList from '../components/student/VirtualizedJobList';

<VirtualizedJobList
  items={jobs}
  itemHeight={120}
  overscan={3}
/>
```

## Testing Responsive Design

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Test different device presets
4. Test custom viewport sizes
5. Test landscape/portrait orientation

### Real Device Testing

Test on actual devices:
- iPhone (iOS Safari)
- Android phone (Chrome)
- iPad (iOS Safari)
- Android tablet (Chrome)
- Desktop browsers (Chrome, Firefox, Safari, Edge)

### Responsive Testing Checklist

- [ ] Layout works at all breakpoints
- [ ] Text is readable at all sizes
- [ ] Images scale properly
- [ ] Navigation is accessible
- [ ] Forms are usable
- [ ] Touch targets are adequate
- [ ] No horizontal scrolling
- [ ] Content fits viewport
- [ ] Performance is acceptable
- [ ] Orientation changes work

## Common Patterns

### Responsive Container

```typescript
<div className="container-responsive">
  <div className="grid-responsive-3 gap-6">
    {items.map(item => (
      <ResponsiveCard key={item.id}>
        {item.content}
      </ResponsiveCard>
    ))}
  </div>
</div>
```

### Responsive Stack

```typescript
<div className="flex-responsive">
  <div className="flex-1">Left content</div>
  <div className="flex-1">Right content</div>
</div>
```

### Responsive Sidebar

```typescript
const { isDesktop } = useResponsive();

<div className="flex">
  {isDesktop && (
    <aside className="w-64 flex-shrink-0">
      <Sidebar />
    </aside>
  )}
  <main className="flex-1">
    <Content />
  </main>
</div>
```

## Best Practices

1. **Mobile First**: Always start with mobile design
2. **Touch Friendly**: Ensure adequate touch target sizes
3. **Performance**: Optimize for slower mobile connections
4. **Content Priority**: Show most important content first
5. **Progressive Enhancement**: Add features for larger screens
6. **Flexible Layouts**: Use flexbox and grid
7. **Relative Units**: Use rem/em instead of px
8. **Test Early**: Test on real devices frequently
9. **Accessibility**: Ensure responsive design is accessible
10. **Consistency**: Maintain consistent experience across devices

## Resources

- [Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)
- [Mobile First Design](https://www.lukew.com/ff/entry.asp?933)
- [Touch Target Sizes](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
