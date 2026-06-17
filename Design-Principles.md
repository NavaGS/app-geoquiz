Design a modern, premium quiz application interface inspired by the usability, clarity, and polish of products such as ChatGPT, Claude, Linear, Notion, and n8n.

The overall experience should feel calm, focused, intelligent, and effortless. Users should never need to consciously search the interface to determine what they should do next. At every stage, the primary action should be immediately obvious.

## Core Experience Principles

### Focus First

Every screen must have a single primary purpose.

* Landing page: Start quiz
* Quiz page: Answer question
* Results page: Review performance

Avoid presenting multiple competing actions simultaneously.

### Low Cognitive Load

Reduce visual noise and decision fatigue.

* Eliminate unnecessary UI elements.
* Present only the information required for the current step.
* Prefer simplicity over feature visibility.

### Clear Visual Hierarchy

Information should be prioritized in the following order:

1. Current question
2. Answer options
3. Progress information
4. Secondary controls

The user's eye should naturally flow from question → answer → next action.

### Progressive Disclosure

Reveal information only when it becomes relevant.

Examples:

* Explanations appear after answering.
* Detailed analytics appear on results screens.
* Advanced settings remain hidden until requested.

### Conversational Flow

The quiz should feel more like an interactive conversation than a traditional form.

Interactions should feel immediate and responsive:

* Answer selections provide instant feedback.
* Progress updates without page refreshes.
* Navigation feels continuous rather than page-based.
* State changes occur within the same context whenever possible.

### Fast Feedback

Every interaction should acknowledge user input immediately.

Users should always feel that the system is responsive and actively guiding them forward.

## Layout Guidelines

### Question View

The question view is the centerpiece of the experience.

Requirements:

* Question content is the dominant visual element.
* Content is centered within a constrained reading width (~700px maximum).
* Generous whitespace separates content sections.
* Supporting information such as progress indicators and timers remains visible but visually secondary.
* Answer options use large, accessible click/tap targets.
* Hover, focus, and selection states provide immediate visual confirmation.

The screen should feel distraction-free and highly readable.

## Motion Principles

Motion should communicate state changes rather than serve as decoration.

### Question Transition

When moving to the next question:

* Current content subtly fades away.
* Incoming content moves naturally into place.
* Total transition duration remains under 250ms.

### Answer Selection

When an answer is selected:

* Selection state appears immediately.
* Confirmation animation completes within 150ms.
* Feedback feels responsive but never distracting.

## Spacing System

Use a consistent spacing scale throughout the application:

* XS: 4px
* S: 8px
* M: 16px
* L: 24px
* XL: 32px
* XXL: 48px

Avoid arbitrary spacing values.

Whitespace should be used intentionally to create clarity, hierarchy, and breathing room.

## Color Principles

Use color sparingly and purposefully.

Primary accent colors should be reserved for:

* Active buttons
* Progress indicators
* Selected answers
* Key interactive states

Avoid multiple competing accent colors.

A successful visual balance should approximate:

* 80% neutral surfaces
* 15% typography and content
* 5% accent color

## Desired Outcome

The final experience should feel modern, premium, conversational, and highly polished. It should embody the same qualities that make products like ChatGPT, Claude, Linear, and Notion feel intuitive: clarity, restraint, confidence, and an obsessive focus on helping the user complete the current task with minimal effort.
