import View from './View.js';

// Simple fraction function to replace the fractional library
const toFraction = function(decimal) {
  if (!decimal || decimal === 0) return '';
  
  // Common fractions
  const fractions = {
    0.5: '1/2',
    0.33: '1/3',
    0.67: '2/3',
    0.25: '1/4',
    0.75: '3/4',
    0.2: '1/5',
    0.4: '2/5',
    0.6: '3/5',
    0.8: '4/5',
    0.125: '1/8',
    0.375: '3/8',
    0.625: '5/8',
    0.875: '7/8'
  };
  
  // Check for exact matches
  const rounded = Math.round(decimal * 1000) / 1000;
  if (fractions[rounded]) {
    return fractions[rounded];
  }
  
  // For other decimals, return as is with one decimal place
  return decimal % 1 === 0 ? decimal.toString() : decimal.toFixed(1);
};

class RecipeView extends View {
  _parentElement = document.querySelector('.recipe');

  addHandlerRender(handler) {
    ['hashchange', 'load'].forEach(ev => {
      window.addEventListener(ev, handler);
    });
  }

  _generateMarkup() {
    return `
      <figure class="recipe__fig">
        <img src="${this._data.image_url || this._data.image || './forkify/src/img/logo.png'}" alt="${this._data.title}" class="recipe__img" />
        <h1 class="recipe__title">
          <span>${this._data.title}</span>
        </h1>
      </figure>

      <div class="recipe__details">
        <div class="recipe__info">
          <svg class="recipe__info-icon">
            <use href="${this._icons}#icon-clock"></use>
          </svg>
          <span class="recipe__info-data recipe__info-data--minutes">${this._data.cooking_time || this._data.cookingTime || 0}</span>
          <span class="recipe__info-text">minutes</span>
        </div>
        <div class="recipe__info">
          <svg class="recipe__info-icon">
            <use href="${this._icons}#icon-users"></use>
          </svg>
          <span class="recipe__info-data recipe__info-data--people">${this._data.servings || 1}</span>
          <span class="recipe__info-text">servings</span>
        </div>

        <div class="recipe__user-generated">
          <svg>
            <use href="${this._icons}#icon-user"></use>
          </svg>
        </div>
        <button class="btn--round">
          <svg>
            <use href="${this._icons}#icon-bookmark-fill"></use>
          </svg>
        </button>
      </div>

      <div class="recipe__ingredients">
        <h2 class="heading--2">Recipe ingredients</h2>
        <ul class="recipe__ingredient-list">
          ${this._data.ingredients?.map(this._generateMarkupIngredient).join('') || ''}
        </ul>
      </div>

      <div class="recipe__directions">
        <h2 class="heading--2">How to cook it</h2>
        <p class="recipe__directions-text">
          This recipe was carefully designed and tested by
          <span class="recipe__publisher">${this._data.publisher}</span>. Please check out
          directions at their website.
        </p>
        <a
          class="btn--small recipe__btn"
          href="${this._data.source_url || this._data.sourceUrl || '#'}"
          target="_blank"
        >
          <span>Directions</span>
          <svg class="search__icon">
            <use href="${this._icons}#icon-arrow-right"></use>
          </svg>
        </a>
      </div>
    `;
  }

  _generateMarkupIngredient = (ing) => {
    return `
      <li class="recipe__ingredient">
        <svg class="recipe__icon">
          <use href="${this._icons}#icon-check"></use>
        </svg>
        <div class="recipe__quantity">${
          ing.quantity ? toFraction(ing.quantity) : ''
        }</div>
        <div class="recipe__description">
          <span class="recipe__unit">${ing.unit || ''}</span>
          ${ing.description || ''}
        </div>
      </li>
    `;
  };

  showLocalIndicator(message = 'Using sample recipe (API unavailable)') {
    const indicator = document.createElement('div');
    indicator.className = 'message recipe__indicator';
    indicator.innerHTML = `
      <div>
        <svg>
          <use href="${this._icons}#icon-smile"></use>
        </svg>
      </div>
      <p>${message}</p>
    `;
    this._parentElement.insertAdjacentElement('afterbegin', indicator);
  }

  clearLocalIndicator() {
    const existing = this._parentElement.querySelector('.recipe__indicator');
    if (existing) existing.remove();
  }
}

export default new RecipeView();

