# Collapsable cards

Hide a list of cards behind a dropdown.

https://user-images.githubusercontent.com/3329319/117338763-db269b80-ae96-11eb-8b1a-36e96d3b3d67.mov

Big thanks to [ofekashery, the author of vertical-stack-in-card](https://github.com/ofekashery/vertical-stack-in-card), whose code I copied to make this card.

## Options

| Name       | Type    | Default      | Description                               |
| ---------- | ------- | ------------ | ----------------------------------------- |
| type       | string  |  | `custom:collapsable-cards`           |
| cards      | list    |  | List of cards                         |
| defaultOpen | boolean | false | Whether the cards should be visible by default|
| title      | string  | "Toggle" | Dropdown title                       |
| buttonStyle| string  | "" | CSS overrides for the dropdown toggle button |

## Installation

[In-depth tutorial here](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins), otherwise follow these steps:

1. Install the `collapsable-cards` card by copying `collapsable-cards.js` to `<config directory>/www/collapsable-cards.js`

2. On your lovelace dashboard
    1. Click options
    2. Edit dashboard
    3. Click Options
    4. Manage resources
    5. Add resource
        - URL: /local/collapsable-cards.js
        - Resource type: JavaScript module

3. Add a custom card to your dashboard


```yaml
type: 'custom:collapsable-cards'
title: Office
cards:
  - type: entities
    entities:
      - entity: light.office_desk_led
      - entity: light.office_led_strips
      - entity: sensor.ross_work_laptop_is_on
    show_header_toggle: false
```
