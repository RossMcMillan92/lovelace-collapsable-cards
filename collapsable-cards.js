console.log(`%ccollapsable-cards\n%cVersion: ${'0.0.1'}`, 'color: rebeccapurple; font-weight: bold;', '');

class VerticalStackInCard extends HTMLElement {
  constructor() {
    super();
  }

  setConfig(config) {
    this.id = Math.round(Math.random() * 10000)
    this._cardSize = {};
    this._cardSize.promise = new Promise((resolve) => (this._cardSize.resolve = resolve));

    if (!config || !config.cards || !Array.isArray(config.cards)) {
      throw new Error('Supply the `cards` property');
    }

	let isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;
	if (config.defaultOpen == true) {
	  this.isToggled = true;
	} else if (config.defaultOpen == 'desktop-only' && !isMobile) {
	  this.isToggled = true;
	} else {
	  this.isToggled = false;
	}

    this._config = config;
    this._refCards = [];
    this.renderCard();
  }

  async renderCard() {
    const config = this._config;
    if (window.loadCardHelpers) {
      this.helpers = await window.loadCardHelpers();
    }
    const promises = config.cards.map((config) => this.createCardElement(config));
    this._refCards = await Promise.all(promises);

    // Create the card
    const card = document.createElement('ha-card');
    this.card = card
    const cardList = document.createElement('div');
    this.cardList = cardList
    card.style.overflow = 'hidden';
    this._refCards.forEach((card) => cardList.appendChild(card));
    this.cardList.className = 'card-list-' + this.id
    this.cardList.classList[this.isToggled ? 'add' : 'remove']('is-toggled')

    // create the button
    const toggleButton = this.createToggleButton()

    card.appendChild(toggleButton);
    card.appendChild(cardList);

    while (this.hasChildNodes()) {
      this.removeChild(this.lastChild);
    }
    this.appendChild(card);

    // Calculate card size
    this._cardSize.resolve();

    const styleTag = document.createElement('style')
    styleTag.innerHTML = this.getStyles()
    card.appendChild(styleTag);

    if (
      config.defaultOpen === 'contain-toggled' && 
      config.cards.filter((c) => this._hass.states[c.entity]?.state === "on")
        .length > 0
    ) {
      toggleButton.click();
    }
  }

  createToggleButton() {
    const toggleButton = document.createElement('button');
    toggleButton.innerHTML = this._config.title || 'Toggle'
    toggleButton.className = 'card-content toggle-button-' + this.id
    toggleButton.addEventListener('click', () => {
      this.isToggled = !this.isToggled
      this.styleCard(this.isToggled)
    })

    const icon = document.createElement('ha-icon');
    icon.className = 'toggle-button__icon-' + this.id
    icon.setAttribute('icon', 'mdi:chevron-down')
    this.icon = icon
    toggleButton.appendChild(icon)

    return toggleButton
  }

  styleCard(isToggled) {
    this.cardList.classList[isToggled ? 'add' : 'remove']('is-toggled')
    this.icon.setAttribute('icon', isToggled ? 'mdi:chevron-up' : 'mdi:chevron-down')
  }

  async createCardElement(cardConfig) {
    const createError = (error, origConfig) => {
      return createThing('hui-error-card', {
        type: 'error',
        error,
        origConfig
      });
    };

    const createThing = (tag, config) => {
      if (this.helpers) {
        if (config.type === 'divider') {
          return this.helpers.createRowElement(config);
        } else {
          return this.helpers.createCardElement(config);
        }
      }

      const element = document.createElement(tag);
      try {
        element.setConfig(config);
      } catch (err) {
        console.error(tag, err);
        return createError(err.message, config);
      }
      return element;
    };

    let tag = cardConfig.type;
    if (tag.startsWith('divider')) {
      tag = `hui-divider-row`;
    } else if (tag.startsWith('custom:')) {
      tag = tag.substr('custom:'.length);
    } else {
      tag = `hui-${tag}-card`;
    }

    const element = createThing(tag, cardConfig);
    element.hass = this._hass;
    element.addEventListener(
      'll-rebuild',
      (ev) => {
        ev.stopPropagation();
        this.createCardElement(cardConfig).then(() => {
          this.renderCard();
        });
      },
      { once: true }
    );
    return element;
  }

  set hass(hass) {
    this._hass = hass;
    if (this._refCards) {
      this._refCards.forEach((card) => {
        card.hass = hass;
      });
    }
  }

  _computeCardSize(card) {
    if (typeof card.getCardSize === 'function') {
      return card.getCardSize();
    }
    return customElements
      .whenDefined(card.localName)
      .then(() => this._computeCardSize(card))
      .catch(() => 1);
  }

  async getCardSize() {
    await this._cardSize.promise;
    const sizes = await Promise.all(this._refCards.map(this._computeCardSize));
    return sizes.reduce((a, b) => a + b);
  }

  getStyles() {
    return `
      .toggle-button-${this.id} {
        color: var(--primary-text-color);
        text-align: left;
        background: none;
        border: none;
        margin: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        border-radius: var(--ha-card-border-radius, 4px);
        ${this._config.buttonStyle || ''}
      }
      .toggle-button-${this.id}:focus {
        outline: none;
        background-color: var(--divider-color);
      }

      .card-list-${this.id} {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: 0;
        padding: 0;
        overflow: hidden;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        border: 0;
        white-space: nowrap;
      }

      .card-list-${this.id}.is-toggled {
        position: unset;
        width: unset;
        height: unset;
        margin: unset;
        padding: unset;
        overflow: unset;
        clip: unset;
        clip-path: unset;
        border: unset;
        white-space: unset;
      }

      .toggle-button__icon-${this.id} {
        color: var(--paper-item-icon-color, #aaa);
      }

      .type-custom-collapsable-cards {
        background: transparent;
      }
    `;
  }

}

customElements.define('collapsable-cards', VerticalStackInCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "collapsable-cards",
  name: "Collapsable Card",
  preview: false,
  description: "The Collapsable Card allows you to hide other cards behind a dropdown toggle."
});
