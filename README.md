# Slide To Action

A simple slide to action React component.

![demo](./demo.gif)

## Installation

```bash
yarn add slide-to-action
# or with npm
npm install slide-to-action
```

## Usage

```jsx
import { SlideToAction } from 'slide-to-action';

const App = () => {
  return (
    <SlideToAction
      actionsLeft={[1, 2, 3]} // array of react-elements
      actionsRight={[4, 5]} // array of react-elements
      borderRadius='0.5rem' // string | number
      borderRadiusStrategy='all' // 'all' | 'actions-only' | 'card-only'
      actionWidthPercentage={0.15} // number between 0 and 1
      getActionTheme={(i) => {
        // function to get the theme of the action based on its index & position
        return {
          backgroundColor: `hsl(${i * 70}, 80%, 50%)`,
          color: `hsl(${i * 70}, 80%, 30%)`,
        };
      }}
    >
      <div>Slide Me!</div>
    </SlideToAction>
  );
};
```
