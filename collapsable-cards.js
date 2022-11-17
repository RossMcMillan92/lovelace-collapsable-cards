class CollapsableCards extends HTMLElement {

	constructor() {
		super();
		this.containers = ["grid", "custom:collapsable-cards", "vertical-stack", "horizontal-stack"];
		this.differentConfig = ["HUI-THERMOSTAT-CARD"];
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
		this._titleCard = null;
		this.renderCard();
	}

	async renderCard() {
		const config = this._config;
		if (window.loadCardHelpers) {
			this.helpers = await window.loadCardHelpers();
		}
		const promises = config.cards.map((config) => this.createCardElement(config));
		this._refCards = await Promise.all(promises);

		if (config.title_card) {
			this._titleCard = await this.createCardElement(config.title_card);
		}

		// Create the card
		const card = document.createElement('ha-expansion-panel');
		this.card = card;
		card.style.setProperty('--expansion-panel-content-padding', '0px')
		card.setAttribute('header', this._titleCard || this._config.title || 'Toggle');
		card.setAttribute('outlined', '');
		const cardList = document.createElement('div');
		cardList.id = "root";
		this._refCards.forEach((c) => cardList.appendChild(c));

		while (this.hasChildNodes()) {
			this.removeChild(this.lastChild);
		}
		this.injectStyles(card, this.getStyles());
		card.appendChild(cardList);
		this.appendChild(card);

		// Calculate card size
		this._cardSize.resolve();

		this.isToggled = config.defaultOpen === 'contain-toggled' ? this.isCardActive() : this.isToggled;

		if (this.isToggled) card.setAttribute('expanded', '');
	}

	getEntitiesNames(card) {
		card = card.hasOwnProperty('tagName') && this.differentConfig.includes(card.tagName) ? card.___config : card;

		if (this.containers.includes(card.type))
			return [].concat(... card.cards.map( (c) => this.getEntitiesNames(c) ));

		if (card.hasOwnProperty('entity'))
			return [card.entity];

		if (card.hasOwnProperty('entities'))
			return card.entities;

		return [];
	}

	isCardActive() {
		return this.getEntitiesNames(this._config).filter((e) => this._hass.states[e].state !== "off").length > 0
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

	redrawCard(oldHass) {
		if (this._config.defaultOpen === 'contain-toggled' && this._haveEntitiesChanged(oldHass)) this.renderCard();
	}

	set hass(hass) {
		let oldHass = this._hass;
		this._hass = hass;

		if (this._refCards) {
			this._refCards.forEach((card) => {
				card.hass = hass;
			});
		}

		if (this._titleCard) {
			this._titleCard.hass = hass;
		}
		this.redrawCard(oldHass);
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

	_haveEntitiesChanged(oldHass) {
		if (!this._hass || !oldHass) return true;

		for (const entity of this.getEntitiesNames(this._config)) {
			if (this._hass.states[entity].state !== oldHass.states[entity].state) return true;
		}

		return false;
	}

	async getCardSize() {
		await this._cardSize.promise;
		const sizes = await Promise.all(this._refCards.map(this._computeCardSize));
		return sizes.reduce((a, b) => a + b);
	}

	injectStyles(element, css) {
		const styleTag = document.createElement('style')
		styleTag.innerHTML = css
		element.appendChild(styleTag);
	}

	getStyles() {
		return `
		#root {
          display: flex;
          flex-direction: column;
          height: 100%;
        } 
		#root > * {
          margin: var(
            --vertical-stack-card-margin,
            var(--stack-card-margin, 4px 0)
          );
        }
        #root > *:last-child {
          margin-bottom: 0;
        }
		`
	}

}

customElements.define('collapsable-cards', CollapsableCards);

window.customCards = window.customCards || [];
window.customCards.push({
							type: "collapsable-cards",
							name: "Collapsable Card",
							preview: false,
							description: "The Collapsable Card allows you to hide other cards behind a dropdown toggle."
						});
